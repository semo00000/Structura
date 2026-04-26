"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";

import { account } from "@/lib/appwrite";
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

  return "Connexion impossible. Verifiez vos identifiants puis reessayez.";
}

function LoginContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [checkingSession, setCheckingSession] = React.useState(true);

  const nextTarget = searchParams.get("next") || "/statistiques";
  const safeTarget = nextTarget.startsWith("/") ? nextTarget : "/statistiques";

  // On mount: check if user already has an active session
  React.useEffect(() => {
    async function checkExistingSession() {
      try {
        await account.get();
        // If we get here, user IS logged in. Fix the cookie just in case.
        document.cookie = "structura_session=1; path=/; max-age=2592000";
        window.location.href = safeTarget;
      } catch {
        // No active session — show login form
        setCheckingSession(false);
      }
    }

    checkExistingSession();
  }, [safeTarget]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    try {
      // First, try to delete any stale session to avoid "session already active" errors
      try {
        await account.deleteSession("current");
      } catch {
        // No existing session to delete — that's fine
      }

      // Now create the new session
      await account.createEmailPasswordSession(email.trim(), password);
      // Manually set a cookie for the proxy to see so we don't get trapped in a redirect loop natively
      document.cookie = "structura_session=1; path=/; max-age=2592000";
      
      window.location.href = safeTarget;
    } catch (submitError) {
      setIsSubmitting(false);
      const msg = toErrorMessage(submitError);
      console.error("[Structura Login] Auth error:", msg);
      setError(msg);
    }
  }

  // Show loading while checking for existing session
  if (checkingSession) {
    return (
      <Card className="w-full border-border bg-card/95 shadow-xl backdrop-blur">
        <CardContent className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-[#2563EB]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border bg-card/95 shadow-xl backdrop-blur">
      <CardHeader className="space-y-4">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563EB]">
          <ShieldCheck className="size-3.5" />
          Structura Secure Access
        </div>
        <div>
          <CardTitle className="text-xl text-slate-900">Connexion</CardTitle>
          <CardDescription className="mt-1 text-slate-600">
            Connectez-vous pour acceder au tableau de bord et aux donnees Appwrite.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
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
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Nouveau sur Structura ?{" "}
          <Link href="/register" className="font-medium text-[#2563EB] hover:text-[#1D4ED8]">
            Creer un compte
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#dbeafe,_#f8fafc_45%,_#e2e8f0_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md items-center">
        <React.Suspense fallback={
          <Card className="w-full border-border bg-card/95 shadow-xl backdrop-blur animate-pulse">
            <CardHeader className="h-40" />
            <CardContent className="h-60" />
          </Card>
        }>
          <LoginContent />
        </React.Suspense>
      </div>
    </div>
  );
}
