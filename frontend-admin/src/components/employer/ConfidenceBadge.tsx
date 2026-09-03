// Confidence levels per API-CONTRACT.md 6: 80-100 HIGH emerald | 50-79 MEDIUM amber | 20-49 LOW red | 0-19 UNVERIFIED gray
// SOIS tokens: high #059669 emerald-600, medium #d97706 amber-600, low #dc2626 red-600
export function confidenceLevel(score: number | null | undefined): { label: string; color: string } {
  if (score == null) return { label: 'UNVERIFIED', color: 'bg-gray-100 text-gray-600 border-gray-200' };
  if (score >= 80) return { label: 'HIGH', color: 'bg-[#059669] text-white border-[#059669] shadow-sm' };
  if (score >= 50) return { label: 'MEDIUM', color: 'bg-[#d97706] text-white border-[#d97706] shadow-sm' };
  if (score >= 20) return { label: 'LOW', color: 'bg-[#dc2626] text-white border-[#dc2626] shadow-sm' };
  return { label: 'UNVERIFIED', color: 'bg-gray-100 text-gray-600 border-gray-200' };
}

export function ConfidenceBadge({ score }: { score: number | null | undefined }) {
  const { label, color } = confidenceLevel(score);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {label} {score != null ? `${score}%` : ''}
    </span>
  );
}
