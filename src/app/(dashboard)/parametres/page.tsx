"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ID, Query } from "appwrite";
import { z } from "zod";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Save,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { APPWRITE_CONFIG, account, databases } from "@/lib/appwrite";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const companySettingsSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(2, "Le nom de l'entreprise doit contenir au moins 2 caractères"),
  address: z.string().trim().min(5, "L'adresse est requise"),
  telephone: z.string().trim().min(6, "Le téléphone est requis"),
  email: z.string().trim().email("Email invalide"),
  ice: z
    .string()
    .trim()
    .regex(/^\d{15}$/, "L'ICE doit contenir exactement 15 chiffres"),
  rc: z.string().trim().min(2, "Le RC est requis"),
  ifValue: z.string().trim().min(2, "L'IF est requis"),
  patente: z.string().trim().min(2, "La patente est requise"),
  cnss: z.string().trim().min(2, "Le CNSS est requis"),
});

type CompanySettingsValues = z.infer<typeof companySettingsSchema>;

type NoticeState = {
  type: "success" | "error";
  message: string;
};

const defaultValues: CompanySettingsValues = {
  companyName: "",
  address: "",
  telephone: "",
  email: "",
  ice: "",
  rc: "",
  ifValue: "",
  patente: "",
  cnss: "",
};

function readStringValue(
  source: Record<string, unknown>,
  key: keyof CompanySettingsValues
) {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function toErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Une erreur est survenue. Veuillez réessayer.";
}

export default function ParametresPage() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<CompanySettingsValues>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues,
  });

  const databaseId = APPWRITE_CONFIG.databaseId;
  const collectionId = APPWRITE_CONFIG.companyCollectionId;
  const hasAppwriteConfig =
    Boolean(APPWRITE_CONFIG.endpoint) &&
    Boolean(APPWRITE_CONFIG.projectId) &&
    Boolean(databaseId) &&
    Boolean(collectionId);

  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) {
      return null;
    }

    return new Intl.DateTimeFormat("fr-MA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(lastSavedAt);
  }, [lastSavedAt]);

  const resolveCurrentUserId = useCallback(async () => {
    if (currentUserId) {
      return currentUserId;
    }

    const user = await account.get();
    setCurrentUserId(user.$id);
    return user.$id;
  }, [currentUserId]);

  useEffect(() => {
    let mounted = true;

    async function loadCompanySettings() {
      if (!databaseId || !collectionId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const userId = await resolveCurrentUserId();

        const response = await databases.listDocuments(databaseId, collectionId, [
          Query.equal("userId", userId),
          Query.limit(1),
        ]);

        const existingDocument = response.documents[0];
        if (!mounted || !existingDocument) {
          return;
        }

        setDocumentId(existingDocument.$id);
        reset({
          companyName: readStringValue(existingDocument, "companyName"),
          address: readStringValue(existingDocument, "address"),
          telephone: readStringValue(existingDocument, "telephone"),
          email: readStringValue(existingDocument, "email"),
          ice: readStringValue(existingDocument, "ice"),
          rc: readStringValue(existingDocument, "rc"),
          ifValue: readStringValue(existingDocument, "ifValue"),
          patente: readStringValue(existingDocument, "patente"),
          cnss: readStringValue(existingDocument, "cnss"),
        });
        setLastSavedAt(new Date(existingDocument.$updatedAt));
      } catch (error) {
        if (mounted) {
          setNotice({
            type: "error",
            message: `Chargement impossible: ${toErrorMessage(error)}`,
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCompanySettings();

    return () => {
      mounted = false;
    };
  }, [collectionId, databaseId, reset, resolveCurrentUserId]);

  const onSubmit = handleSubmit(async (values) => {
    if (!databaseId || !collectionId) {
      setNotice({
        type: "error",
        message:
          "Configuration Appwrite incomplète. Vérifiez les variables NEXT_PUBLIC_APPWRITE_*.",
      });
      return;
    }

    setNotice(null);

    try {
      const userId = await resolveCurrentUserId();

      const payload: CompanySettingsValues = {
        companyName: values.companyName.trim(),
        address: values.address.trim(),
        telephone: values.telephone.trim(),
        email: values.email.trim(),
        ice: values.ice.trim(),
        rc: values.rc.trim(),
        ifValue: values.ifValue.trim(),
        patente: values.patente.trim(),
        cnss: values.cnss.trim(),
      };

      let targetDocumentId = documentId;

      if (targetDocumentId) {
        await databases.updateDocument(
          databaseId,
          collectionId,
          targetDocumentId,
          payload
        );
      } else {
        const existing = await databases.listDocuments(databaseId, collectionId, [
          Query.equal("userId", userId),
          Query.limit(1),
        ]);
        const firstDocument = existing.documents[0];

        if (firstDocument) {
          targetDocumentId = firstDocument.$id;
          await databases.updateDocument(
            databaseId,
            collectionId,
            targetDocumentId,
            payload
          );
        } else {
          const createdDocument = await databases.createDocument(
            databaseId,
            collectionId,
            ID.unique(),
            {
              ...payload,
              userId,
            }
          );
          targetDocumentId = createdDocument.$id;
        }
      }

      setDocumentId(targetDocumentId);
      setLastSavedAt(new Date());
      setNotice({
        type: "success",
        message: "Paramètres enregistrés avec succès dans Appwrite.",
      });
      reset(values);
    } catch (error) {
      setNotice({
        type: "error",
        message: `Échec de l'enregistrement: ${toErrorMessage(error)}`,
      });
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">
          Paramètres de l&apos;entreprise
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Renseignez vos informations générales et vos identifiants légaux
          marocains. Ces données seront utilisées dans les documents commerciaux
          et les PDF.
        </p>
        {lastSavedLabel ? (
          <p className="mt-2 text-xs text-slate-500">
            Dernière sauvegarde: {lastSavedLabel}
          </p>
        ) : null}
      </div>

      {!hasAppwriteConfig ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Les variables Appwrite sont incomplètes. Complétez votre
          <span className="font-mono"> .env.local</span> avant d&apos;enregistrer.
        </div>
      ) : null}

      {notice ? (
        <div
          className={cn(
            "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
            notice.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-red-300 bg-red-50 text-red-900"
          )}
        >
          {notice.type === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          ) : (
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          )}
          <p>{notice.message}</p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-[#2563EB]" />
              <CardTitle className="text-base text-slate-900">
                Informations générales
              </CardTitle>
            </div>
            <CardDescription>
              Informations administratives affichées sur vos devis et factures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
                <Input
                  id="companyName"
                  placeholder="Ex: Structura SARL"
                  aria-invalid={Boolean(errors.companyName)}
                  {...register("companyName")}
                />
                {errors.companyName ? (
                  <p className="text-xs text-destructive">
                    {errors.companyName.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  placeholder="+212 5XX XX XX XX"
                  aria-invalid={Boolean(errors.telephone)}
                  {...register("telephone")}
                />
                {errors.telephone ? (
                  <p className="text-xs text-destructive">
                    {errors.telephone.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contact@structura.ma"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  placeholder="Rue, quartier, ville, code postal"
                  aria-invalid={Boolean(errors.address)}
                  {...register("address")}
                />
                {errors.address ? (
                  <p className="text-xs text-destructive">
                    {errors.address.message}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[#2563EB]" />
              <CardTitle className="text-base text-slate-900">
                Identifiants légaux marocains
              </CardTitle>
              <Badge
                variant="secondary"
                className="border border-blue-100 bg-blue-50 text-blue-700"
              >
                Obligatoire
              </Badge>
            </div>
            <CardDescription>
              Ces références apparaissent dans le pied de page légal de vos PDF.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="ice">ICE (15 chiffres)</Label>
                <Input
                  id="ice"
                  maxLength={15}
                  className="font-mono tracking-wider"
                  placeholder="001234567000089"
                  aria-invalid={Boolean(errors.ice)}
                  {...register("ice")}
                />
                {errors.ice ? (
                  <p className="text-xs text-destructive">{errors.ice.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rc">RC</Label>
                <Input
                  id="rc"
                  className="font-mono"
                  placeholder="RC-CASA-456789"
                  aria-invalid={Boolean(errors.rc)}
                  {...register("rc")}
                />
                {errors.rc ? (
                  <p className="text-xs text-destructive">{errors.rc.message}</p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ifValue">IF</Label>
                <Input
                  id="ifValue"
                  className="font-mono"
                  placeholder="12345678"
                  aria-invalid={Boolean(errors.ifValue)}
                  {...register("ifValue")}
                />
                {errors.ifValue ? (
                  <p className="text-xs text-destructive">
                    {errors.ifValue.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="patente">Patente</Label>
                <Input
                  id="patente"
                  className="font-mono"
                  placeholder="PAT-2026-00123"
                  aria-invalid={Boolean(errors.patente)}
                  {...register("patente")}
                />
                {errors.patente ? (
                  <p className="text-xs text-destructive">
                    {errors.patente.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cnss">CNSS</Label>
                <Input
                  id="cnss"
                  className="font-mono"
                  placeholder="9876543"
                  aria-invalid={Boolean(errors.cnss)}
                  {...register("cnss")}
                />
                {errors.cnss ? (
                  <p className="text-xs text-destructive">
                    {errors.cnss.message}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-xs text-slate-600">
            {isDirty
              ? "Des modifications ne sont pas encore enregistrées."
              : "Toutes les modifications sont enregistrées."}
          </p>
          <Button
            type="submit"
            disabled={isLoading || isSubmitting || !hasAppwriteConfig}
            className="bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="size-4" data-icon="inline-start" />
                Enregistrer les paramètres
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
