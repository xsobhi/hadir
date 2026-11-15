import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { User } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { PublicBar } from "../components/public/PublicBar";
import { useLang } from "../i18n";

/** Sign in and sign up share one compact form; `mode` picks the fields and the endpoint. */
export default function SignIn({ mode }: { mode: "in" | "up" }) {
  const { t } = useLang();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [v, setV] = useState({ name: "", email: "", password: "", department: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/app" replace />;
  const s = mode === "in" ? t.auth.signIn : t.auth.signUp;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = mode === "in"
        ? await api.post<{ user: User }>("/api/auth/login", { email: v.email, password: v.password })
        : await api.post<{ user: User }>("/api/auth/register", v);
      setUser(r.user);
      navigate("/app");
    } catch (e2) {
      const code = e2 instanceof ApiError ? e2.code : "";
      setErr(code === "wrong_credentials" ? t.auth.signIn.wrong : code === "too_many" ? t.auth.signIn.tooMany
        : code === "email_taken" ? t.auth.signUp.taken : code === "bad_email" ? t.auth.signUp.badEmail : t.loadFailed);
    } finally {
      setBusy(false);
    }
  };
  const field = (k: keyof typeof v, label: string, type = "text", extra: Record<string, unknown> = {}) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} className="input" type={type} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} {...extra} />
    </div>
  );
  return (
    <div className="public">
      <PublicBar />
      <main className="auth-wrap">
        <form className="panel auth-form" onSubmit={submit}>
          <h1>{s.title}</h1>
          {mode === "up" && field("name", t.auth.signUp.name, "text", { required: true, minLength: 2, autoComplete: "name" })}
          {field("email", t.auth.signIn.email, "email", { required: true, dir: "ltr", autoComplete: "email" })}
          {field("password", t.auth.signIn.password, "password", {
            required: true, minLength: mode === "up" ? 8 : 1, dir: "ltr",
            autoComplete: mode === "up" ? "new-password" : "current-password", "aria-describedby": mode === "up" ? "pw-hint" : undefined,
          })}
          {mode === "up" && <p id="pw-hint" className="muted small field-hint">{t.auth.signUp.passwordHint}</p>}
          {mode === "up" && field("department", t.auth.signUp.department, "text", { autoComplete: "organization" })}
          {err && <p className="error-text" role="alert">{err}</p>}
          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>{s.submit}</button>
          <p className="muted">
            {mode === "in" ? t.auth.signIn.noAccount : t.auth.signUp.haveAccount}{" "}
            <Link className="link" to={mode === "in" ? "/signup" : "/signin"}>{mode === "in" ? t.auth.welcome.signUp : t.auth.welcome.signIn}</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
