import { z } from "zod";

export const contactSchema = z.object({
  type: z.enum(["CLIENT", "FOURNISSEUR"]),
  category: z.enum(["INDIVIDUAL", "COMPANY"]),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  companyName: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  ice: z
    .string()
    .regex(/^\d{15}$/, "L'ICE doit contenir exactement 15 chiffres")
    .optional()
    .or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

