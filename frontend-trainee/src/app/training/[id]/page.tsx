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
import { api } from "@/lib/api-client";
import { ConfidenceBadge, ConfidenceLevel } from "@/components/ConfidenceBadge";
import { WithTrainee } from "@/lib/withTrainee";

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

  return (
    <WithTrainee>
      <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">My Training</h1>
          <p className="text-sm text-muted-foreground">
            Your skill-training records across programmes.
          </p>
        </div>

        {trainingQuery.error && (
          <Alert variant="destructive">
            <AlertDescription>{(trainingQuery.error as Error).message}</AlertDescription>
          </Alert>
        )}

        {/* Profile header (M1-04: fetch GET /trainees/:id) */}
        {!profileQuery.isLoading && profile && (
          <Card>
            <CardHeader>
              <CardTitle>{profile.name || "Trainee"}</CardTitle>
              <CardDescription>
                {profile.phone || "No phone"} · District {profile.district_id ?? "—"}{" "}
                ·{" "}
                <span className="capitalize">{profile.identity_status || "—"}</span>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {trainingQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}

        {!trainingQuery.isLoading && records.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No training records found yet.
            </CardContent>
          </Card>
        )}

        {records.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle>{r.job_role || "Training"}</CardTitle>
              <CardDescription>{r.sector || "—"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="capitalize">{r.status || "—"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Qualification:</span>{" "}
                  {r.nsqf_level ? `NSQF-${r.nsqf_level}` : "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Enrolled:</span>{" "}
                  {r.enrollment_date || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Completed:</span>{" "}
                  {r.completion_date || "—"}
                </div>
              </div>
              {r.certification_id && (
                <p className="text-xs text-muted-foreground">
                  Certificate {r.certification_id} · {r.certification_date}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Employment + confidence (M1-04 / Phase 4 badge) */}
        {employment.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Employment Status</h2>
            {employment.map((e) => (
              <Card key={e.id}>
                <CardContent className="pt-6 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{e.job_role || "Current role"}</div>
                      <div className="text-muted-foreground">
                        {e.employment_type?.replace("_", " ") || "—"} · joined{" "}
                        {e.joining_date || "—"}
                      </div>
                    </div>
                    <ConfidenceBadge score={e.confidence_score} level={e.level} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Verification:{" "}
                    <span className="capitalize">
                      {e.verification_status?.replace("_", " ") || "—"}
                    </span>{" "}
                    {e.level ? `· ${e.level}` : ""}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Link href={`/identity/${id}`}>
            <Button variant="outline">Identity / Merge</Button>
          </Link>
          <Link href={`/contact/${id}`}>
            <Button variant="outline">Update Contact</Button>
          </Link>
          <Link href="/survey">
            <Button variant="outline">Follow-up Survey</Button>
          </Link>
        </div>
      </div>
      </div>
    </WithTrainee>
  );
}