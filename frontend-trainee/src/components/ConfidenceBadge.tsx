// Confidence display for employment records.
// Per API-CONTRACT.md, backend returns BOTH `level` (UNVERIFIED|LOW|MEDIUM|HIGH)
// and `confidence_score`. Use `level` for the badge label and
// `confidence_score` for the percentage (per Member 3).
// Fallback thresholds mirror the contract when no `level` is present:
// 80-100 HIGH | 50-79 MEDIUM | 20-49 LOW | <20 UNVERIFIED

export type ConfidenceLevel =
  | "UNVERIFIED"
  | "LOW"
  | "MEDIUM"
  | "HIGH";

const LEVEL_STYLE: Record<ConfidenceLevel, string> = {
  HIGH: "bg-green-100 text-green-800 border-green-300",
  MEDIUM: "bg-amber-100 text-amber-800 border-amber-300",
  LOW: "bg-red-100 text-red-800 border-red-300",
  UNVERIFIED: "bg-gray-100 text-gray-600 border-gray-300",
};

export function confidenceLevel(
  score: number | null | undefined
): { label: ConfidenceLevel; color: string } {
  if (score == null) return { label: "UNVERIFIED", color: LEVEL_STYLE.UNVERIFIED };
  if (score >= 80) return { label: "HIGH", color: LEVEL_STYLE.HIGH };
  if (score >= 50) return { label: "MEDIUM", color: LEVEL_STYLE.MEDIUM };
  if (score >= 20) return { label: "LOW", color: LEVEL_STYLE.LOW };
  return { label: "UNVERIFIED", color: LEVEL_STYLE.UNVERIFIED };
}

export function ConfidenceBadge({
  score,
  level,
}: {
  score?: number | null;
  level?: ConfidenceLevel | null;
}) {
  const resolved =
    level && LEVEL_STYLE[level]
      ? { label: level, color: LEVEL_STYLE[level] }
      : confidenceLevel(score);
  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${resolved.color}`}>
      {resolved.label}
      {score != null ? ` ${score}%` : ""}
    </span>
  );
}