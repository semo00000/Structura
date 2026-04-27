"use server";

// Server Actions for Company settings
// These will persist to the database.
// For now, actions return success responses to enable client-side state updates.

import { companyGeneralSchema, companyLegalSchema, companyBrandSchema, documentSettingsSchema } from "@/lib/validations/company";

export async function updateCompanyGeneral(formData: unknown) {
  const parsed = companyGeneralSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  // TODO: Persist to database

  return { success: true, data: parsed.data };
}

export async function updateCompanyLegal(formData: unknown) {
  const parsed = companyLegalSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  return { success: true, data: parsed.data };
}

export async function updateCompanyBranding(formData: unknown) {
  const parsed = companyBrandSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  return { success: true, data: parsed.data };
}

export async function updateDocumentSettings(formData: unknown) {
  const parsed = documentSettingsSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors };
  }

  return { success: true, data: parsed.data };
}
