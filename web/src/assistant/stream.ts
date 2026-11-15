import type { Event } from "./types";

/** POST and read server-sent events as they arrive. Throws {status} when the request is refused up front. */
export async function streamEvents(path: string, body: unknown, onEvent: (e: Event) => void): Promise<void> {
  const res = await fetch(path, {
    method: "POST", credentials: "same-origin",
    headers: { "content-type": "application/json" }, body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    let code = String(res.status);
    try { code = (await res.json()).detail ?? code; } catch { /* not JSON */ }
    throw Object.assign(new Error(code), { status: res.status, code });
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let cut: number;
    while ((cut = buffer.indexOf("\n\n")) >= 0) {
      const chunk = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      for (const line of chunk.split("\n")) {
        if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6)) as Event);
      }
    }
  }
}
