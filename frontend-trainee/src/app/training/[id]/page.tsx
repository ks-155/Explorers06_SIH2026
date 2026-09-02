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

export default function TrainingPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["training", id],
    queryFn: () => api.trainees.getTraining(id as string),
    enabled: !!id,
  });

  const records = (data ?? []) as TrainingRecord[];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">My Training</h1>
          <p className="text-sm text-muted-foreground">
            Your skill-training records across programmes.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!isLoading && records.length === 0 && (
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

        <div className="flex gap-2">
          <Link href={`/identity/${id}`}>
            <Button variant="outline">Identity / Merge</Button>
          </Link>
          <Link href={`/contact/${id}`}>
            <Button variant="outline">Update Contact</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}