import { Camera, Crop, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import type { User } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { useLang } from "../../i18n";
import { Avatar } from "../Avatar";
import { useToast } from "../ui/Toast";
import { AvatarEditor } from "./AvatarEditor";

export function ProfilePicture({ user }: { user: User }) {
  const { t } = useLang();
  const { setUser } = useAuth();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (source.startsWith("blob:")) URL.revokeObjectURL(source); }, [source]);
  const select = async (file?: File) => {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) {
      setError(t.settings.fileInvalid); return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new Image(); img.src = url; await img.decode();
      if (img.naturalWidth * img.naturalHeight > 40_000_000) throw new Error("too_large");
      setSource(url);
    } catch { URL.revokeObjectURL(url); setError(t.settings.fileInvalid); }
  };
  const remove = async () => {
    setBusy(true); setError("");
    try { const r = await api.del<{ user: User }>("/api/profile/avatar"); setUser(r.user); toast(t.saved, "success"); }
    catch { setError(t.settings.pictureFailed); } finally { setBusy(false); }
  };
  return (
    <section className="card stack" aria-labelledby="picture-title">
      <h2 id="picture-title">{t.settings.picture}</h2>
      <Avatar seed={user.email} gender={user.gender} src={user.avatarUrl} size={128} />
      <p className="muted">{t.settings.pictureHint}</p>
      <input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" aria-label={t.settings.changePicture}
        onChange={(e) => { void select(e.target.files?.[0]); e.target.value = ""; }} />
      <div className="student-actions">
        <button type="button" className="btn" disabled={busy} onClick={() => input.current?.click()}><Camera aria-hidden="true" />{t.settings.changePicture}</button>
        {user.avatarUrl && <><button type="button" className="btn" disabled={busy} onClick={() => { setError(""); setSource(user.avatarUrl!); }}><Crop aria-hidden="true" />{t.settings.editPicture}</button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void remove()}><Trash2 aria-hidden="true" />{t.settings.removePicture}</button></>}
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      {source && <AvatarEditor source={source} onClose={() => setSource("")} onSave={async (image) => {
        const r = await api.post<{ user: User }>("/api/profile/avatar", { image }); setUser(r.user); toast(t.saved, "success");
      }} />}
    </section>
  );
}
