"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlan, PlanTier } from "@/contexts/PlanContext";
import { Crown, Check, Zap, Shield, Loader2, Sparkles, Building, UploadCloud, ArrowRight, CreditCard, Info } from "lucide-react";
import { account, databases, storage, APPWRITE_CONFIG } from "@/lib/appwrite";
import { ID, Query } from "appwrite";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";

export default function AbonnementPage() {
  const { planTier, limits, invoiceCountThisMonth, paymentStatus, pendingTier, refreshPlan } = usePlan();
  const router = useRouter();
  
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Calculate usage percentage
  const usagePercentage = limits.maxInvoicesPerMonth === Infinity 
    ? 0 
    : Math.min(100, Math.round((invoiceCountThisMonth / limits.maxInvoicesPerMonth) * 100));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedTier || !receiptFile) return;
    
    setIsUploading(true);

    try {
      const { databaseId, companyCollectionId, receiptsBucketId } = APPWRITE_CONFIG;
      if (!databaseId || !companyCollectionId || !receiptsBucketId) throw new Error("Missing Appwrite Config");

      // 1. Upload receipt to Appwrite Storage
      const uploadedFile = await storage.createFile(
        receiptsBucketId,
        ID.unique(),
        receiptFile
      );

      // 2. Get current user's company doc
      const user = await account.get();
      const response = await databases.listDocuments(databaseId, companyCollectionId, [
        Query.equal("userId", user.$id),
        Query.limit(1)
      ]);

      const doc = response.documents[0];
      if (!doc) throw new Error("Company settings not found");

      // 3. Update the company document as Pending
      await databases.updateDocument(databaseId, companyCollectionId, doc.$id, {
        paymentStatus: "pending",
        pendingTier: selectedTier,
        paymentReceiptId: uploadedFile.$id
      });

      setUploadSuccess(true);
      await refreshPlan();
      
      setTimeout(() => {
        setUploadSuccess(false);
        setSelectedTier(null);
        setReceiptFile(null);
      }, 3000);

    } catch (error) {
      console.error("Failed to process payment:", error);
      alert("Erreur lors de l'envoi du reçu. Veuillez réessayer.");
    } finally {
      setIsUploading(false);
    }
  };

  const isPending = paymentStatus === "pending";

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-10">
      
      {/* Current Plan Overview */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mon Abonnement</h1>
            <p className="mt-1 text-slate-500">Gérez votre plan et accédez à plus de fonctionnalités.</p>
          </div>
          
          <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {planTier === "Starter" ? <Building className="size-5" /> : planTier === "Pro" ? <Zap className="size-5" /> : <Shield className="size-5" />}
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Plan Actuel</p>
              <p className="text-lg font-bold text-slate-900">{planTier}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-8">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            Utilisation facturation mensuelle
          </h3>
          
          <div className="grid sm:grid-cols-[1fr_200px] gap-6 items-center">
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-600">{invoiceCountThisMonth} factures générées</span>
                <span className={usagePercentage > 90 ? "text-red-600" : "text-slate-900"}>
                  {limits.maxInvoicesPerMonth === Infinity ? "Illimité" : `${limits.maxInvoicesPerMonth} max`}
                </span>
              </div>
              <Progress value={usagePercentage} className={`h-2.5 ${usagePercentage > 90 ? "[&>div]:bg-red-500" : ""}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Banner */}
      {isPending && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-5 flex items-start gap-4">
          <Info className="size-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Votre paiement est en cours de vérification.</h3>
            <p className="text-amber-700 text-sm mt-1">
              Nous confirmons la réception de votre virement pour le plan <strong>{pendingTier}</strong>.
              Votre compte sera activé sous 24h. Merci de votre patience.
            </p>
          </div>
        </div>
      )}

      {/* Manual Checkout Flow (Expands when a tier is selected) */}
      {selectedTier && !isPending && (
        <div className="rounded-2xl border-2 border-blue-500 bg-white p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="size-5 text-blue-600" />
              Paiement par Virement Bancaire
            </h2>
            <Button variant="ghost" onClick={() => setSelectedTier(null)}>Annuler</Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Bank Details */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">Coordonnées Bancaires</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-medium">Banque</p>
                  <p className="font-medium text-slate-900">Attijariwafa Bank</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-medium">Titulaire du compte</p>
                  <p className="font-medium text-slate-900">Structura SARL</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-medium">RIB (Relevé d'Identité Bancaire)</p>
                  <p className="font-mono bg-white border border-slate-200 p-2 rounded-md text-sm text-slate-800 mt-1 tracking-wider">
                    048 810 0000000000000000 00
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200 mt-4">
                  <p className="text-sm text-slate-600">
                    Montant à virer: <strong>{selectedTier === "Pro" ? "3 490 MAD" : "6 990 MAD"} / an</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Upload Zone */}
            <div className="flex flex-col justify-center">
              <h3 className="font-semibold text-slate-800 mb-2">Preuve de paiement</h3>
              <p className="text-sm text-slate-600 mb-6">
                Effectuez le virement et uploadez le reçu bancaire ici pour activer votre compte {selectedTier}.
              </p>
              
              <div className="space-y-4">
                <Input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleFileChange}
                  className="cursor-pointer file:text-blue-600 file:bg-blue-50 file:border-none file:mr-4 file:px-4 file:py-1 file:rounded-full file:text-sm file:font-semibold"
                />
                
                <Button 
                  onClick={handleConfirmPayment} 
                  disabled={!receiptFile || isUploading || uploadSuccess}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUploading ? (
                    <Loader2 className="size-4 animate-spin mr-2" />
                  ) : uploadSuccess ? (
                    <Check className="size-4 mr-2" />
                  ) : (
                    <UploadCloud className="size-4 mr-2" />
                  )}
                  {uploadSuccess ? "Reçu envoyé" : "Confirmer le paiement"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modules */}
      {!selectedTier && (
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6">Plans Disponibles</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Starter Plan */}
            <div className={`relative flex flex-col rounded-2xl border ${planTier === "Starter" ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-white opacity-60"} p-6 sm:p-8`}>
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
                  0 <span className="ml-1 text-xl font-medium text-slate-500">DH</span><span className="ml-1 text-sm font-medium text-slate-500">/mois</span>
                </div>
              </div>

              <ul className="flex-1 space-y-4">
                {[
                  "Création de devis & factures",
                  "Gestion des clients basique",
                  "Jusqu'à 50 factures / mois",
                  "Filigrane structura sur les PDF",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="size-5 text-slate-300 shrink-0" />
                    <span className="text-sm text-slate-600 leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {planTier === "Starter" ? (
                  <Button variant="outline" className="w-full border-slate-300" disabled>Plan Actuel</Button>
                ) : (
                  <Button variant="outline" className="w-full text-slate-600" disabled>
                    Rétrograder
                  </Button>
                )}
              </div>
            </div>

            {/* Pro Plan */}
            <div className={`relative flex flex-col rounded-2xl border ${planTier === "Pro" ? "border-[#2563EB] shadow-xl ring-2 ring-[#2563EB]" : "border-blue-200 shadow-md"} bg-white p-6 sm:p-8`}>
              {planTier === "Pro" ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#2563EB] text-white text-xs font-bold uppercase tracking-wider rounded-full flex gap-1 items-center">
                  <Crown className="size-3" />
                  Plan Actuel
                </div>
              ) : (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-full flex gap-1 items-center">
                  <Sparkles className="size-3" />
                  Populaire
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-[#2563EB] flex items-center gap-2">
                  <Zap className="size-5" /> Pro
                </h3>
                <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
                  3 490 <span className="ml-1 text-xl font-medium text-slate-500">DH</span><span className="ml-1 text-sm font-medium text-slate-500">/an</span>
                </div>
              </div>

              <ul className="flex-1 space-y-4">
                {[
                  "Tout dans le plan Starter",
                  "Factures illimitées",
                  "Gestion de stock avancée",
                  "Suppression du filigrane PDF",
                  "Support client prioritaire",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="size-5 text-[#2563EB] shrink-0" />
                    <span className="text-sm text-slate-700 font-medium leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {planTier === "Pro" ? (
                  <Button variant="outline" className="w-full border-[#2563EB] text-[#2563EB]" disabled>Plan Actuel</Button>
                ) : (
                  <Button 
                    onClick={() => setSelectedTier("Pro")} 
                    className="w-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all"
                    disabled={isPending}
                  >
                    Sélectionner Pro
                  </Button>
                )}
              </div>
            </div>

            {/* Business Plan */}
            <div className={`relative flex flex-col rounded-2xl border ${planTier === "Business" ? "border-slate-800 shadow-xl ring-2 ring-slate-800" : "border-slate-200"} bg-slate-50 p-6 sm:p-8`}>
              {planTier === "Business" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-full">
                  Plan Actuel
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="size-5" /> Business
                </h3>
                <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
                  6 990 <span className="ml-1 text-xl font-medium text-slate-500">DH</span><span className="ml-1 text-sm font-medium text-slate-500">/an</span>
                </div>
              </div>

              <ul className="flex-1 space-y-4">
                {[
                  "Tout dans le plan Pro",
                  "Multi-utilisateurs & Rôles",
                  "Suivi d'activité avancé",
                  "Intégration API & Webhooks",
                  "Gestionnaire de compte dédié",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="size-5 text-emerald-600 shrink-0" />
                    <span className="text-sm text-slate-700 leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {planTier === "Business" ? (
                  <Button variant="outline" className="w-full border-slate-800 text-slate-800" disabled>Plan Actuel</Button>
                ) : (
                  <Button 
                    onClick={() => setSelectedTier("Business")} 
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white"
                    disabled={isPending}
                  >
                    Sélectionner Business
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
