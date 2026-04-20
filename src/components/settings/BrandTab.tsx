"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companyBrandSchema,
  type CompanyBrandValues,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Check } from "lucide-react";
import { useState } from "react";

export function BrandTab() {
  const { state, dispatch } = useCompany();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<CompanyBrandValues>({
    resolver: zodResolver(companyBrandSchema),
    defaultValues: {
      logoUrl: state.company.logoUrl,
      primaryColor: state.company.primaryColor,
      defaultFooter: state.company.defaultFooter,
    },
  });

  const watchedColor = watch("primaryColor");

  function onSubmit(data: CompanyBrandValues) {
    dispatch({ type: "UPDATE_BRANDING", payload: data });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Identité visuelle</CardTitle>
        <CardDescription>
          Personnalisez l&apos;apparence de vos documents avec votre logo et vos
          couleurs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="logoUrl">URL du logo</Label>
            <Input
              id="logoUrl"
              type="url"
              placeholder="https://votre-site.ma/logo.png"
              {...register("logoUrl")}
              aria-invalid={!!errors.logoUrl}
            />
            {errors.logoUrl && (
              <p className="text-xs text-destructive">
                {errors.logoUrl.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="primaryColor">Couleur principale</Label>
            <div className="flex items-center gap-3">
              <div
                className="size-10 rounded-md border"
                style={{ backgroundColor: watchedColor }}
              />
              <Input
                id="primaryColor"
                placeholder="#2563EB"
                className="max-w-40 font-mono"
                {...register("primaryColor")}
                aria-invalid={!!errors.primaryColor}
              />
            </div>
            {errors.primaryColor && (
              <p className="text-xs text-destructive">
                {errors.primaryColor.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultFooter">
              Pied de page par défaut des documents
            </Label>
            <Textarea
              id="defaultFooter"
              rows={3}
              placeholder="Merci pour votre confiance. Conditions de paiement : 30 jours net."
              {...register("defaultFooter")}
            />
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
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
