export type Action = { id: string; name: string; args: Record<string, unknown> };
export type Pending = { actions: Action[] } | null;
export type Notice = { text: string; rounds: number; student?: string; course?: string };
export type Step = {
  kind: "step"; callId: string; name: string; args: Record<string, unknown>; done: boolean; ok: boolean;
  notice?: Notice; reflection: { stage: string; verdict?: string }[];
};
export type Item =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string }
  | { kind: "decision"; approved: boolean; actions: Action[] }
  | Step;

/** The raw events from the server: live stream and stored transcript share these shapes. */
export type Event =
  | { type: "token"; text: string }
  | { type: "user"; text: string }
  | { type: "assistant"; text: string }
  | { type: "tool_call"; name: string; args: Record<string, unknown>; callId: string }
  | { type: "tool_result"; name: string; ok: boolean; callId: string; notice?: Notice }
  | { type: "reflection"; stage: string; round: number; verdict?: string }
  | { type: "approval"; pending: Pending }
  | { type: "done"; pending: Pending }
  | { type: "error"; message: string };

/** Fold one event into the conversation. Tokens extend the trailing assistant item. */
export function apply(items: Item[], e: Event): Item[] {
  const next = items.slice();
  const lastStep = () => [...next].reverse().find((i): i is Step => i.kind === "step" && !i.done);
  switch (e.type) {
    case "token": {
      const last = next[next.length - 1];
      if (last?.kind === "assistant") next[next.length - 1] = { ...last, text: last.text + e.text };
      else next.push({ kind: "assistant", text: e.text });
      return next;
    }
    case "user": return [...next, { kind: "user", text: e.text }];
    case "assistant": return [...next, { kind: "assistant", text: e.text }];
    case "tool_call":
      return [...next, { kind: "step", callId: e.callId, name: e.name, args: e.args, done: false, ok: true, reflection: [] }];
    case "tool_result":
      return next.map((i) => (i.kind === "step" && i.callId === e.callId ? { ...i, done: true, ok: e.ok, notice: e.notice } : i));
    case "reflection": {
      const step = lastStep();
      return step ? next.map((i) => (i === step ? { ...step, reflection: [...step.reflection, { stage: e.stage, verdict: e.verdict }] } : i)) : next;
    }
    default:
      return next;
  }
}
