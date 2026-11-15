import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "../api/client";
import type { User } from "../api/types";
import { useBoot } from "../ssr/context";

type Ctx = {
  user: User | null | undefined; // undefined while the first check runs
  setUser: (u: User | null) => void;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const boot = useBoot();
  const known = "/api/auth/me" in boot.data;
  const [user, setUser] = useState<User | null | undefined>(
    known ? ((boot.data["/api/auth/me"] as { user?: User } | null)?.user ?? null) : undefined);
  useEffect(() => {
    if (known) return;
    api.get<{ user: User }>("/api/auth/me")
      .then((r) => setUser(r.user))
      .catch((e) => setUser(e instanceof ApiError && e.status === 401 ? null : null));
  }, [known]);
  const signOut = useCallback(async () => {
    await api.post("/api/auth/logout").catch(() => undefined);
    setUser(null);
  }, []);
  const value = useMemo(() => ({ user, setUser, signOut }), [user, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Ctx {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
