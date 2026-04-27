"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { teams } from "@/lib/appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  const teamId = searchParams.get("teamId");
  const membershipId = searchParams.get("membershipId");
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  useEffect(() => {
    if (!teamId || !membershipId || !userId || !secret) {
      setStatus("error");
      setError("Paramètres d'invitation invalides ou manquants.");
      return;
    }

    const accept = async () => {
      try {
        await teams.updateMembershipStatus(teamId, membershipId, userId, secret);
        setStatus("success");
      } catch (err: any) {
        console.error("Failed to accept invite:", err);
        setStatus("error");
        setError(err.message || "Une erreur est survenue lors de l'acceptation de l'invitation.");
      }
    };

    accept();
  }, [teamId, membershipId, userId, secret]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {status === "loading" && <Loader2 className="size-6 animate-spin text-primary" />}
            {status === "success" && <CheckCircle className="size-6 text-green-600" />}
            {status === "error" && <XCircle className="size-6 text-destructive" />}
          </div>
          <CardTitle>
            {status === "loading" && "Traitement de l'invitation..."}
            {status === "success" && "Bienvenue chez Structura !"}
            {status === "error" && "Oups !"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Veuillez patienter pendant que nous validons votre accès."}
            {status === "success" && "Vous avez rejoint l'écosystème de votre entreprise avec succès."}
            {status === "error" && error}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === "success" && (
            <p className="text-sm text-muted-foreground">
              Vous pouvez maintenant accéder au tableau de bord commercial et collaborer avec votre équipe.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === "success" ? (
            <Button className="w-full" nativeButton={false} render={<Link href="/dashboard" />}>
              Accéder au Dashboard
            </Button>
          ) : status === "error" ? (
            <Button variant="outline" className="w-full" nativeButton={false} render={<Link href="/login" />}>
              Retour à la connexion
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
