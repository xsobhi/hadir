import { ScanBarcode } from "kubai-icons-react";
import { Camera, CameraOff, CornerDownLeft, Hash } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLang } from "../../i18n";
import { useCamera } from "../../scanner/useCamera";
import { Tile } from "../ui/Tile";

/** The camera viewport and the number field a USB scanner types into. Both end in onCode(). */
export function ScanPanel({ onCode, disabled }: { onCode: (code: string) => void; disabled: boolean }) {
  const { t } = useLang();
  const { videoRef, state, start, stop } = useCamera(onCode);
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.focus();
  }, []);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const code = value.trim();
    if (code) onCode(code);
    setValue("");
  };
  const on = state === "on" || state === "starting";
  return (
    <section data-reveal className="card scan-card-wrap" aria-labelledby="scan-h">
      <div className="card-head">
        <div className="card-title" data-kubai-trigger><Tile icon={ScanBarcode} tone="brand" size={44} /><h2 id="scan-h">{t.live.scanTitle}</h2></div>
        {on && <button type="button" className="btn btn-ghost" onClick={stop}><CameraOff aria-hidden="true" />{t.live.cameraStop}</button>}
      </div>
      <div className={`viewport${on ? " viewport-on" : ""}`}>
        <video ref={videoRef} muted playsInline aria-label={t.live.cameraHint} />
        {on ? (
          <span className="viewport-frame" aria-hidden="true"><span className="viewport-line" /></span>
        ) : (
          <div className="viewport-off">
            <ol className="scan-steps">{t.live.steps.map((s, i) => <li key={s}><span className="step-n num">{i + 1}</span>{s}</li>)}</ol>
            <button type="button" className="btn btn-primary btn-lg" onClick={() => void start()} disabled={disabled}>
              <Camera aria-hidden="true" />{t.live.cameraStart}
            </button>
            {(state === "denied" || state === "missing") && <p className="viewport-warn">{state === "denied" ? t.live.cameraDenied : t.live.cameraMissing}</p>}
          </div>
        )}
      </div>
      <form className="scan-form" onSubmit={submit}>
        <label htmlFor="card-number">{t.live.inputLabel}</label>
        <div className="input-icon">
          <Hash aria-hidden="true" />
          <input id="card-number" ref={input} className="input num" inputMode="numeric" autoComplete="off" dir="ltr"
            value={value} onChange={(e) => setValue(e.target.value)} placeholder={t.live.inputPlaceholder}
            aria-describedby="card-hint" disabled={disabled} />
          <button type="submit" className="btn btn-soft" disabled={disabled || !value.trim()}><CornerDownLeft aria-hidden="true" />{t.live.add}</button>
        </div>
        <p id="card-hint" className="muted small">{t.live.inputHint}</p>
      </form>
    </section>
  );
}
