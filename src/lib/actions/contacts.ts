"use server";

// Server Actions for Contacts (Clients & Fournisseurs)
// These will persist to PostgreSQL via Prisma when the DB is connected.

import { contactSchema } from "@/lib/validations/contact";

export async function createContact(formData: unknown) {
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // TODO: Persist to database
  // const contact = await prisma.contact.create({ data: parsed.data });

  return { success: true, data: { id: `c${Date.now()}`, ...parsed.data } };
}

export async function updateContact(id: string, formData: unknown) {
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // TODO: Persist to database
  // const contact = await prisma.contact.update({ where: { id }, data: parsed.data });

  return { success: true, data: { id, ...parsed.data } };
}

export async function deleteContact(id: string) {
  // TODO: Delete from database
  // await prisma.contact.delete({ where: { id } });

  return { success: true, deletedId: id };
}

export async function getContacts(type?: "CLIENT" | "FOURNISSEUR") {
  // TODO: Fetch from database
  // const contacts = await prisma.contact.findMany({
  //   where: type ? { type } : undefined,
  //   orderBy: { createdAt: "desc" },
  // });

  return { success: true, data: [] };
}
