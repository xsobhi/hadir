/** The URL of someone's default profile picture; the server draws it (see avatar-svg.ts) and it caches for a year. */
export function avatarUrl(seed: string, gender = ""): string {
  return `/avatar/v1/${gender === "f" || gender === "m" ? gender : "x"}/${encodeURIComponent(seed.slice(0, 64))}.svg`;
}

/** A default profile picture: the same person always gets the same illustrated face. */
export function Avatar({ seed, gender, size = 40, className = "" }: { seed: string; gender?: string; size?: number; className?: string }) {
  return <img src={avatarUrl(seed, gender)} width={size} height={size} alt="" className={`avatar ${className}`} loading="lazy" decoding="async" />;
}
