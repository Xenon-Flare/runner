import { model, openai } from "../bootstrap/config.js";
import { withOpenAIRetries } from "../shared/with-retries.js";
import {
  listFunctionCalls,
  type FunctionCallOut,
  type OpenAiSlimResponse,
} from "./openai-responses-function-calls.js";
import { extractOpenAiResponsesText } from "./openai-text.js";
import { applyToolCall, type RunnerAccumulator } from "./tool-dispatch.js";
import { MAX_TOOL_ROUNDS, runnerTools } from "./tool-definitions.js";
import { buildRunnerInstructions } from "./instructions.js";
import { normalizeAssistantMessage } from "./assemble-runner-payload.js";

export type ToolLoopResult = {
  assistantMessage: string;
  previousResponseId: string;
};

export async function runToolLoop(
  acc: RunnerAccumulator,
  initialInput: string | FunctionCallOut[],
  previousResponseId: string | null,
): Promise<ToolLoopResult> {
  const instructions = buildRunnerInstructions();
  let nextInput: string | FunctionCallOut[] = initialInput;
  let prevId = previousResponseId;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = (await withOpenAIRetries(
      `OpenAI responses.create (tool round ${round + 1})`,
      () =>
        prevId
          ? openai.responses.create({
              model,
              instructions,
              tools: runnerTools,
              tool_choice: "auto",
              parallel_tool_calls: true,
              stream: false,
              previous_response_id: prevId,
              input: nextInput as FunctionCallOut[],
            })
          : openai.responses.create({
              model,
              instructions,
              tools: runnerTools,
              tool_choice: "auto",
              parallel_tool_calls: true,
              stream: false,
              input: nextInput as string,
            }),
    )) as OpenAiSlimResponse;

    prevId = response.id;
    const status = response.status;
    if (status && status !== "completed") {
      throw new Error(`OpenAI response status: ${status}`);
    }

    const calls = listFunctionCalls(response);
    if (calls.length === 0) {
      return {
        assistantMessage: normalizeAssistantMessage(
          extractOpenAiResponsesText(response),
        ),
        previousResponseId: response.id,
      };
    }

    nextInput = calls.map((call) => ({
      type: "function_call_output" as const,
      call_id: call.call_id,
      output: applyToolCall(acc, call.name, call.arguments),
    }));
  }

  throw new Error("tool loop exceeded max rounds");
}
