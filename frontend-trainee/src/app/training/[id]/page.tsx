"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { ConfidenceBadge, ConfidenceLevel } from "@/components/ConfidenceBadge";
import { WithTrainee } from "@/lib/withTrainee";
import {
  BadgeCheck,
  Briefcase,
  GraduationCap,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

interface Profile {
  id: string;
  name?: string;
  phone?: string;
  district_id?: number;
  preferred_language?: string;
  identity_status?: string;
}

interface TrainingRecord {
  id: string;
  sector?: string;
  job_role?: string;
  nsqf_level?: number;
  enrollment_date?: string;
  completion_date?: string;
  certification_id?: string;
  certification_date?: string;
  status?: string;
  provider_id?: string;
}

interface EmploymentRecord {
  id: string;
  employer_id?: string;
  job_role?: string;
  employment_type?: string;
  joining_date?: string;
  verification_status?: string;
  confidence_score?: number;
  level?: ConfidenceLevel;
}

function WhyThisScore({ verificationStatus }: { verificationStatus?: string }) {
  const status = (verificationStatus ?? "").toLowerCase();
  const isConfirmed =
    status.includes("employer_confirmed") ||
    status.includes("evidence_confirmed");
  const isSelfReported =
    status.includes("self_reported") || status.includes("pending");

  return (
    <div className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground border">
      <p className="font-medium text-slate-900">Why this score?</p>
      <p className="mt-1">
        Self-report +20 · Employer confirmed +40 · Salary slip +15 · Bank
        statement +10 · Offer letter +10 · Udyam +5 · EPFO +20 · cap 100
      </p>
      {isConfirmed ? (
        <p className="mt-1">Employer confirmation is counted in this score.</p>
      ) : isSelfReported ? (
        <p className="mt-1">Score grows when your employer confirms and evidence is added.</p>
      ) : (
        <p className="mt-1">Add evidence and employer confirmation to grow this score.</p>
      )}
    </div>
  );
}

export default function TrainingPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const profileQuery = useQuery({
    queryKey: ["profile", id],
    queryFn: () => api.trainees.get(id as string),
    enabled: !!id,
  });

  const trainingQuery = useQuery({
    queryKey: ["training", id],
    queryFn: () => api.trainees.getTraining(id as string),
    enabled: !!id,
  });

  const employmentQuery = useQuery({
    queryKey: ["employment", id],
    queryFn: () => api.trainees.getEmployment(id as string),
    enabled: !!id,
  });

  const profile = profileQuery.data as Profile | undefined;
  const records = (trainingQuery.data ?? []) as TrainingRecord[];
  const employment = (employmentQuery.data ?? []) as EmploymentRecord[];

  const notFound =
    (profileQuery.error as Error)?.message?.toLowerCase().includes("not found") ||
    (profileQuery.error as { statusCode?: number })?.statusCode === 404;

  const initial = (profile?.name?.trim()?.[0] ?? "T").toUpperCase();
  const isVerified =
    profile?.identity_status?.toLowerCase().includes("verified") ||
    profile?.identity_status?.toLowerCase().includes("confirmed");

  return (
    <WithTrainee>
      <div className="min-h-screen bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Training</h1>
            <p className="text-sm text-muted-foreground">
              Your skill-training records across programmes.
            </p>
          </div>

          {profileQuery.error && notFound ? (
            <Card className="rounded-lg border-amber-200 bg-amber-50">
              <CardContent className="pt-5 text-sm">
                <p className="font-medium text-amber-900">Trainee {id} not found</p>
                <p className="text-amber-800 mt-1">
                  This profile was created on an old local database that has since been
                  re-seeded (latest GitHub commit adb6e09 fixes Home to use your live JWT
                  traineeId). Your browser is still holding the stale ID
                  <span className="font-mono"> {id}</span>.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      try {
                        localStorage.clear();
                      } catch {}
                      window.location.href = "/login";
                    }}
                    className="min-h-[44px] rounded-lg bg-amber-600 hover:bg-amber-700"
                  >
                    Clear session &amp; sign in again
                  </Button>
                  <Link href="/">
                    <Button variant="outline" className="min-h-[44px] rounded-lg">
                      Back to Home
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-amber-700 mt-3">
                  Or open{" "}
                  <span className="font-mono">http://localhost:3000/</span> → sign in with{" "}
                  <span className="font-mono">trainee@sois.in / trainee123456</span> (live ID{" "}
                  <span className="font-mono">c24d0712-e76e-4ddc-952a-0f06269a6822</span>).
                </p>
              </CardContent>
            </Card>
          ) : trainingQuery.error ? (
            <Alert variant="destructive" className="rounded-lg">
              <AlertDescription>{(trainingQuery.error as Error).message}</AlertDescription>
            </Alert>
          ) : null}

          {/* Verified Profile Card — avatar initial, training badges, shadow-sm rounded-lg */}
          {!profileQuery.isLoading && profile && (
            <Card className="rounded-lg shadow-sm border overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-lg font-semibold shadow-sm">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900 truncate">
                        {profile.name || "Trainee"}
                      </h2>
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 border">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                          {profile.identity_status || "Pending"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" aria-hidden />
                        {profile.phone || "No phone"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                        District {profile.district_id ?? "—"}
                      </span>
                    </div>
                    {/* Training badges pills — sector/job_role from records */}
                    {records.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {records.slice(0, 4).map((r) => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-medium text-slate-900"
                          >
                            <Briefcase className="h-3 w-3 text-blue-600" aria-hidden />
                            {r.sector || "Sector"} · {r.job_role || "Role"}
                          </span>
                        ))}
                        {records.length > 4 && (
                          <span className="inline-flex items-center rounded-full bg-gray-50 border px-2.5 py-1 text-xs text-muted-foreground">
                            +{records.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {profileQuery.isLoading && (
            <Card className="rounded-lg shadow-sm animate-in fade-in duration-200">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-6 w-full rounded-full" />
              </CardContent>
            </Card>
          )}

          {trainingQuery.isLoading && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          )}

          {!trainingQuery.isLoading && records.length === 0 && (
            <Card className="rounded-lg shadow-sm">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No training records found yet.
              </CardContent>
            </Card>
          )}

          {records.map((r) => (
            <Card key={r.id} className="rounded-lg shadow-sm border">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2 text-slate-900">
                      <GraduationCap className="h-4 w-4 text-slate-900" aria-hidden />
                      {r.job_role || "Training"}
                    </CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap gap-1.5">
                      {r.sector && (
                        <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-medium text-white">
                          {r.sector}
                        </span>
                      )}
                      {r.job_role && (
                        <span className="rounded-full border bg-white px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {r.job_role}
                        </span>
                      )}
                      {!r.sector && !r.job_role && <span>—</span>}
                    </CardDescription>
                  </div>
                  {r.status && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize border">
                      {r.status}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-muted-foreground">Qualification:</span>{" "}
                    <span className="font-medium text-slate-900">{r.nsqf_level ? `NSQF-${r.nsqf_level}` : "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Enrolled:</span>{" "}
                    <span className="font-medium">{r.enrollment_date || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completed:</span>{" "}
                    <span className="font-medium">{r.completion_date || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider:</span>{" "}
                    <span className="font-medium">{r.provider_id || "—"}</span>
                  </div>
                </div>
                {r.certification_id && (
                  <p className="text-xs text-muted-foreground border-t pt-2">
                    Certificate {r.certification_id} · {r.certification_date}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Employment + confidence (M1-04 / Phase 4 badge) */}
          {employmentQuery.isLoading && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          )}
          {employment.length > 0 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h2 className="text-lg font-semibold text-slate-900">Employment Status</h2>
              {employment.map((e) => (
                <Card key={e.id} className="rounded-lg shadow-sm border">
                  <CardContent className="pt-5 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-medium text-slate-900">{e.job_role || "Current role"}</div>
                        <div className="text-muted-foreground text-xs">
                          {e.employment_type?.replace("_", " ") || "—"} · joined{" "}
                          {e.joining_date || "—"}
                        </div>
                      </div>
                      <ConfidenceBadge score={e.confidence_score} level={e.level} />
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Verification:{" "}
                      <span className="capitalize font-medium text-slate-900">
                        {e.verification_status?.replace("_", " ") || "—"}
                      </span>{" "}
                      {e.level ? `· ${e.level}` : ""}
                    </div>
                    <WhyThisScore verificationStatus={e.verification_status} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-2">
            <Link href={`/identity/${id}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] rounded-lg">
                Identity / Merge
              </Button>
            </Link>
            <Link href={`/contact/${id}`} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] rounded-lg">
                Update Contact
              </Button>
            </Link>
            <Link href="/survey" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto min-h-[44px] rounded-lg">
                Follow-up Survey
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </WithTrainee>
  );
}
