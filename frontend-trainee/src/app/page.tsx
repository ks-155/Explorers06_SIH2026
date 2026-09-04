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
import { UserPlus, GraduationCap, ClipboardList, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/api-client";

export default function Home() {
  const [traineeId, setTraineeId] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "hi" | "mr">("en");

  useEffect(() => {
    const s = getSession();
    if (s?.userId && s?.role === "trainee") setTraineeId(s.userId);
  }, []);

  const TRAINEE_ID = traineeId ?? null;
  const trainingHref = TRAINEE_ID ? `/training/${TRAINEE_ID}` : "/login";
  const surveyHref = "/survey";

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 p-6 bg-gray-50">
      <section className="max-w-2xl text-center pt-12 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          SOIS — Skilling Outcomes Intelligence System
        </h1>
        <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
          Track your training outcomes, report employment, and help improve
          skill-development programmes across India.
        </p>
        {!TRAINEE_ID && (
          <div className="mt-6">
            <Link href="/login">
              <Button size="lg" className="min-h-[44px] rounded-lg">
                Get Started
              </Button>
            </Link>
          </div>
        )}
      </section>

      <div className="grid w-full max-w-4xl gap-4 md:grid-cols-3">
        <Card className="flex flex-col hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-teal-700" aria-hidden />
              Register
            </CardTitle>
            <CardDescription>
              Register as a new trainee to get started with SOIS.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href="/register">
              <Button className="w-full min-h-[44px] rounded-lg">
                Register
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="flex flex-col hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5 text-teal-700" aria-hidden />
              Track Training
            </CardTitle>
            <CardDescription>
              View your training records, employment status, and confidence score.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href={trainingHref}>
              <Button className="w-full min-h-[44px] rounded-lg" disabled={!TRAINEE_ID}>
                Training Records
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </Link>
            {!TRAINEE_ID && (
              <p className="mt-2 text-xs text-amber-600">Sign in to view your training.</p>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5 text-teal-700" aria-hidden />
              Surveys
            </CardTitle>
            <CardDescription>
              Complete follow-up surveys to help improve training outcomes.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto">
            <Link href={surveyHref}>
              <Button className="w-full min-h-[44px] rounded-lg">
                Open Surveys
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Language:</span>
        <div className="flex gap-1">
          {(["en", "hi", "mr"] as const).map((l) => (
            <Button
              key={l}
              variant={lang === l ? "default" : "outline"}
              size="sm"
              className="min-h-[36px] rounded-lg text-xs"
              onClick={() => setLang(l)}
            >
              {l === "en" ? "English" : l === "hi" ? "हिंदी" : "मराठी"}
            </Button>
          ))}
        </div>
      </div>

      <p className="max-w-xl text-center text-xs text-muted-foreground pb-8">
        {lang === "en"
          ? "Available in English · हिंदी · मराठी"
          : lang === "hi"
            ? `हिंदी · English · मराठी — सर्वेक्षण: "${surveyDict.thanks.hi}"`
            : `मराठी · English · हिंदी — सर्वेक्षण: "${surveyDict.thanks.mr}"`}
      </p>
    </main>
  );
}
