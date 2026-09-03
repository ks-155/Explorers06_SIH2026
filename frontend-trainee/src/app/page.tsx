import Link from "next/link";
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

const TRAINEE_ID = "9f8c3d1e-2b4a-4c7d-9f2e-6a1b3c5d7e9f";

export default function Home() {
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
            <Link href={`/training/${TRAINEE_ID}`}>
              <Button variant="outline" className="w-full">
                Training
              </Button>
            </Link>
            <Link href="/survey">
              <Button variant="outline" className="w-full">
                Follow-up Survey
              </Button>
            </Link>
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
            <Link href={`/identity/${TRAINEE_ID}`}>
              <Button variant="outline" className="w-full">
                Identity / Merge
              </Button>
            </Link>
            <Link href={`/contact/${TRAINEE_ID}`}>
              <Button variant="outline" className="w-full">
                Update Contact
              </Button>
            </Link>
            <Link href={`/consent/${TRAINEE_ID}`}>
              <Button variant="outline" className="w-full">
                Consent
              </Button>
            </Link>
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
