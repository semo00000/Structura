"use server";

// Server Actions for Products & Services
// These will persist to the database.

import { productSchema } from "@/lib/validations/product";

export async function createProduct(formData: unknown) {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  return { success: true, data: { id: `p${Date.now()}`, ...parsed.data } };
}

export async function updateProduct(id: string, formData: unknown) {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  return { success: true, data: { id, ...parsed.data } };
}

export async function deleteProduct(id: string) {
  return { success: true, deletedId: id };
}

export async function getProducts() {
  return { success: true, data: [] };
}
