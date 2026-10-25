const PALETTE = [
  ["#a855f7", "#6366f1"],
  ["#8b5cf6", "#d946ef"],
  ["#06b6d4", "#6366f1"],
  ["#ec4899", "#a855f7"],
  ["#6366f1", "#3b82f6"],
  ["#14b8a6", "#06b6d4"],
];

const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 80,
};

function hashValue(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export default function UserAvatar({ name, email, size = "md", ring = false, className = "" }) {
  const displayName = (name || email || "User").trim();
  const letter = (Array.from(displayName)[0] || "?").toUpperCase();
  const color = PALETTE[hashValue(`${displayName}|${email || ""}`.toLowerCase()) % PALETTE.length];
  const px = typeof size === "number" ? size : SIZES[size] || SIZES.md;

  const glow = `${color[0]}55`;
  const ringShadow = ring
    ? `0 0 0 2px #0a0a0a, 0 0 0 3.5px ${color[0]}80, 0 0 24px ${glow}, inset 0 1px 0 rgba(255,255,255,0.28)`
    : `0 0 22px ${glow}, inset 0 1px 0 rgba(255,255,255,0.28)`;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ${className}`}
      style={{
        width: px,
        height: px,
        fontSize: Math.max(10, Math.round(px * 0.38)),
        lineHeight: 1,
        background: `linear-gradient(135deg, ${color[0]} 0%, ${color[1]} 100%)`,
        boxShadow: ringShadow,
      }}
      role="img"
      aria-label={`${displayName} avatar`}
      title={displayName}
    >
      {letter}
    </span>
  );
}
