"use client";

import * as React from "react";
import { ID } from "appwrite";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { APPWRITE_CONFIG, account, databases } from "@/lib/appwrite";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ContactType = "client" | "fournisseur";

const contactFormSchema = z.object({
  nameOrCompany: z
    .string()
    .trim()
    .min(2, "Le nom ou l'entreprise doit contenir au moins 2 caracteres."),
  email: z.string().trim().email("Adresse email invalide."),
  telephone: z
    .string()
    .trim()
    .min(6, "Le telephone doit contenir au moins 6 caracteres."),
  address: z
    .string()
    .trim()
    .min(5, "L'adresse doit contenir au moins 5 caracteres."),
  ice: z
    .string()
    .trim()
    .regex(/^\d{15}$/, "L'ICE doit contenir exactement 15 chiffres."),
  category: z.enum(["B2B", "B2C"]),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const defaultValues: ContactFormValues = {
  nameOrCompany: "",
  email: "",
  telephone: "",
  address: "",
  ice: "",
  category: "B2B",
};

function toErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Operation impossible pour le moment.";
}

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactType: ContactType;
  onSaved?: () => void | Promise<void>;
}

export function ContactFormModal({
  open,
  onOpenChange,
  contactType,
  onSaved,
}: ContactFormModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
  });

  React.useEffect(() => {
    if (!open) {
      reset(defaultValues);
    }
  }, [open, reset]);

  const actionLabel = contactType === "client" ? "client" : "fournisseur";

  const onSubmit = handleSubmit(async (values) => {
    const { databaseId, contactsCollectionId } = APPWRITE_CONFIG;

    if (!databaseId || !contactsCollectionId) {
      toast({
        title: "Configuration Appwrite incomplete",
        description:
          "Ajoutez NEXT_PUBLIC_APPWRITE_CONTACTS_COLLECTION_ID dans .env.local.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await account.get();

      await databases.createDocument(databaseId, contactsCollectionId, ID.unique(), {
        nameOrCompany: values.nameOrCompany,
        email: values.email,
        telephone: values.telephone,
        address: values.address,
        ice: values.ice,
        category: values.category,
        type: contactType,
        userId: user.$id,
      });

      toast({
        title: `${values.nameOrCompany} enregistre`,
        description: `Le ${actionLabel} a ete ajoute avec succes.`,
        variant: "success",
      });

      onOpenChange(false);

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      toast({
        title: "Enregistrement impossible",
        description: toErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4 text-[#2563EB]" />
            Nouveau {actionLabel}
          </DialogTitle>
          <DialogDescription>
            Renseignez les informations du {actionLabel} pour l&apos;enregistrer dans Appwrite.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="nameOrCompany">Nom / Entreprise</Label>
            <Input
              id="nameOrCompany"
              placeholder="Ex: Atlas Import"
              {...register("nameOrCompany")}
              aria-invalid={Boolean(errors.nameOrCompany)}
            />
            {errors.nameOrCompany ? (
              <p className="text-xs text-destructive">{errors.nameOrCompany.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contact@entreprise.ma"
                {...register("email")}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telephone">Telephone</Label>
              <Input
                id="telephone"
                placeholder="+212 6XX XX XX XX"
                {...register("telephone")}
                aria-invalid={Boolean(errors.telephone)}
              />
              {errors.telephone ? (
                <p className="text-xs text-destructive">{errors.telephone.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="Rue, quartier, ville"
              {...register("address")}
              aria-invalid={Boolean(errors.address)}
            />
            {errors.address ? (
              <p className="text-xs text-destructive">{errors.address.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ice">ICE (15 chiffres)</Label>
              <Input
                id="ice"
                maxLength={15}
                className="font-mono"
                placeholder="001234567000089"
                {...register("ice")}
                aria-invalid={Boolean(errors.ice)}
              />
              {errors.ice ? (
                <p className="text-xs text-destructive">{errors.ice.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category">Categorie</Label>
              <select
                id="category"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("category")}
              >
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
              </select>
              {errors.category ? (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                `Enregistrer le ${actionLabel}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
