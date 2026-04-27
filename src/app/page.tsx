"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, BarChart3, Receipt, Package, ShieldCheck } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  const { t, dir } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans" dir={dir}>
      {/* Navigation */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-border/40 backdrop-blur-md fixed top-0 w-full z-50 bg-background/80">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xl font-black tracking-widest text-primary">
            STRUCTURA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              {t.nav.login}
            </Link>
            <Button size="sm" nativeButton={false} render={<Link href="/register" />}>
              {t.nav.register}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 pt-32 pb-16 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-8">
            <ShieldCheck className="w-4 h-4" />
            {t.landing.moroccanCompliance}
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
            {t.landing.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
            {t.landing.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <Button size="lg" className="w-full sm:w-auto text-base gap-2" nativeButton={false} render={<Link href="/register" />}>
              {t.landing.getStarted}
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base" nativeButton={false} render={<Link href="/login" />}>
              {t.nav.login}
            </Button>
          </div>
        </div>

        {/* Dashboard Preview Image Placeholder */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="rounded-2xl border border-border/50 bg-card shadow-2xl overflow-hidden relative aspect-video flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/20" />
             <div className="text-muted-foreground flex flex-col items-center gap-4">
                <BarChart3 className="w-16 h-16 opacity-50" />
                <p className="font-mono text-sm tracking-widest uppercase opacity-50">Structura Dashboard Interface</p>
             </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        </div>

        {/* Features Section */}
        <div className="mt-32 mb-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">{t.landing.featuresTitle}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">{t.landing.featuresSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border/50 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Receipt className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature1Title}</h3>
              <p className="text-muted-foreground">{t.landing.feature1Desc}</p>
            </div>
            <div className="bg-card border border-border/50 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature2Title}</h3>
              <p className="text-muted-foreground">{t.landing.feature2Desc}</p>
            </div>
            <div className="bg-card border border-border/50 p-6 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t.landing.feature3Title}</h3>
              <p className="text-muted-foreground">{t.landing.feature3Desc}</p>
            </div>
          </div>
        </div>

        {/* Moroccan Compliance Section */}
        <div className="bg-secondary/50 border border-border/50 rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
                <h3 className="text-2xl font-bold mb-4">{t.landing.moroccanCompliance}</h3>
                <p className="text-muted-foreground">{t.landing.moroccanComplianceDesc}</p>
            </div>
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> <span className="font-medium">ICE (15 chiffres)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> <span className="font-medium">Registre de Commerce (RC)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> <span className="font-medium">Identifiant Fiscal (IF)</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> <span className="font-medium">TVA Marocaine (20%, 14%, 10%, 7%)</span></div>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Structura. All rights reserved.</p>
      </footer>
    </div>
  );
}
