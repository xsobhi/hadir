let ctx: AudioContext | null = null;

function tone(freq: number, at: number, length: number, gain = 0.08) {
  ctx ??= new AudioContext();
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = "sine";
  vol.gain.setValueAtTime(gain, ctx.currentTime + at);
  vol.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + length);
  osc.connect(vol).connect(ctx.destination);
  osc.start(ctx.currentTime + at);
  osc.stop(ctx.currentTime + at + length + 0.02);
}

/** Sound and vibration so the professor can keep their eyes on the room: never colour alone. */
export function feedback(kind: "present" | "late" | "problem", sound: boolean) {
  if (sound) {
    try {
      if (kind === "present") tone(1046, 0, 0.12);
      else if (kind === "late") { tone(880, 0, 0.1); tone(660, 0.12, 0.14); }
      else { tone(220, 0, 0.22, 0.1); }
    } catch {
      /* audio blocked until the first tap; the screen still says it */
    }
  }
  navigator.vibrate?.(kind === "problem" ? [60, 40, 60] : 30);
}
