import { z } from "zod";

export const companyGeneralSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
});

export const companyLegalSchema = z.object({
  ice: z
    .string()
    .regex(/^\d{15}$/, "L'ICE doit contenir exactement 15 chiffres")
    .optional()
    .or(z.literal("")),
  rc: z.string().optional(),
  taxId: z.string().optional(),
  patente: z.string().optional(),
  cnss: z.string().optional(),
});

export const companyBrandSchema = z.object({
  logoUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Code couleur hex invalide"),
  defaultFooter: z.string().optional(),
});

export const documentSettingsSchema = z.object({
  showReference: z.boolean(),
  showTvaColumn: z.boolean(),
  showDiscount: z.boolean(),
  showUnitPrice: z.boolean(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Code couleur hex invalide"),
  footerText: z.string().optional(),
  paperSize: z.enum(["A4", "Letter"]),
});

export type CompanyGeneralValues = z.infer<typeof companyGeneralSchema>;
export type CompanyLegalValues = z.infer<typeof companyLegalSchema>;
export type CompanyBrandValues = z.infer<typeof companyBrandSchema>;
export type DocumentSettingsValues = z.infer<typeof documentSettingsSchema>;
