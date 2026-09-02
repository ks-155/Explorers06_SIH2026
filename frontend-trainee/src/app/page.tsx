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
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/register">
          <Button variant="outline" size="sm">Register</Button>
        </Link>
        <Link href="/consent/9f8c3d1e-2b4a-4c7d-9f2e-6a1b3c5d7e9f">
          <Button variant="outline" size="sm">Consent</Button>
        </Link>
        <Link href="/training/9f8c3d1e-2b4a-4c7d-9f2e-6a1b3c5d7e9f">
          <Button variant="outline" size="sm">Training</Button>
        </Link>
        <Link href="/identity/9f8c3d1e-2b4a-4c7d-9f2e-6a1b3c5d7e9f">
          <Button variant="outline" size="sm">Identity / Merge</Button>
        </Link>
        <Link href="/contact/9f8c3d1e-2b4a-4c7d-9f2e-6a1b3c5d7e9f">
          <Button variant="outline" size="sm">Update Contact</Button>
        </Link>
      </div>
    </main>
  );
}