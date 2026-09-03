"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { api, getSession } from "@/lib/api-client";
import { Locale, locales, t } from "@/lib/i18n";
import { WithTrainee } from "@/lib/withTrainee";
import {
  Languages,
  MessageCircle,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";

interface Profile {
  preferred_language?: Locale;
}

interface SurveyQuestion {
  id: string;
  text?: string;
  type?: string;
}

interface FollowUpDetail {
  id: string;
  questions?: SurveyQuestion[];
}

// Non-placement reason options (aligned with backend expectations).
const REASONS = [
  "still_looking",
  "medical",
  "family",
  "not_interested",
  "other",
];

export default function SurveyPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const queryClient = useQueryClient();

  const currentUserId = getSession()?.userId;
  const profileQuery = useQuery({
    queryKey: ["profile", currentUserId],
    queryFn: () => api.trainees.get(currentUserId as string),
    enabled: !!currentUserId,
  });
  const preferredLocale =
    (profileQuery.data as Profile | undefined)?.preferred_language;

  const [locale, setLocale] = useState<Locale>(preferredLocale || "hi");
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const startedAt = useRef<number>(0);

  const { data, isLoading } = useQuery({
    queryKey: ["followup", id],
    queryFn: () => api.followUps.getPending(),
  });

  const list = (data ?? []) as FollowUpDetail[];
  const followUp = list.find((f) => f.id === id);
  const questions = followUp?.questions ?? [];

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // sync preferred locale when profile loads
  useEffect(() => {
    if (preferredLocale && preferredLocale !== locale) {
      setLocale(preferredLocale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredLocale]);

  const mutation = useMutation({
    mutationFn: (overrideResponses?: Record<string, unknown>) =>
      api.followUps.respond(id as string, {
        responses: overrideResponses ?? responses,
        ...(showReason && reason ? { non_placement_reason: reason } : {}),
        response_time_seconds: Math.max(
          0,
          Math.round((Date.now() - startedAt.current) / 1000)
        ),
      }),
    onMutate: async (overrideResponses) => {
      // Optimistic update: snapshot and optimistically remove pending follow-up
      await queryClient.cancelQueries({ queryKey: ["followup", id] });
      await queryClient.cancelQueries({ queryKey: ["pending-followups"] });
      const prevFollowup = queryClient.getQueryData(["followup", id]);
      const prevPending = queryClient.getQueryData(["pending-followups"]);
      // optimistic: filter out current id from both caches
      queryClient.setQueryData(
        ["followup", id],
        (old: FollowUpDetail[] | undefined) =>
          old ? old.filter((f) => f.id !== id) : old
      );
      queryClient.setQueryData(
        ["pending-followups"],
        (old: unknown) => {
          if (Array.isArray(old)) {
            return (old as FollowUpDetail[]).filter((f) => f.id !== id);
          }
          return old;
        }
      );
      // also include overrideResponses for completeness (no UI diff needed)
      void overrideResponses;
      return { prevFollowup, prevPending };
    },
    onError: (err: Error, _vars, ctx) => {
      // rollback on error
      if (ctx?.prevFollowup !== undefined) {
        queryClient.setQueryData(["followup", id], ctx.prevFollowup);
      }
      if (ctx?.prevPending !== undefined) {
        queryClient.setQueryData(["pending-followups"], ctx.prevPending);
      }
      setError(err.message);
    },
    onSuccess: () => {
      const elapsed = Math.max(
        0,
        Math.round((Date.now() - startedAt.current) / 1000)
      );
      setToast(`Follow-up response submitted in ${elapsed} seconds`);
      setDone(true);
    },
  });

  const question = questions[index];
  const isLast = index === questions.length - 1;

  const answer = (value: unknown) => {
    if (!question) return;
    const next = { ...responses, [question.id]: value };
    setResponses(next);

    // If the "working" question answered "no", ask for non-placement reason.
    if (question.id === "working" && value === "no") {
      setShowReason(true);
      setIndex((i) => i + 1);
      return;
    }
    if (isLast || question.id === "working") {
      // Last meaningful question reached.
      if (!showReason && question.id === "working" && value !== "no") {
        // Working yes -> still ask same-employer/relevance from returned questions
        // but if there are no more, submit.
        if (questions.length === 1) {
          mutation.mutate(next);
          return;
        }
      }
      if (isLast || (question.id === "working" && questions.length === 1)) {
        mutation.mutate(next);
        return;
      }
    }
    setIndex((i) => i + 1);
  };

  const reasonSubmit = () => {
    mutation.mutate(undefined);
  };

  if (done) {
    return (
      <WithTrainee>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Card className="w-full max-w-md text-center rounded-lg shadow-sm">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white">
                <CheckCircle2 className="h-6 w-6" aria-hidden />
              </div>
              <CardTitle className="text-xl font-bold">
                {t(locale, "thanks")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {toast && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {toast}
                </div>
              )}
              <Button
                variant="outline"
                className="min-h-[44px] w-full"
                onClick={() => (window.location.href = "/survey")}
              >
                {t(locale, "done")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </WithTrainee>
    );
  }

  return (
    <WithTrainee>
      <div className="flex min-h-screen flex-col bg-[#f0f2f5] animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* Sticky language switcher — enhanced with shadow-sm and slate-900 context */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white">
              <MessageCircle className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">SOIS Survey</p>
              <p className="text-xs text-muted-foreground">
                Question{" "}
                {questions.length > 0
                  ? Math.min(index + 1, questions.length)
                  : 0}{" "}
                of {questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-slate-900" aria-hidden />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              {locale === "en" ? "Language" : "भाषा / भाषा"}
            </span>
            <select
              aria-label="Select language"
              className="min-h-[36px] rounded-lg border border-input bg-background px-2 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              {locales.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col gap-4 p-4">
          {toast && (
            <div className="rounded-lg bg-emerald-600 text-white px-4 py-3 text-sm font-medium shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {toast}
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="rounded-lg">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isLoading && (
            <div className="rounded-2xl bg-white p-4 shadow-sm border space-y-3 animate-in fade-in duration-200">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-11 w-full rounded-xl" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
            </div>
          )}

          {!isLoading && showReason && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* WhatsApp-style bubble for reason prompt */}
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white p-4 shadow-sm border">
                <p className="text-sm font-medium text-slate-900">
                  {t(locale, "notWorkingReason")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Tap a reason below — large touch targets for easy selection
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm border space-y-3">
                <div className="grid gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                        reason === r
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white text-slate-900 border-input hover:bg-gray-50"
                      }`}
                    >
                      <span className="capitalize">{r.replace("_", " ")}</span>
                      {reason === r && (
                        <CheckCircle2 className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  ))}
                </div>
                <Button
                  className="min-h-[44px] w-full bg-slate-900 text-white hover:bg-slate-800 rounded-xl shadow-sm"
                  disabled={!reason || mutation.isPending}
                  onClick={reasonSubmit}
                >
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  )}
                  {mutation.isPending ? "Submitting…" : t(locale, "submit")}
                  {!mutation.isPending && (
                    <Send className="ml-2 h-4 w-4" aria-hidden />
                  )}
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !showReason && question && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {/* Progress dots */}
              <div className="flex items-center gap-1.5">
                {questions.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= index ? "bg-slate-900" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Chat bubble question */}
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white p-4 shadow-sm border">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Question {index + 1} of {questions.length}
                  </p>
                  <p className="mt-1 text-[15px] font-medium leading-snug text-slate-900">
                    {question.text || t(locale, "answerQuestion")}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              {/* Answer bubbles — large touch targets min-h-[44px] */}
              <div className="rounded-2xl bg-white p-4 shadow-sm border">
                <p className="mb-3 text-xs font-medium text-muted-foreground">
                  Tap to answer
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => answer("yes")}
                    disabled={mutation.isPending}
                    className="min-h-[44px] rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {mutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    )}
                    {t(locale, "yes")}
                  </button>
                  <button
                    type="button"
                    onClick={() => answer("no")}
                    disabled={mutation.isPending}
                    className="min-h-[44px] rounded-xl border border-input bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {mutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    )}
                    {t(locale, "no")}
                  </button>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Your response is recorded instantly
                </p>
              </div>
            </div>
          )}

          {!isLoading && !showReason && !question && questions.length > 0 && (
            <div className="flex justify-center py-8 animate-in fade-in duration-200">
              <div className="rounded-2xl bg-white px-6 py-4 shadow-sm border flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
                <p className="text-center text-sm text-muted-foreground">
                  Submitting…
                </p>
              </div>
            </div>
          )}

          {!isLoading && questions.length === 0 && !showReason && (
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm border animate-in fade-in duration-200">
              <MessageCircle
                className="mx-auto h-8 w-8 text-muted-foreground"
                aria-hidden
              />
              <p className="mt-2 text-sm text-muted-foreground">
                {t(locale, "noPending")}
              </p>
            </div>
          )}
        </div>
      </div>
    </WithTrainee>
  );
}
