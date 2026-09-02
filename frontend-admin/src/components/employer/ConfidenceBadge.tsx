// Confidence levels per API-CONTRACT.md 6: 80-100 HIGH green | 50-79 MEDIUM amber | 20-49 LOW red | 0-19 UNVERIFIED gray
export function confidenceLevel(score: number | null | undefined): { label: string; color: string } {
  if (score == null) return { label: 'UNVERIFIED', color: 'bg-gray-200 text-gray-700' };
  if (score >= 80) return { label: 'HIGH', color: 'bg-green-100 text-green-800 border-green-300' };
  if (score >= 50) return { label: 'MEDIUM', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (score >= 20) return { label: 'LOW', color: 'bg-red-100 text-red-800 border-red-300' };
  return { label: 'UNVERIFIED', color: 'bg-gray-100 text-gray-600 border-gray-300' };
}

export function ConfidenceBadge({ score }: { score: number | null | undefined }) {
  const { label, color } = confidenceLevel(score);
  return <span className={`px-2 py-1 rounded-full text-xs border ${color}`}>{label} {score != null ? `${score}%` : ''}</span>;
}
