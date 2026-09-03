"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
export default function GovDistrictRedirect() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "27";
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-xl font-black text-slate-900">District {id}</h1>
      <p className="text-sm text-slate-500 mt-2">This view is now at <Link href={`/dashboard/district/${id}`} className="text-blue-600 underline">/dashboard/district/{id}</Link> (cards + progress bars).</p>
      <Link href={`/dashboard/district/${id}`} className="inline-block mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg">Go to District →</Link>
    </div>
  );
}
