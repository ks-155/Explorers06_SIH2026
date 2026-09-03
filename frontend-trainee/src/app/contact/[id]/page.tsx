"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import { WithTrainee } from "@/lib/withTrainee";
import { Loader2 } from "lucide-react";

export default function ContactPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [phone, setPhone] = useState("");
  const [alternatePhone, setAlternatePhone] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [state, setState] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    setSuccess(null);
    setIsPending(true);
    try {
      const payload = {
        ...(phone ? { phone } : {}),
        ...(alternatePhone ? { alternate_phone: alternatePhone } : {}),
        ...(districtId ? { district_id: Number(districtId) } : {}),
        ...(state ? { state } : {}),
      };
      await api.trainees.updateContact(id, payload);
      setSuccess("Contact details updated. You can now be re-linked to your records.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <WithTrainee>
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Update Contact Details</CardTitle>
          <CardDescription>
            Changed phone or moved districts? Tell us so we can re-link your records.
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
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="phone">New Primary Phone</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt">Alternate Phone</Label>
              <Input
                id="alt"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder="Optional"
                value={alternatePhone}
                onChange={(e) => setAlternatePhone(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district">New District ID</Label>
                <Input
                  id="district"
                  type="number"
                  placeholder="e.g. 27"
                  value={districtId}
                  onChange={(e) => setDistrictId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              {isPending ? "Saving…" : "Update Contact"}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </WithTrainee>
  );
}