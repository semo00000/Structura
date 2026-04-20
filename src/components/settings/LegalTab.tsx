"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companyLegalSchema,
  type CompanyLegalValues,
} from "@/lib/validations/company";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Check, ShieldCheck } from "lucide-react";
import { useState } from "react";

export function LegalTab() {
  const { state, dispatch } = useCompany();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CompanyLegalValues>({
    resolver: zodResolver(companyLegalSchema),
    defaultValues: {
      ice: state.company.ice,
      rc: state.company.rc,
      taxId: state.company.taxId,
      patente: state.company.patente,
      cnss: state.company.cnss,
    },
  });

  function onSubmit(data: CompanyLegalValues) {
    dispatch({ type: "UPDATE_LEGAL", payload: data });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-base">
            Identifiants juridiques marocains
          </CardTitle>
          <Badge variant="secondary" className="gap-1 text-[10px]">
            <ShieldCheck className="size-3" />
            Obligatoire
          </Badge>
        </div>
        <CardDescription>
          Ces identifiants sont requis par la législation marocaine et seront
          affichés dans le pied de page de vos documents commerciaux.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* ICE — Most important, gets its own row */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ice">
              ICE — Identifiant Commun de l&apos;Entreprise{" "}
              <span className="text-muted-foreground">(15 chiffres)</span>
            </Label>
            <Input
              id="ice"
              placeholder="001234567000089"
              maxLength={15}
              className="font-mono tracking-wider"
              {...register("ice")}
              aria-invalid={!!errors.ice}
            />
            {errors.ice && (
              <p className="text-xs text-destructive">{errors.ice.message}</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rc">RC — Registre de Commerce</Label>
              <Input
                id="rc"
                placeholder="RC-CASA-456789"
                className="font-mono"
                {...register("rc")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taxId">IF — Identifiant Fiscal</Label>
              <Input
                id="taxId"
                placeholder="12345678"
                className="font-mono"
                {...register("taxId")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="patente">Patente — Taxe Professionnelle</Label>
              <Input
                id="patente"
                placeholder="PAT-2026-00123"
                className="font-mono"
                {...register("patente")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cnss">
                CNSS — Caisse Nationale de Sécurité Sociale
              </Label>
              <Input
                id="cnss"
                placeholder="9876543"
                className="font-mono"
                {...register("cnss")}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={!isDirty && !saved}>
              {saved ? (
                <>
                  <Check className="size-4" data-icon="inline-start" />
                  Enregistré
                </>
              ) : (
                <>
                  <Save className="size-4" data-icon="inline-start" />
                  Enregistrer
                </>
              )}
            </Button>
            {isDirty && (
              <p className="text-xs text-muted-foreground">
                Modifications non enregistrées
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
