import { useCallback, useEffect, useRef, useState } from "react";
import { createDetector } from "./detector";

export type CameraState = "off" | "starting" | "on" | "denied" | "missing";

/** Camera + detection loop. Calls onCode once per card: the same code is ignored for 3 s after a read. */
export function useCamera(onCode: (code: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [state, setState] = useState<CameraState>("off");
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | null>(null);
  const last = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const handler = useRef(onCode);
  handler.current = onCode;

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setState("off");
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) return setState("missing");
    setState("starting");
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
      });
      stream.current = media;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = media;
      await video.play();
      setState("on");
      const detector = await createDetector();
      const tick = async () => {
        if (!stream.current) return;
        try {
          if (video.readyState >= 2) {
            const found = await detector.detect(video);
            const code = found[0]?.rawValue?.trim();
            const now = Date.now();
            if (code && (code !== last.current.code || now - last.current.at > 3000)) {
              last.current = { code, at: now };
              handler.current(code);
            }
          }
        } catch {
          /* a frame that fails to decode is normal; keep going */
        }
        timer.current = window.setTimeout(tick, 120);
      };
      void tick();
    } catch (e) {
      const name = (e as DOMException)?.name;
      setState(name === "NotFoundError" || name === "OverconstrainedError" ? "missing" : "denied");
    }
  }, []);

  useEffect(() => stop, [stop]);
  return { videoRef, state, start, stop };
}
