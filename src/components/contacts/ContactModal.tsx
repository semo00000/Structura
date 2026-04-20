"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactFormValues } from "@/lib/validations/contact";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, X } from "lucide-react";

interface ContactModalProps {
  defaultValues: Partial<ContactFormValues>;
  onSave: (data: ContactFormValues) => void;
  onCancel: () => void;
}

export function ContactModal({
  defaultValues,
  onSave,
  onCancel,
}: ContactModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      type: "CLIENT",
      category: "COMPANY",
      name: "",
      companyName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      ice: "",
      ...defaultValues,
    },
  });

  const selectedType = watch("type");
  const selectedCategory = watch("category");

  return (
    <form
      onSubmit={handleSubmit(onSave)}
      className="flex flex-col gap-4"
    >
      {/* Type & Category selectors */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label>Type</Label>
          <div className="flex gap-1">
            {(["CLIENT", "FOURNISSEUR"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setValue("type", t, { shouldDirty: true })}
                className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  selectedType === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                {t === "CLIENT" ? "Client" : "Fournisseur"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Catégorie</Label>
          <div className="flex gap-1">
            {(["COMPANY", "INDIVIDUAL"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue("category", c, { shouldDirty: true })}
                className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  selectedCategory === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-accent"
                }`}
              >
                {c === "COMPANY" ? "Entreprise" : "Particulier"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Name & Company */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-name">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-name"
            placeholder="Ahmed Bennani"
            {...register("name")}
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-company">Raison sociale</Label>
          <Input
            id="contact-company"
            placeholder="SARL TechnoMaroc"
            {...register("companyName")}
          />
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="ahmed@technomaroc.ma"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-phone">Téléphone</Label>
          <Input
            id="contact-phone"
            placeholder="+212 661 234 567"
            {...register("phone")}
          />
        </div>
      </div>

      {/* Address & City */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-address">Adresse</Label>
          <Input
            id="contact-address"
            placeholder="45 Rue Hassan II"
            {...register("address")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contact-city">Ville</Label>
          <Input
            id="contact-city"
            placeholder="Casablanca"
            {...register("city")}
          />
        </div>
      </div>

      {/* ICE */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="contact-ice">
          ICE{" "}
          <span className="text-muted-foreground">(15 chiffres)</span>
        </Label>
        <Input
          id="contact-ice"
          placeholder="001234567000089"
          maxLength={15}
          className="max-w-xs font-mono tracking-wider"
          {...register("ice")}
          aria-invalid={!!errors.ice}
        />
        {errors.ice && (
          <p className="text-xs text-destructive">{errors.ice.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="size-4" data-icon="inline-start" />
          Annuler
        </Button>
        <Button type="submit">
          <Save className="size-4" data-icon="inline-start" />
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
