import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./client";

/** GET a resource; keeps the last good value while refreshing, so the layout never jumps. */
export function useData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(Boolean(path));
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
    void load();
  }, [load]);
  return { data, error, loading, reload: load, setData };
}
