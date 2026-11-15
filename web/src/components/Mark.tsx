/** Hadir's mark: an ID card's barcode with the green tick of a student marked present. */
export function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="var(--brand)" />
      <g fill="#fff">
        <rect x="9" y="10" width="2.6" height="20" rx="1" />
        <rect x="13.6" y="10" width="1.4" height="20" rx=".7" />
        <rect x="17" y="10" width="3.4" height="20" rx="1" />
        <rect x="22.4" y="10" width="1.4" height="14" rx=".7" />
      </g>
      <circle cx="28.5" cy="27.5" r="6.5" fill="#fff" />
      <path d="M25.6 27.6l2 2 3.6-4" fill="none" stroke="var(--brand)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
