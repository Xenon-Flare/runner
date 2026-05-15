export function extractOpenAiResponsesText(response: unknown): string {
  if (response == null || typeof response !== "object") return "";
  type Resp = {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };
  const r = response as Resp;
  return (
    r.output_text ??
    r.output
      ?.map((o) => o.content?.map((c) => c.text).join(""))
      .join("\n") ??
    ""
  );
}
