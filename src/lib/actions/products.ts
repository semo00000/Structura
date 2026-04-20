"use server";

// Server Actions for Products & Services
// These will persist to PostgreSQL via Prisma when the DB is connected.

import { productSchema } from "@/lib/validations/product";

export async function createProduct(formData: unknown) {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // TODO: Persist to database
  // const product = await prisma.product.create({ data: parsed.data });

  return { success: true, data: { id: `p${Date.now()}`, ...parsed.data } };
}

export async function updateProduct(id: string, formData: unknown) {
  const parsed = productSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // TODO: Persist to database
  // const product = await prisma.product.update({ where: { id }, data: parsed.data });

  return { success: true, data: { id, ...parsed.data } };
}

export async function deleteProduct(id: string) {
  // TODO: Delete from database
  // await prisma.product.delete({ where: { id } });

  return { success: true, deletedId: id };
}

export async function getProducts() {
  // TODO: Fetch from database
  // const products = await prisma.product.findMany({
  //   orderBy: { createdAt: "desc" },
  // });

  return { success: true, data: [] };
}
