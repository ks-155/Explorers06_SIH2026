"use client";

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

interface PendingFollowUp {
  id: string;
  follow_up_date?: string;
  months_after_training?: number;
  channel?: string;
  status?: string;
}

export default function SurveyList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-followups"],
    queryFn: () => api.followUps.getPending(),
  });

  const items = (data ?? []) as PendingFollowUp[];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Follow-up Surveys</h1>
          <p className="text-sm text-muted-foreground">
            Short questions to track your training outcome. Takes under a minute.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

        {!isLoading && items.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              No pending follow-ups right now.
            </CardContent>
          </Card>
        )}

        {items.map((f) => (
          <Card key={f.id}>
            <CardHeader>
              <CardTitle>Outcome follow-up</CardTitle>
              <CardDescription>
                {f.follow_up_date ? `Due ${f.follow_up_date}` : "Due now"} ·{" "}
                {f.months_after_training != null
                  ? `${f.months_after_training} month${f.months_after_training === 1 ? "" : "s"} after training`
                  : "recent training"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/survey/${f.id}`}>
                <Button size="sm">Start</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}