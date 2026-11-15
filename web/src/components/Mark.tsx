/** Hadir's mark: the bars of an ID card's barcode, and the blue dot of a student marked present. */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--primary)" />
      <g fill="#fff">
        <rect x="7" y="8" width="2" height="16" />
        <rect x="11" y="8" width="1" height="16" />
        <rect x="14" y="8" width="3" height="16" />
        <rect x="19" y="8" width="1" height="16" />
      </g>
      <circle cx="23.5" cy="21.5" r="3.5" fill="var(--data)" />
    </svg>
  );
}
