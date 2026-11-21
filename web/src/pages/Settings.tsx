import { useState, type FormEvent } from "react";
import { api } from "../api/client";
import type { User } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { ProfilePicture } from "../components/profile/ProfilePicture";
import { Shell } from "../components/Shell";
import { useToast } from "../components/ui/Toast";
import { useLang } from "../i18n";

function ProfileForm({ user }: { user: User }) {
  const { t } = useLang();
  const { setUser } = useAuth();
  const toast = useToast();
  const [v, setV] = useState({ name: user.name, title: user.title, department: user.department, gender: user.gender ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try { const r = await api.patch<{ user: User }>("/api/profile", v); setUser(r.user); toast(t.saved, "success"); }
    catch { setError(t.settings.failed); } finally { setBusy(false); }
  };
  return <form className="card form-grid" onSubmit={submit}>
    <h2 className="span-2">{t.settings.profile}</h2><p className="muted span-2">{t.settings.localHint}</p>
    {(["name", "title", "department"] as const).map((key) => <div className="field span-2" key={key}>
      <label htmlFor={`profile-${key}`}>{t.settings[key]}</label>
      <input id={`profile-${key}`} className="input" value={v[key]} required={key === "name"} minLength={key === "name" ? 2 : undefined}
        maxLength={key === "department" ? 120 : 80} onChange={(e) => setV({ ...v, [key]: e.target.value })} />
    </div>)}
    <div className="field span-2"><label htmlFor="profile-email">{t.settings.email}</label>
      <input id="profile-email" className="input" type="email" value={user.email} readOnly dir="ltr" /></div>
    <div className="field span-2"><label htmlFor="profile-gender">{t.settings.defaultPicture}</label>
      <select id="profile-gender" className="input" value={v.gender} onChange={(e) => setV({ ...v, gender: e.target.value })}>
        <option value="">{t.manageStudent.defaultPicture}</option><option value="f">{t.add.female}</option><option value="m">{t.add.male}</option>
      </select></div>
    {error && <p className="span-2 error-text" role="alert">{error}</p>}
    <div className="span-2 form-foot"><button type="submit" className="btn btn-primary" disabled={busy}>{t.save}</button></div>
  </form>;
}

export default function Settings() {
  const { t } = useLang();
  const { user } = useAuth();
  return <Shell title={t.settings.heading}>
    <div className="page-head"><div><h1>{t.settings.heading}</h1><p className="lead">{t.settings.lead}</p></div></div>
    {user && <div className="grid cols-main"><ProfileForm user={user} /><ProfilePicture user={user} /></div>}
  </Shell>;
}
