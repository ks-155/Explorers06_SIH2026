"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { WithTrainee } from "@/lib/withTrainee";

interface MergeCandidate {
  id: string;
  name?: string;
  phone?: string;
  district_id?: number;
  match_type?: string;
  confidence?: number;
  matched_fields?: string[];
}

export default function IdentityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState<string | null>(null);

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["mergeCandidates", id],
    queryFn: () => api.trainees.getMergeCandidates(id as string),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: (matchId: string) => api.identity.confirmMerge(matchId),
    onSuccess: () => {
      setSuccess("Identity confirmed. Your records are now merged.");
      // Remove the confirmed candidate from the list.
      queryClient.setQueryData(
        ["mergeCandidates", id],
        (old: MergeCandidate[] | undefined) =>
          (old ?? []).filter((a) => a.id !== confirmMutation.variables)
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (matchId: string) => api.identity.rejectMerge(matchId),
    onSuccess: (_, matchId) => {
      setSuccess("Candidate rejected. It will not be linked to you.");
      queryClient.setQueryData(
        ["mergeCandidates", id],
        (old: MergeCandidate[] | undefined) =>
          (old ?? []).filter((a) => a.id !== matchId)
      );
    },
  });

  const candidates = (data ?? []) as MergeCandidate[];

  return (
    <WithTrainee>
      <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Identity &amp; Merge</h1>
          <p className="text-sm text-muted-foreground">
            Help us link all training records that belong to you.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!isLoading && candidates.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No merge candidates found. Your identity looks clean.
            </CardContent>
          </Card>
        )}

        {candidates.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle>{c.name || "Unnamed profile"}</CardTitle>
              <CardDescription>
                {c.phone || "No phone"} · District {c.district_id ?? "—"} ·{" "}
                {c.confidence != null ? `${Math.round(c.confidence)}% match` : "match"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {c.matched_fields && c.matched_fields.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Matched on: {c.matched_fields.join(", ")}
                </p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={
                    confirmMutation.isPending || rejectMutation.isPending
                  }
                  onClick={() => confirmMutation.mutate(c.id)}
                >
                  Confirm {c.match_type === "soft" ? "(soft)" : ""} match
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    confirmMutation.isPending || rejectMutation.isPending
                  }
                  onClick={() => rejectMutation.mutate(c.id)}
                >
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/training/${id}`)}>
            Back to Training
          </Button>
        </div>
      </div>
      </div>
    </WithTrainee>
  );
}