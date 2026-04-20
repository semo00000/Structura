"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  documentSettingsSchema,
  type DocumentSettingsValues,
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
import { Save, Check } from "lucide-react";
import { useState } from "react";

export function DocumentsTab() {
  const { state, dispatch } = useCompany();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<DocumentSettingsValues>({
    resolver: zodResolver(documentSettingsSchema),
    defaultValues: state.company.documentSettings,
  });

  function onSubmit(data: DocumentSettingsValues) {
    dispatch({ type: "UPDATE_DOCUMENT_SETTINGS", payload: data });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const toggles = [
    {
      key: "showReference" as const,
      label: "Colonne Référence",
      description: "Afficher la référence produit dans les documents",
    },
    {
      key: "showTvaColumn" as const,
      label: "Colonne TVA",
      description: "Afficher le taux de TVA par ligne",
    },
    {
      key: "showUnitPrice" as const,
      label: "Colonne Prix unitaire",
      description: "Afficher le prix unitaire HT par ligne",
    },
    {
      key: "showDiscount" as const,
      label: "Colonne Remise",
      description: "Afficher une colonne remise dans les documents",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Paramètres des documents</CardTitle>
        <CardDescription>
          Configurez les colonnes visibles et le format de vos factures, devis et
          bons de livraison.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          {/* Column Toggles */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium">Colonnes visibles</Label>
            <p className="mb-3 text-xs text-muted-foreground">
              Choisissez les colonnes à afficher dans vos documents PDF.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {toggles.map((toggle) => {
                const checked = watch(toggle.key);
                return (
                  <label
                    key={toggle.key}
                    className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setValue(toggle.key, e.target.checked, { shouldDirty: true })}
                      className="mt-0.5 size-4 rounded border-input accent-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{toggle.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {toggle.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* PDF Settings */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="doc-color">Couleur des documents</Label>
              <div className="flex items-center gap-3">
                <div
                  className="size-8 rounded border"
                  style={{ backgroundColor: watch("primaryColor") }}
                />
                <Input
                  id="doc-color"
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
              <Label htmlFor="paper-size">Format du papier</Label>
              <select
                id="paper-size"
                className="flex h-9 w-full max-w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("paperSize")}
              >
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="footer-text">Texte de pied de page</Label>
            <Input
              id="footer-text"
              placeholder="Merci pour votre confiance."
              {...register("footerText")}
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
