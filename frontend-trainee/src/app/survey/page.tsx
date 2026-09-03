"use client";

import { useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { Locale, locales, t } from "@/lib/i18n";
import { WithTrainee } from "@/lib/withTrainee";

interface PendingFollowUp {
  id: string;
  follow_up_date?: string;
  months_after_training?: number;
  channel?: string;
  status?: string;
}

export default function SurveyList() {
  const [locale, setLocale] = useState<Locale>("hi");
  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-followups"],
    queryFn: () => api.followUps.getPending(),
  });

  const items = (data ?? []) as PendingFollowUp[];

  return (
    <WithTrainee>
      <div className="min-h-screen bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t(locale, "pendingTitle")}</h1>
            <p className="text-sm text-muted-foreground">
              {t(locale, "pendingSubtitle")}
            </p>
          </div>
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
          <Alert variant="destructive">
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <Skeleton className="h-28 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <Card className="animate-in fade-in duration-200">
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {t(locale, "noPending")}
            </CardContent>
          </Card>
        )}

        {!isLoading &&
          items.map((f) => (
            <Card key={f.id} className="animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle>{t(locale, "pendingTitle")}</CardTitle>
                <CardDescription>
                  {f.follow_up_date ? `Due ${f.follow_up_date}` : "Due now"} ·{" "}
                  {f.months_after_training != null
                    ? `${f.months_after_training} month${f.months_after_training === 1 ? "" : "s"} after training`
                    : "recent training"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={`/survey/${f.id}`}>
                  <Button size="sm" className="min-h-[44px]">
                    {t(locale, "start")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
      </div>
      </div>
    </WithTrainee>
  );
}