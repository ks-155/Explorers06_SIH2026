"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { WithTrainee } from "@/lib/withTrainee";
import { Loader2 } from "lucide-react";

const CONSENT_VERSION = "1.0";

interface Profile {
  consent_given?: boolean;
  consent_version?: string;
}

export default function ConsentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", id],
    queryFn: () => api.trainees.get(id as string),
    enabled: !!id,
  });
  const profile = profileQuery.data as Profile | undefined;
  const currentConsent = profile?.consent_given;

  const submit = async (given: boolean) => {
    if (!id) return;
    setError(null);
    setConsentGiven(given);
    setIsPending(true);
    try {
      await api.trainees.updateConsent(id, {
        consent_given: given,
        consent_version: CONSENT_VERSION,
      });
      router.push(`/training/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setConsentGiven(null);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <WithTrainee>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Consent to Share Outcome</CardTitle>
          <CardDescription>
            We need your consent to contact you and record your training outcome with
            programme partners. You can change this anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="rounded-lg border bg-muted/50 p-4 text-sm">
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Your employment status is shared only with trained programme partners.</li>
              <li>You may be contacted via your preferred channel for short outcome surveys.</li>
              <li>You can withdraw consent at any time.</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Consent version {CONSENT_VERSION}
            </p>
          </div>
          {profileQuery.isLoading && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          )}
          {!profileQuery.isLoading && currentConsent != null && (
            <p className="text-sm text-muted-foreground">
              Current status:{" "}
              <span className="font-medium">
                {currentConsent ? "Consented" : "Not consented"}
              </span>
              {profile?.consent_version
                ? ` (version ${profile.consent_version})`
                : ""}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Do you consent?</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={consentGiven === true ? "default" : "outline"}
                disabled={isPending}
                onClick={() => submit(true)}
              >
                {isPending && consentGiven === true && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                )}
                Yes, I consent
              </Button>
              <Button
                type="button"
                variant={consentGiven === false ? "default" : "outline"}
                disabled={isPending}
                onClick={() => submit(false)}
              >
                {isPending && consentGiven === false && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                )}
                Not now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </WithTrainee>
  );
}