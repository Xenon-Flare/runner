export function toolResultPayload(ok: boolean, detail: string): string {
  return JSON.stringify({ ok, detail });
}
