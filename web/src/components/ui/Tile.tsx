import type { ComponentType } from "react";

export type Tone = "brand" | "blue" | "amber" | "rose" | "violet" | "sky";
export const TONE_COLOR: Record<Tone, string> = {
  brand: "#0e8a6a", blue: "#2563eb", amber: "#f59e0b", rose: "#e11d48", violet: "#7c3aed", sky: "#0284c7",
};
type IconLike = ComponentType<{ size?: number; color?: string; trigger?: "hover" | "parent" | "none" }>;

/** A Kubai icon on a soft tile of its own colour. The tile's parent plays the icon's hover motion. */
export function Tile({ icon: Icon, tone = "brand", size = 46 }: { icon: IconLike; tone?: Tone; size?: number }) {
  return (
    <span className={`tile tile-${tone}`} style={{ width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.58)} color={TONE_COLOR[tone]} trigger="parent" />
    </span>
  );
}
