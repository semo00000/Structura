"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, UserCog } from "lucide-react";

export default function ParametresPage() {
  const { email, displayName } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres du compte</h1>
          <p className="mt-2 text-muted-foreground">
            Gérez vos informations de profil et vos préférences de sécurité.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1 text-xs font-semibold text-amber-600 bg-amber-500/10 hover:bg-amber-500/20">
          <UserCog className="size-3.5" />
          Advanced settings coming soon
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-[#2563EB]" />
              Informations personnelles
            </CardTitle>
            <CardDescription>
              Les données de base liées à votre identité sur Structura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom d&apos;affichage</Label>
              <Input id="name" value={displayName} disabled />
              <p className="text-[11px] text-muted-foreground">
                Votre nom tel qu&apos;il apparaît sur la plateforme.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email principale</Label>
              <Input id="email" type="email" value={email} disabled />
              <p className="text-[11px] text-muted-foreground">
                Cet email est verrouillé. Contactez le support pour le modifier.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
