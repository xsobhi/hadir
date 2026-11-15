import type { ComponentProps, ReactNode } from "react";
import { CountUp } from "../../motion/CountUp";
import { Tile } from "./Tile";

function animated(value: ReactNode): ReactNode {
  if (typeof value === "number") return <CountUp value={value} />;
  const pct = typeof value === "string" ? value.match(/^(\d+)%$/) : null;
  return pct ? <CountUp value={Number(pct[1])} suffix="%" /> : value;
}

/** One figure with its icon: the label, the value, and a short line of context under it. */
export function StatCard({ icon, tone, label, value, hint }: {
  icon: ComponentProps<typeof Tile>["icon"]; tone: ComponentProps<typeof Tile>["tone"];
  label: string; value: ReactNode; hint?: ReactNode;
}) {
  return (
    <div className="stat" data-reveal data-kubai-trigger>
      <Tile icon={icon} tone={tone} />
      <div className="stat-text">
        <p className="stat-label">{label}</p>
        <p className="stat-value num">{animated(value)}</p>
        {hint && <p className="stat-hint">{hint}</p>}
      </div>
    </div>
  );
}
