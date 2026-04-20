"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companyGeneralSchema,
  type CompanyGeneralValues,
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

export function GeneralTab() {
  const { state, dispatch } = useCompany();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CompanyGeneralValues>({
    resolver: zodResolver(companyGeneralSchema),
    defaultValues: {
      name: state.company.name,
      address: state.company.address,
      city: state.company.city,
      phone: state.company.phone,
      email: state.company.email,
    },
  });

  function onSubmit(data: CompanyGeneralValues) {
    dispatch({ type: "UPDATE_GENERAL", payload: data });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Informations générales</CardTitle>
        <CardDescription>
          Les coordonnées de votre entreprise apparaîtront sur vos documents
          commerciaux.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">
                Raison sociale <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Structura SARL"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@structura.ma"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                placeholder="+212 5XX XXX XXX"
                {...register("phone")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                placeholder="Casablanca"
                {...register("city")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="123 Boulevard Mohammed V, Casablanca"
              {...register("address")}
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
