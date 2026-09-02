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
import { api } from "@/lib/api-client";

const CONSENT_VERSION = "1.0";

export default function ConsentPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
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
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Do you consent?</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={consentGiven === true ? "default" : "outline"}
                disabled={isPending}
                onClick={() => submit(true)}
              >
                Yes, I consent
              </Button>
              <Button
                type="button"
                variant={consentGiven === false ? "default" : "outline"}
                disabled={isPending}
                onClick={() => submit(false)}
              >
                Not now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}