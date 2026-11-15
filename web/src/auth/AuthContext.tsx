import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError } from "../api/client";
import type { User } from "../api/types";

type Ctx = {
  user: User | null | undefined; // undefined while the first check runs
  setUser: (u: User | null) => void;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    api.get<{ user: User }>("/api/auth/me")
      .then((r) => setUser(r.user))
      .catch((e) => setUser(e instanceof ApiError && e.status === 401 ? null : null));
  }, []);
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
