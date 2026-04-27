"use server";

// Server Actions for Contacts (Clients & Fournisseurs)
// These will persist to the database.

import { contactSchema } from "@/lib/validations/contact";

export async function createContact(formData: unknown) {
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // TODO: Persist to database

  return { success: true, data: { id: `c${Date.now()}`, ...parsed.data } };
}

export async function updateContact(id: string, formData: unknown) {
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // TODO: Persist to database

  return { success: true, data: { id, ...parsed.data } };
}

export async function deleteContact(id: string) {
  // TODO: Delete from database

  return { success: true, deletedId: id };
}

export async function getContacts(type?: "CLIENT" | "FOURNISSEUR") {
  // TODO: Fetch from database

  return { success: true, data: [] };
}
