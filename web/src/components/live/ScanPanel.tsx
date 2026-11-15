import { Camera, CameraOff } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLang } from "../../i18n";
import { useCamera } from "../../scanner/useCamera";

/** Camera viewport and the number field a USB scanner types into. Both end in onCode(). */
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
    <section className="panel scan-panel" aria-labelledby="scan-h">
      <div className="panel-head">
        <h2 id="scan-h">{t.live.camera}</h2>
        <button type="button" className="btn" onClick={() => (on ? stop() : void start())} disabled={disabled}>
          {on ? <CameraOff aria-hidden="true" /> : <Camera aria-hidden="true" />}
          {on ? t.live.cameraStop : t.live.cameraStart}
        </button>
      </div>
      <div className={`viewport${on ? " viewport-on" : ""}`}>
        <video ref={videoRef} muted playsInline aria-label={t.live.cameraHint} />
        {on ? <span className="viewport-frame" aria-hidden="true" /> : (
          <p className="viewport-note">
            {state === "denied" ? t.live.cameraDenied : state === "missing" ? t.live.cameraMissing : t.live.cameraHint}
          </p>
        )}
      </div>
      <form className="scan-form" onSubmit={submit}>
        <label htmlFor="card-number">{t.live.inputLabel}</label>
        <div className="joined">
          <input id="card-number" ref={input} className="input num" inputMode="numeric" autoComplete="off" dir="ltr"
            value={value} onChange={(e) => setValue(e.target.value)} placeholder={t.live.inputPlaceholder}
            aria-describedby="card-hint" disabled={disabled} />
          <button type="submit" className="btn" disabled={disabled || !value.trim()}>{t.live.add}</button>
        </div>
        <p id="card-hint" className="muted small">{t.live.inputHint}</p>
      </form>
    </section>
  );
}
