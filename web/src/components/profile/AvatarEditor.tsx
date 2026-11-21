import { RotateCcw, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useLang } from "../../i18n";
import { cropImage } from "./cropImage";

export function AvatarEditor({ source, onClose, onSave }: {
  source: string; onClose: () => void; onSave: (image: string) => Promise<void>;
}) {
  const { t } = useLang();
  const s = t.settings;
  const dialog = useRef<HTMLDialogElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { dialog.current?.showModal(); }, []);
  const save = async () => {
    if (!area) return;
    setBusy(true); setError("");
    try { await onSave(await cropImage(source, area, rotation)); onClose(); }
    catch { setError(s.pictureFailed); } finally { setBusy(false); }
  };
  return (
    <dialog ref={dialog} className="dialog crop-dialog" aria-labelledby="crop-title" aria-describedby="crop-hint"
      onCancel={(e) => { if (busy) e.preventDefault(); else onClose(); }}>
      <div className="dialog-body stack">
        <h2 id="crop-title">{s.cropTitle}</h2><p id="crop-hint" className="muted">{s.cropHint}</p>
        <div className="crop-stage" dir="ltr">
          <Cropper image={source} crop={crop} zoom={zoom} rotation={rotation} aspect={1} cropShape="round"
            onCropChange={setCrop} onZoomChange={setZoom} onRotationChange={setRotation} zoomWithScroll={false}
            onCropAreaChange={(_, pixels) => setArea(pixels)} keyboardStep={8}
            cropperProps={{ "aria-label": s.reposition }} onMediaLoaded={() => setError("")}
            mediaProps={{ onError: () => setError(s.pictureFailed) }} />
        </div>
        <div className="field"><label htmlFor="crop-zoom">{s.zoom} · {zoom.toFixed(1)}×</label>
          <input id="crop-zoom" type="range" min={1} max={3} step={0.01} value={zoom} disabled={busy}
            onChange={(e) => setZoom(Number(e.target.value))} /></div>
        <div className="field"><label htmlFor="crop-rotation">{s.rotation} · {Math.round(rotation)}°</label>
          <input id="crop-rotation" type="range" min={0} max={360} step={1} value={rotation} disabled={busy}
            onChange={(e) => setRotation(Number(e.target.value))} /></div>
        <div className="student-actions">
          <button type="button" className="btn" disabled={busy} onClick={() => setRotation((rotation + 270) % 360)}><RotateCcw aria-hidden="true" />{s.rotateLeft}</button>
          <button type="button" className="btn" disabled={busy} onClick={() => setRotation((rotation + 90) % 360)}><RotateCw aria-hidden="true" />{s.rotateRight}</button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); }}>{s.reset}</button>
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="form-foot"><button type="button" className="btn" disabled={busy} onClick={onClose}>{t.cancel}</button>
          <button type="button" className="btn btn-primary" disabled={busy || !area} onClick={() => void save()}>{s.savePicture}</button></div>
      </div>
    </dialog>
  );
}
