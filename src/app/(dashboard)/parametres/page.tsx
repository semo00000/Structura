"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, UserCog, Building2, FileText, Settings2, Moon, Sun, Monitor, Lock, Users } from "lucide-react";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { usePlan } from "@/contexts/PlanContext";
import { TeamManagement } from "@/components/settings/TeamManagement";

export default function ParametresPage() {
  const { email, displayName } = useAuth();
  const { state: companyState, dispatch } = useCompany();
  const { company } = companyState;
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { subscriptionTier } = usePlan();

  const [legalData, setLegalData] = useState({
    name: company.name,
    address: company.address,
    city: company.city,
    ice: company.ice,
    rc: company.rc,
    taxId: company.taxId,
    cnss: company.cnss || "",
    patente: company.patente || "",
    slogan: company.slogan || "",
    bank: company.bank || "",
    rib: company.rib || "",
    vatPct: company.vatPct || 20,
  });

  const handleLegalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLegalData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSaveLegal = () => {
    dispatch({
      type: "UPDATE_GENERAL",
      payload: {
        name: legalData.name,
        address: legalData.address,
        city: legalData.city,
      }
    });
    dispatch({
      type: "UPDATE_LEGAL",
      payload: {
        ice: legalData.ice,
        rc: legalData.rc,
        taxId: legalData.taxId,
        cnss: legalData.cnss,
        patente: legalData.patente,
      }
    });
    dispatch({
      type: "UPDATE_FINANCIAL",
      payload: {
        vatPct: Number(legalData.vatPct),
        slogan: legalData.slogan,
        bank: legalData.bank,
        rib: legalData.rib,
      }
    });
    toast({
      title: "Paramètres mis à jour",
      description: "Les informations de l'entreprise ont été enregistrées avec succès.",
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Paramètres du compte</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Gérez vos informations de profil, préférences et données d'entreprise.
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="general" className="gap-2"><UserCog className="size-4"/> Général</TabsTrigger>
          <TabsTrigger value="entreprise" className="gap-2"><Building2 className="size-4"/> Entreprise</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2"><FileText className="size-4"/> Documents</TabsTrigger>
          <TabsTrigger value="gouvernance" className="gap-2"><ShieldCheck className="size-4"/> Gouvernance</TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2"><Settings2 className="size-4"/> Préférences</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Les données de base liées à votre identité sur Structura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nom d'affichage</Label>
                <Input id="displayName" value={displayName} disabled />
                <p className="text-[11px] text-muted-foreground">Votre nom tel qu'il apparaît sur la plateforme.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email principale</Label>
                <Input id="email" type="email" value={email} disabled />
                <p className="text-[11px] text-muted-foreground">Cet email est verrouillé. Contactez le support pour le modifier.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entreprise" className="space-y-6">
          <SubscriptionGate tier="Enterprise">
            <Card>
              <CardHeader>
                <CardTitle>Profil de l'entreprise</CardTitle>
                <CardDescription>
                  Ces informations apparaîtront sur vos factures et devis.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Raison sociale</Label>
                  <Input id="name" value={legalData.name} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" value={legalData.city} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" value={legalData.address} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="slogan">Slogan (Tagline)</Label>
                  <Input id="slogan" value={legalData.slogan} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ice">ICE (Identifiant Commun de l'Entreprise)</Label>
                  <Input id="ice" value={legalData.ice} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc">RC (Registre de Commerce)</Label>
                  <Input id="rc" value={legalData.rc} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taxId">Identifiant Fiscal (IF)</Label>
                  <Input id="taxId" value={legalData.taxId} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnss">CNSS</Label>
                  <Input id="cnss" value={legalData.cnss} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patente">Patente</Label>
                  <Input id="patente" value={legalData.patente} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank">Banque</Label>
                  <Input id="bank" value={legalData.bank} onChange={handleLegalChange} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="rib">RIB (Relevé d'Identité Bancaire)</Label>
                  <Input id="rib" value={legalData.rib} onChange={handleLegalChange} />
                </div>
              </CardContent>
              <CardFooter className="border-t border-border bg-muted/20 px-6 py-4">
                <Button onClick={handleSaveLegal} className="font-bold tracking-wide uppercase">
                  Enregistrer les modifications
                </Button>
              </CardFooter>
            </Card>
          </SubscriptionGate>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <SubscriptionGate tier="Enterprise">
            <Card>
              <CardHeader>
                <CardTitle>Configuration des Documents</CardTitle>
                <CardDescription>
                  Ajustez l'apparence par défaut de vos documents PDF.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <Label htmlFor="vatPct">Taux de TVA par défaut (%)</Label>
                  <Input 
                    id="vatPct" 
                    type="number"
                    value={legalData.vatPct} 
                    onChange={handleLegalChange} 
                  />
                </div>

                <div className="space-y-4 rounded-md border border-border p-4 bg-muted/20">
                  <h4 className="text-sm font-semibold">Options d'affichage PDF</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Référence du document</Label>
                      <p className="text-[11px] text-muted-foreground">Afficher le numéro de référence.</p>
                    </div>
                    <Switch 
                      checked={company.documentSettings.showReference} 
                      onCheckedChange={(c) => dispatch({ type: "UPDATE_DOCUMENT_SETTINGS", payload: { showReference: c }})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Colonne TVA</Label>
                      <p className="text-[11px] text-muted-foreground">Afficher le détail de la TVA par ligne.</p>
                    </div>
                    <Switch 
                      checked={company.documentSettings.showTvaColumn} 
                      onCheckedChange={(c) => dispatch({ type: "UPDATE_DOCUMENT_SETTINGS", payload: { showTvaColumn: c }})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Prix Unitaire</Label>
                      <p className="text-[11px] text-muted-foreground">Afficher la colonne prix unitaire.</p>
                    </div>
                    <Switch 
                      checked={company.documentSettings.showUnitPrice} 
                      onCheckedChange={(c) => dispatch({ type: "UPDATE_DOCUMENT_SETTINGS", payload: { showUnitPrice: c }})} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Afficher les remises</Label>
                      <p className="text-[11px] text-muted-foreground">Afficher la colonne remise si applicable.</p>
                    </div>
                    <Switch 
                      checked={company.documentSettings.showDiscount} 
                      onCheckedChange={(c) => dispatch({ type: "UPDATE_DOCUMENT_SETTINGS", payload: { showDiscount: c }})} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paperSize">Format de page PDF</Label>
                  <Select 
                    defaultValue={company.documentSettings.paperSize} 
                    onValueChange={(val: "A4" | "Letter" | null) => { if (val) dispatch({ type: "UPDATE_DOCUMENT_SETTINGS", payload: { paperSize: val }}); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (Standard International)</SelectItem>
                      <SelectItem value="Letter">US Letter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerText">Mention légale au pied de page</Label>
                  <Input 
                    id="footerText" 
                    defaultValue={company.documentSettings.footerText}
                    onChange={(e) => dispatch({ type: "UPDATE_DOCUMENT_SETTINGS", payload: { footerText: e.target.value }})}
                  />
                </div>
              </CardContent>
            </Card>
          </SubscriptionGate>
        </TabsContent>

        <TabsContent value="gouvernance" className="space-y-6">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Apparence et Thème</CardTitle>
              <CardDescription>
                Personnalisez l'apparence de la plateforme Structura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-xl">
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center justify-center gap-2 border rounded-xl p-4 transition-all hover:bg-accent ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <Sun className="size-6" />
                  <span className="text-sm font-semibold">Clair</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center justify-center gap-2 border rounded-xl p-4 transition-all hover:bg-accent ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <Moon className="size-6" />
                  <span className="text-sm font-semibold">Sombre</span>
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`flex flex-col items-center justify-center gap-2 border rounded-xl p-4 transition-all hover:bg-accent ${theme === 'system' ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <Monitor className="size-6" />
                  <span className="text-sm font-semibold">Système</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
