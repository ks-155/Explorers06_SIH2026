"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api, getSession } from "@/lib/api-client";
import { Locale, locales, t } from "@/lib/i18n";
import { WithTrainee } from "@/lib/withTrainee";

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

  const mutation = useMutation({
    mutationFn: () =>
      api.followUps.respond(id as string, {
        responses,
        ...(showReason && reason ? { non_placement_reason: reason } : {}),
        response_time_seconds: Math.max(
          0,
          Math.round((Date.now() - startedAt.current) / 1000)
        ),
      }),
    onSuccess: () => setDone(true),
    onError: (err: Error) => setError(err.message),
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
          mutation.mutate();
        }
      }
      if (isLast || (question.id === "working" && questions.length === 1)) {
        mutation.mutate();
        return;
      }
    }
    setIndex((i) => i + 1);
  };

  const reasonSubmit = () => {
    mutation.mutate();
  };

  if (done) {
    return (
      <WithTrainee>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-xl font-bold">{t(locale, "thanks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
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
      <div className="flex min-h-screen flex-col bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {locale === "en" ? "Language" : "भाषा / भाषा"}
        </span>
        <select
          className="rounded-md border border-input bg-background px-2 py-1 text-sm"
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

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && showReason && (
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">{t(locale, "notWorkingReason")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {REASONS.map((r) => (
              <Button
                key={r}
                type="button"
                variant={reason === r ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setReason(r)}
              >
                {r.replace("_", " ")}
              </Button>
            ))}
            <Button
              className="w-full"
              disabled={!reason}
              onClick={reasonSubmit}
            >
              {t(locale, "submit")}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !showReason && question && (
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardDescription>
              Question {index + 1} of {questions.length}
            </CardDescription>
            <CardTitle className="text-lg">{question.text || t(locale, "answerQuestion")}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => answer("yes")}
            >
              {t(locale, "yes")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => answer("no")}
            >
              {t(locale, "no")}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !showReason && !question && questions.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">Submitting…</p>
      )}

      {!isLoading && questions.length === 0 && (
        <Card className="mx-auto w-full max-w-md">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            {t(locale, "noPending")}
          </CardContent>
        </Card>
      )}
    </div>
    </WithTrainee>
  );
}