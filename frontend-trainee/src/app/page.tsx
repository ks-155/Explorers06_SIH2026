import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-4 text-center">
      <div>
        <h1 className="text-3xl font-bold">SOIS - Trainee Portal</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Skilling Outcomes Intelligence System — track your training outcomes
          and career progression.
        </p>
      </div>
      <Link href="/login">
        <Button size="lg">Get Started</Button>
      </Link>
    </main>
  );
}