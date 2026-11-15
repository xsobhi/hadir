import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useLang } from "../i18n";
import { streamEvents } from "./stream";
import { apply, type Event, type Item, type Pending } from "./types";

export type Thread = { id: string; title: string; updatedAt: string };

export function useAssistant(threadId: string | undefined, onThread: (id: string) => void) {
  const { lang } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  // A thread this hook just created is already on screen; reloading it would wipe the live stream.
  const created = useRef<string | null>(null);

  const loadThreads = useCallback(async () => {
    setThreads((await api.get<{ threads: Thread[] }>("/api/assistant/threads")).threads);
  }, []);
  useEffect(() => { void loadThreads(); }, [loadThreads]);
  useEffect(() => {
    setError(null);
    if (!threadId) { setItems([]); setPending(null); return; }
    if (threadId === created.current) return;
    api.get<{ items: Event[]; pending: Pending }>(`/api/assistant/threads/${threadId}`)
      .then((r) => { setItems(r.items.reduce(apply, [] as Item[])); setPending(r.pending); })
      .catch(() => setError("failed"));
  }, [threadId]);

  const run = useCallback(async (path: string, body: unknown) => {
    setStreaming(true);
    setError(null);
    try {
      await streamEvents(path, body, (e) => {
        if (e.type === "approval" || e.type === "done") setPending(e.pending);
        else if (e.type === "error") setError("failed");
        else setItems((cur) => apply(cur, e));
      });
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(code === "daily_limit" || code === "site_limit" ? "limit" : code === "thread_busy" ? "busy" : "failed");
    } finally {
      setStreaming(false);
      void loadThreads();
    }
  }, [loadThreads]);

  const send = useCallback(async (text: string) => {
    let id = threadId;
    if (!id) {
      id = (await api.post<{ id: string }>("/api/assistant/threads")).id;
      created.current = id;
      onThread(id);
    }
    setItems((cur) => [...cur, { kind: "user", text }]);
    await run(`/api/assistant/threads/${id}/messages`, { message: text, lang });
  }, [threadId, onThread, run, lang]);

  const decide = useCallback(async (approved: boolean) => {
    if (!threadId || !pending) return;
    setItems((cur) => [...cur, { kind: "decision", approved, actions: pending.actions }]);
    setPending(null);
    await run(`/api/assistant/threads/${threadId}/resume`, { approved, lang });
  }, [threadId, pending, run, lang]);

  return { items, pending, streaming, error, threads, send, decide };
}
