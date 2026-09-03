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
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { WithTrainee } from "@/lib/withTrainee";
import {
  Check,
  ShieldCheck,
  UserCheck,
  X,
  Phone,
  MapPin,
  Fingerprint,
  Loader2,
} from "lucide-react";

interface MergeCandidate {
  id: string;
  name?: string;
  phone?: string;
  district_id?: number;
  match_type?: string;
  confidence?: number;
  matched_fields?: string[];
  aadhaar?: string;
}

interface Profile {
  name?: string;
  phone?: string;
  aadhaar?: string;
  district_id?: number;
}

function isMatchedField(matched: string[] | undefined, field: string) {
  if (!matched) return false;
  return matched.map((s) => s.toLowerCase()).includes(field.toLowerCase());
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

  const profileQuery = useQuery({
    queryKey: ["profile", id],
    queryFn: () => api.trainees.get(id as string),
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: (matchId: string) => api.identity.confirmMerge(matchId),
    onMutate: async (matchId: string) => {
      await queryClient.cancelQueries({ queryKey: ["mergeCandidates", id] });
      const prev = queryClient.getQueryData<MergeCandidate[]>([
        "mergeCandidates",
        id,
      ]);
      queryClient.setQueryData(
        ["mergeCandidates", id],
        (old: MergeCandidate[] | undefined) =>
          (old ?? []).filter((a) => a.id !== matchId)
      );
      return { prev };
    },
    onError: (_err, _matchId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["mergeCandidates", id], ctx.prev);
      }
    },
    onSuccess: () => {
      setSuccess("Identity confirmed. Your records are now merged.");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (matchId: string) => api.identity.rejectMerge(matchId),
    onMutate: async (matchId: string) => {
      await queryClient.cancelQueries({ queryKey: ["mergeCandidates", id] });
      const prev = queryClient.getQueryData<MergeCandidate[]>([
        "mergeCandidates",
        id,
      ]);
      queryClient.setQueryData(
        ["mergeCandidates", id],
        (old: MergeCandidate[] | undefined) =>
          (old ?? []).filter((a) => a.id !== matchId)
      );
      return { prev };
    },
    onError: (_err, _matchId, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(["mergeCandidates", id], ctx.prev);
      }
    },
    onSuccess: () => {
      setSuccess("Candidate rejected. It will not be linked to you.");
    },
  });

  const candidates = (data ?? []) as MergeCandidate[];
  const profile = profileQuery.data as Profile | undefined;
  const profileInitial = (profile?.name?.trim()?.[0] ?? "Y").toUpperCase();

  return (
    <WithTrainee>
      <div className="min-h-screen bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Identity &amp; Merge</h1>
            <p className="text-sm text-muted-foreground">
              Help us link all training records that belong to you.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="rounded-lg border-emerald-200 bg-emerald-50">
              <AlertDescription className="text-emerald-800 flex items-center gap-2">
                <Check className="h-4 w-4" aria-hidden />
                {success}
              </AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          )}
          {profileQuery.isLoading && !isLoading && (
            <div className="rounded-lg border bg-white p-4 shadow-sm space-y-3 animate-in fade-in duration-200">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          )}

          {!isLoading && candidates.length === 0 && (
            <Card className="rounded-lg shadow-sm animate-in fade-in duration-200">
              <CardContent className="pt-6 text-sm text-muted-foreground">
                No merge candidates found. Your identity looks clean.
              </CardContent>
            </Card>
          )}

          {candidates.map((c) => {
            const matchedPhone = isMatchedField(c.matched_fields, "phone");
            const matchedAadhaar =
              isMatchedField(c.matched_fields, "aadhaar") ||
              isMatchedField(c.matched_fields, "aadhar");
            const candidateInitial = (c.name?.trim()?.[0] ?? "?").toUpperCase();
            return (
              <Card key={c.id} className="rounded-lg shadow-sm border overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-slate-900" aria-hidden />
                    <CardTitle className="text-base text-slate-900">Possible match</CardTitle>
                    {c.confidence != null && (
                      <span className="ml-auto rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                        {Math.round(c.confidence)}% match
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {c.match_type ? `Type: ${c.match_type}` : "Review and confirm"} · Matched on{" "}
                    {c.matched_fields?.join(", ") || "—"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Side-by-side match card */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Your profile side */}
                    <div className="rounded-lg border bg-white p-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Your profile
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-semibold">
                          {profileInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {profile?.name || "You"}
                          </p>
                          <p className="text-xs text-muted-foreground">Current account</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                            matchedPhone ? "border-emerald-600 bg-emerald-50" : "bg-gray-50"
                          }`}
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{profile?.phone || "—"}</span>
                          {matchedPhone && (
                            <span className="ml-auto inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <Check className="h-3 w-3" aria-hidden /> match
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                            matchedAadhaar ? "border-emerald-600 bg-emerald-50" : "bg-gray-50"
                          }`}
                        >
                          <Fingerprint className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{profile?.aadhaar ? "•••• •••• " + String(profile.aadhaar).slice(-4) : "Aadhaar —"}</span>
                          {matchedAadhaar && (
                            <span className="ml-auto inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <Check className="h-3 w-3" aria-hidden /> match
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-2.5 py-2">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          District {profile?.district_id ?? "—"}
                        </div>
                      </div>
                    </div>

                    {/* Candidate side */}
                    <div className="rounded-lg border bg-white p-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Found record
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-semibold">
                          {candidateInitial}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {c.name || "Unnamed profile"}
                          </p>
                          <p className="text-xs text-muted-foreground">Candidate #{c.id.slice(0, 6)}</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-xs">
                        <div
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                            matchedPhone ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600" : "bg-gray-50"
                          }`}
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{c.phone || "No phone"}</span>
                          {matchedPhone && (
                            <span className="ml-auto inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <Check className="h-3 w-3" aria-hidden /> identical
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 ${
                            matchedAadhaar ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600" : "bg-gray-50"
                          }`}
                        >
                          <Fingerprint className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span className="truncate">{c.aadhaar ? "•••• •••• " + String(c.aadhaar).slice(-4) : "Aadhaar —"}</span>
                          {matchedAadhaar && (
                            <span className="ml-auto inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <Check className="h-3 w-3" aria-hidden /> identical
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-2.5 py-2">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          District {c.district_id ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {c.matched_fields && c.matched_fields.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.matched_fields.map((f) => {
                        const isHighlight = ["phone", "aadhaar", "aadhar"].includes(f.toLowerCase());
                        return (
                          <span
                            key={f}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium border ${
                              isHighlight
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {f}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* One-tap Confirm Merge (emerald-600) and Not Me (outline) */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      className="min-h-[44px] rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                      disabled={confirmMutation.isPending || rejectMutation.isPending}
                      onClick={() => confirmMutation.mutate(c.id)}
                    >
                      {confirmMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <UserCheck className="h-4 w-4" aria-hidden />
                      )}
                      Confirm Merge
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-[44px] rounded-lg border-input bg-white hover:bg-gray-50"
                      disabled={confirmMutation.isPending || rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(c.id)}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <X className="h-4 w-4" aria-hidden />
                      )}
                      Not Me
                    </Button>
                  </div>
                  <p className="text-center text-xs text-muted-foreground">
                    Identical fields are highlighted with emerald border
                  </p>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="min-h-[44px] rounded-lg"
              onClick={() => router.push(`/training/${id}`)}
            >
              Back to Training
            </Button>
          </div>
        </div>
      </div>
    </WithTrainee>
  );
}
