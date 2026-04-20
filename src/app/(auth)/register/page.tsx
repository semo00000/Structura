"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ID } from "appwrite";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

import { APPWRITE_CONFIG, account, databases, teams } from "@/lib/appwrite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function toErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Inscription impossible. Verifiez vos informations puis reessayez.";
}

function isSilentSessionError(error: unknown): boolean {
  const message = toErrorMessage(error).toLowerCase();
  return message.includes("prohibited") || message.includes("active");
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await account.create(ID.unique(), email.trim(), password, name.trim());

      try {
        await account.createEmailPasswordSession(email.trim(), password);
      } catch (sessionError) {
        if (isSilentSessionError(sessionError)) {
          router.push("/statistiques");
          router.refresh();
          return;
        }

        throw sessionError;
      }

      // Pillar 1: Multi-Tenancy - Create the Team
      try {
        await teams.create(ID.unique(), `${name} Business`);
      } catch (teamError) {
        console.error("Failed to create multi-tenant team:", teamError);
        // Continue anyway; the user is registered. They might need support to fix the team or it can be handled by cloud functions.
      }

      router.replace("/statistiques");
      router.refresh();
    } catch (submitError) {
      setError(toErrorMessage(submitError));
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_45%,_#e2e8f0_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <Card className="w-full border-slate-200 bg-white/95 shadow-xl backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
              <ShieldCheck className="size-3.5" />
              Structura Account Setup
            </div>
            <div>
              <CardTitle className="text-xl text-slate-900">Inscription</CardTitle>
              <CardDescription className="mt-1 text-slate-600">
                Creez votre compte pour securiser vos sessions et acceder a l&apos;espace dashboard.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nom et prenom"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.ma"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 8 caracteres"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirmation du mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Retapez le mot de passe"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <Button
                type="submit"
                className="w-full bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creation du compte...
                  </>
                ) : (
                  "Creer le compte"
                )}
              </Button>
            </form>

            <p className="mt-4 text-sm text-slate-600">
              Vous avez deja un compte ? {" "}
              <Link href="/login" className="font-medium text-[#2563EB] hover:text-[#1D4ED8]">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
