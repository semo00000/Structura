"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ID, Permission, Role, AppwriteException } from "appwrite";
import { Upload, Loader2, Building, ShieldCheck, Mail } from "lucide-react";
import { APPWRITE_CONFIG, account, databases, teams, storage } from "@/lib/appwrite";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    address: "",
    city: "Casablanca",
    telephone: "",
    ice: "",
    rc: "",
    ifValue: "",
    patente: "",
    cnss: "",
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { databaseId, companyCollectionId, logosBucketId } = APPWRITE_CONFIG;
      if (!databaseId || !companyCollectionId || !logosBucketId) throw new Error("Missing config");

      // 1. Get currentUser and the Team
      const currentUser = await account.get();
      const userTeams = await teams.list();
      
      let teamId = userTeams.teams.length > 0 ? userTeams.teams[0].$id : null;

      // Ensure Team exists (Fallback if register step somehow failed to make one)
      if (!teamId) {
        const fallbackTeam = await teams.create(ID.unique(), `${formData.companyName} Business`);
        teamId = fallbackTeam.$id;
      }

      // 2. Upload Logo if exists
      let logoUrl = "";
      if (logoFile) {
        const uploadedFile = await storage.createFile(
          logosBucketId,
          ID.unique(),
          logoFile,
          [Permission.read(Role.any()), Permission.write(Role.team(teamId))] // Logo readable publicly for PDFs
        );
        // Build URL directly (simplest way for browser images and PDFs)
        logoUrl = `${APPWRITE_CONFIG.endpoint}/storage/buckets/${logosBucketId}/files/${uploadedFile.$id}/view?project=${APPWRITE_CONFIG.projectId}`;
      }

      // 3. Create the Company Settings Document strictly locked to this Team
      const docPayload = {
        userId: currentUser.$id,
        teamId: teamId, // Storing reference for mapping
        companyName: formData.companyName,
        email: formData.email || currentUser.email,
        address: formData.address,
        city: formData.city,
        telephone: formData.telephone,
        ice: formData.ice,
        rc: formData.rc,
        ifValue: formData.ifValue,
        patente: formData.patente,
        cnss: formData.cnss,
        logoUrl: logoUrl,
        primaryColor: "#2563EB",
        defaultFooter: "Merci pour votre confiance. Conditions de paiement : 30 jours net.",
        planTier: "Starter",
      };

      await databases.createDocument(
        databaseId,
        companyCollectionId,
        ID.unique(),
        docPayload,
        [
          Permission.read(Role.team(teamId)),
          Permission.write(Role.team(teamId)),
          Permission.update(Role.team(teamId)),
          Permission.delete(Role.team(teamId))
        ]
      );

      router.replace("/statistiques");
      router.refresh();

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof AppwriteException) {
        setError(`Erreur: ${err.message}`);
      } else {
        setError("Une erreur est survenue lors de la configuration. Contactez l'assistance.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-indigo-600 shadow-md">
            <ShieldCheck className="size-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Configuration de l'entreprise</CardTitle>
          <CardDescription className="text-base text-slate-500">
            Complétez ces informations pour activer votre compte Structura. <br/>
            Ces mentions légales apparaîtront sur vos factures.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-8 p-6 sm:p-8">
            
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                {error}
              </div>
            )}

            {/* General Info */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                <Building className="size-4 text-indigo-500" /> Informations Générales
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise <span className="text-red-500">*</span></Label>
                  <Input id="companyName" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Ex: Structura SARL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email professionnel <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" className="pl-9" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="contact@entreprise.ma" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone <span className="text-red-500">*</span></Label>
                  <Input id="telephone" required value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} placeholder="05 22 00 00 00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value ?? "Casablanca"})}>
                     <SelectTrigger id="city">
                        <SelectValue placeholder="Sélectionnez une ville" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="Casablanca">Casablanca</SelectItem>
                        <SelectItem value="Rabat">Rabat</SelectItem>
                        <SelectItem value="Marrakech">Marrakech</SelectItem>
                        <SelectItem value="Tanger">Tanger</SelectItem>
                        <SelectItem value="Fès">Fès</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Adresse de l'entreprise <span className="text-red-500">*</span></Label>
                  <Input id="address" required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Bd Mohammed V" />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Legal Identifiers */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                <ShieldCheck className="size-4 text-indigo-500" /> Identifiants Légaux Marocains
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ice">ICE (Identifiant Commun de l'Entreprise) <span className="text-red-500">*</span></Label>
                  <Input id="ice" required minLength={15} maxLength={15} value={formData.ice} onChange={e => setFormData({...formData, ice: e.target.value})} placeholder="15 chiffres" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc">RC (Registre de Commerce) <span className="text-red-500">*</span></Label>
                  <Input id="rc" required value={formData.rc} onChange={e => setFormData({...formData, rc: e.target.value})} placeholder="Numéro RC" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifValue">IF (Identifiant Fiscal) <span className="text-red-500">*</span></Label>
                  <Input id="ifValue" required value={formData.ifValue} onChange={e => setFormData({...formData, ifValue: e.target.value})} placeholder="Numéro IF" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patente">Patente (Taxe Professionnelle) <span className="text-red-500">*</span></Label>
                  <Input id="patente" required value={formData.patente} onChange={e => setFormData({...formData, patente: e.target.value})} placeholder="Numéro Patente" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cnss">CNSS <span className="text-red-500">*</span></Label>
                  <Input id="cnss" required value={formData.cnss} onChange={e => setFormData({...formData, cnss: e.target.value})} placeholder="Numéro d'affiliation CNSS" />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* Logo Upload */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-slate-800">
                <Upload className="size-4 text-indigo-500" /> Logo de l'entreprise
              </h3>
              <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition-colors hover:bg-slate-50">
                <div className="flex flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
                  <Upload className="size-6 text-slate-400" />
                  {logoFile ? (
                    <span className="font-medium text-slate-900">{logoFile.name} (Prêt à uploader)</span>
                  ) : (
                    <>
                      <span className="font-medium text-slate-900">Cliquez ou glissez un fichier</span>
                      <span className="text-xs">PNG, JPG jusqu'à 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-slate-50 p-6 sm:p-8 rounded-b-xl border-t border-slate-100">
            <Button type="submit" className="w-full h-12 text-base font-semibold bg-[#2563EB] hover:bg-indigo-600" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Finalisation du compte...
                </>
              ) : (
                "Accéder au Dashboard"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
