"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { surveyDict } from "@/lib/i18n";
import { ClipboardList, Settings2, UserPlus } from "lucide-react";
import { getSession } from "@/lib/api-client";

export default function Home() {
  const [traineeId, setTraineeId] = useState<string | null>(null);

  useEffect(() => {
    const s = getSession();
    if (s?.traineeId && s?.role === "trainee") setTraineeId(s.traineeId);
    else if (s?.userId && s?.role === "trainee") setTraineeId(s.userId);
  }, []);

  const TRAINEE_ID = traineeId ?? null;
  const trainingHref = TRAINEE_ID ? `/training/${TRAINEE_ID}` : "/login";
  const identityHref = TRAINEE_ID ? `/identity/${TRAINEE_ID}` : "/login";
  const contactHref = TRAINEE_ID ? `/contact/${TRAINEE_ID}` : "/login";
  const consentHref = TRAINEE_ID ? `/consent/${TRAINEE_ID}` : "/login";
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          SOIS - Trainee Portal
        </h1>
        <p className="mt-2 text-muted-foreground">
          Skilling Outcomes Intelligence System — track your training outcomes
          and career progression.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
        {/* Start → Register */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-teal-700" aria-hidden />
              Start
            </CardTitle>
            <CardDescription>
              New here? Create your trainee profile to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col gap-2">
            <Link href="/register">
              <Button className="w-full">Register</Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Already registered? Use Get Started to sign in.
            </p>
          </CardContent>
        </Card>

        {/* Track → Training / Survey */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-teal-700" aria-hidden />
              Track
            </CardTitle>
            <CardDescription>
              View training progress and complete follow-ups.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col gap-2">
            <Link href={trainingHref}>
              <Button variant="outline" className="w-full">
                Training
              </Button>
            </Link>
            <Link href="/survey">
              <Button variant="outline" className="w-full">
                Follow-up Survey
              </Button>
            </Link>
            {!TRAINEE_ID && (
              <p className="text-xs text-amber-600">Sign in to view your training.</p>
            )}
          </CardContent>
        </Card>

        {/* Manage → Identity / Contact / Consent */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings2 className="h-5 w-5 text-teal-700" aria-hidden />
              Manage
            </CardTitle>
            <CardDescription>
              Keep identity, contact and consent up to date.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col gap-2">
            <Link href={identityHref}>
              <Button variant="outline" className="w-full">
                Identity / Merge
              </Button>
            </Link>
            <Link href={contactHref}>
              <Button variant="outline" className="w-full">
                Update Contact
              </Button>
            </Link>
            <Link href={consentHref}>
              <Button variant="outline" className="w-full">
                Consent
              </Button>
            </Link>
            {!TRAINEE_ID && (
              <p className="text-xs text-amber-600">Sign in to manage your profile.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="max-w-xl text-center text-xs text-muted-foreground">
        Available in English · हिंदी · मराठी — survey i18n active: &quot;
        {surveyDict.thanks.hi}&quot; / &quot;{surveyDict.thanks.mr}&quot;
      </p>
    </main>
  );
}
