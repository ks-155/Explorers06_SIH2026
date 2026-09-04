"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

export default function ReportEmploymentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const traineeId = params?.id;

  const [jobRole, setJobRole] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [joiningDate, setJoiningDate] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [employerName, setEmployerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsPending(true);
    try {
      await api.employment.create({
        trainee_id: traineeId as string,
        job_role: jobRole,
        employment_type: employmentType,
        joining_date: joiningDate || undefined,
        current_salary: currentSalary ? Number(currentSalary) : undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/training/${traineeId}`);
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Report Employment</CardTitle>
          <CardDescription>
            Share your current employment details to improve your confidence score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                <AlertDescription>
                  Employment reported successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="job_role">Job Role</Label>
              <Input
                id="job_role"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                placeholder="e.g. Electrician, Plumber, CNC Operator"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employment_type">Employment Type</Label>
              <select
                id="employment_type"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="self_employed">Self Employed</option>
                <option value="apprenticeship">Apprenticeship</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joining_date">Joining Date</Label>
                <Input
                  id="joining_date"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_salary">Monthly Salary (₹)</Label>
                <Input
                  id="current_salary"
                  type="number"
                  min="0"
                  placeholder="e.g. 25000"
                  value={currentSalary}
                  onChange={(e) => setCurrentSalary(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employer_name">Employer Name (optional)</Label>
              <Input
                id="employer_name"
                value={employerName}
                onChange={(e) => setEmployerName(e.target.value)}
                placeholder="Company or employer name"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isPending || success}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {isPending ? "Submitting..." : "Report Employment"}
            </Button>
            <Link href={`/training/${traineeId}`} className="block text-center">
              <Button variant="ghost" className="w-full text-sm" type="button">
                Back to Training
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
