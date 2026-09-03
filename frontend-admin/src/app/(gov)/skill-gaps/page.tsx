"use client";
import Link from "next/link";
export default function GovSkillGapsRedirect() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-xl font-black text-slate-900">Skill-Gap Insights</h1>
      <p className="text-sm text-slate-500 mt-2">This view is now at <Link href="/dashboard/skill-gaps" className="text-blue-600 underline">/dashboard/skill-gaps</Link> (warning cards + curriculum badges).</p>
      <Link href="/dashboard/skill-gaps" className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg">Go to Skill-Gaps →</Link>
    </div>
  );
}
