import { useEffect, useId, useRef, useState } from "react";
import { useLang } from "../i18n";

/** Native modal: focus stays inside, Cancel is focused first, and failures leave the record visible. */
export function DeleteDialog({ title, description, onClose, onDelete }: {
  title: string; description: string; onClose: () => void; onDelete: () => Promise<void>;
}) {
  const { t } = useLang();
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  const remove = async () => {
    setBusy(true); setError(false);
    try { await onDelete(); onClose(); } catch { setError(true); } finally { setBusy(false); }
  };
  return (
    <dialog ref={dialog} className="dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-desc`}
      onCancel={(e) => { if (busy) e.preventDefault(); else onClose(); }}>
      <div className="dialog-body stack">
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-desc`}>{description}</p>
        {error && <p role="alert" className="error-text">{t.deleteFailed}</p>}
        <div className="form-foot">
          <button className="btn" type="button" autoFocus disabled={busy} onClick={onClose}>{t.cancel}</button>
          <button className="btn btn-danger" type="button" disabled={busy} onClick={() => void remove()}>{title}</button>
        </div>
      </div>
    </dialog>
  );
}
