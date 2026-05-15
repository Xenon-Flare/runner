/**
 * Helpers for non-streaming `responses.create` payloads where `output`
 * may contain `function_call` items.
 */

export type FunctionCallOut = {
  type: "function_call_output";
  call_id: string;
  output: string;
};

export type FunctionCallItem = {
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
};

/** Minimal response shape used after non-streaming `responses.create`. */
export type OpenAiSlimResponse = {
  id: string;
  status?: string;
  output?: unknown[];
  output_text?: string;
};

export function listFunctionCalls(response: unknown): FunctionCallItem[] {
  if (response == null || typeof response !== "object") return [];
  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return [];
  const out: FunctionCallItem[] = [];
  for (const item of output) {
    if (typeof item !== "object" || item === null) continue;
    const o = item as Record<string, unknown>;
    if (o.type !== "function_call") continue;
    const call_id = typeof o.call_id === "string" ? o.call_id : "";
    const name = typeof o.name === "string" ? o.name : "";
    const args = typeof o.arguments === "string" ? o.arguments : "";
    if (!call_id || !name) continue;
    out.push({ type: "function_call", call_id, name, arguments: args });
  }
  return out;
}
