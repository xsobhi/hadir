import { useCallback, useEffect, useRef, useState } from "react";
import { useBoot } from "../ssr/context";
import { api } from "./client";

/** GET a resource. On the first render it uses what the server already fetched for this page (so the HTML
 * arrives filled in and hydration matches); later visits fetch fresh. Keeps the last value while refreshing. */
export function useData<T>(path: string | null) {
  const boot = useBoot();
  const primed = path !== null && path in boot.data ? (boot.data[path] as T) : undefined;
  const [data, setData] = useState<T | null>(primed ?? null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(Boolean(path) && primed === undefined);
  const skipFirst = useRef(primed !== undefined);
  const current = useRef(path);
  const load = useCallback(async () => {
    if (!path) return;
    current.current = path;
    setLoading(true);
    try {
      const value = await api.get<T>(path);
      if (current.current === path) {
        setData(value);
        setError(null);
      }
    } catch (e) {
      if (current.current === path) setError(e);
    } finally {
      if (current.current === path) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      if (path) delete boot.data[path]; // used once: the next mount of this path fetches fresh data
      return;
    }
    void load();
  }, [load, boot, path]);
  return { data, error, loading, reload: load, setData };
}
