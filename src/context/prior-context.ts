import { MAX_SUMMARY_OUTPUT_CHARS } from "../bootstrap/config.js";
import type { RunnerContextPayload } from "../cloud/schemas.js";
import { persistPriorSummary, summarizePriorBlock } from "./prior-summary.js";

export async function buildModelInputFromContext(
  workspaceId: string,
  ctx: RunnerContextPayload,
): Promise<string> {
  if (ctx.messageCount === 0) {
    const idea = (ctx.legacyIdea ?? "").trim();
    if (!idea) throw new Error("empty_context");
    const parts: string[] = [];
    if (ctx.title) parts.push(`Title: ${ctx.title}`);
    parts.push(idea);
    return parts.join("\n\n---\n\n");
  }

  let priorSection = "";
  if (ctx.priorMessages.length > 0) {
    if (!ctx.priorNeedsSummarization) {
      priorSection = ctx.priorTextVerbatim;
    } else if (ctx.storedSummaryCoversPrior && ctx.storedPriorSummary) {
      console.log(
        `[runner] prior reuse ${ctx.storedPriorSummary.fromMessageId} → ${ctx.storedPriorSummary.throughMessageId}`,
      );
      priorSection = ctx.storedPriorSummary.text;
    } else {
      console.log(
        `[runner] prior summarize (~${ctx.priorTokenEstimate} est. tokens)`,
      );
      try {
        priorSection = await summarizePriorBlock(ctx.priorTextVerbatim);
      } catch (e) {
        console.error("[runner] summarize failed, using truncated verbatim", e);
        priorSection =
          ctx.priorTextVerbatim.length > MAX_SUMMARY_OUTPUT_CHARS
            ? "…(truncated)\n\n" +
              ctx.priorTextVerbatim.slice(-MAX_SUMMARY_OUTPUT_CHARS)
            : ctx.priorTextVerbatim;
      }
      await persistPriorSummary(
        workspaceId,
        priorSection,
        ctx.priorMessages[0]!.id,
        ctx.priorMessages[ctx.priorMessages.length - 1]!.id,
      );
    }
  }

  const parts: string[] = [];
  if (ctx.title) parts.push(`Title: ${ctx.title}`);
  if (priorSection) {
    parts.push(`### Earlier context (may be summarized)\n\n${priorSection}`);
  }
  parts.push(`### Recent user messages\n\n${ctx.recentText}`);
  return parts.join("\n\n---\n\n");
}
