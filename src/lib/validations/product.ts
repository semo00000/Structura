import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  reference: z.string().optional(),
  type: z.enum(["PRODUCT", "SERVICE"]),
  costPrice: z.number().min(0, "Le prix doit être positif"),
  sellingPriceHT: z.number().min(0, "Le prix doit être positif"),
  tvaRate: z.number().min(0).max(1),
  stockQuantity: z.number().int().min(0, "Le stock doit être positif"),
  unit: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

