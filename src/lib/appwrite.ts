"use client";

import { Account, Client, Databases, Teams, Storage } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const companyCollectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_COLLECTION_ID;
const documentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID;
const contactsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_CONTACTS_COLLECTION_ID;
const productsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID;
const logosBucketId = process.env.NEXT_PUBLIC_APPWRITE_LOGOS_BUCKET_ID;
const receiptsBucketId = process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_BUCKET_ID;
const paymentsCollectionId = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID;
const paymentsAuditCollectionId = process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_AUDIT_COLLECTION_ID;

// Validate all configuration
const config = {
  NEXT_PUBLIC_APPWRITE_ENDPOINT: endpoint,
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: projectId,
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: databaseId,
  NEXT_PUBLIC_APPWRITE_COMPANY_COLLECTION_ID: companyCollectionId,
  NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID: documentsCollectionId,
  NEXT_PUBLIC_APPWRITE_CONTACTS_COLLECTION_ID: contactsCollectionId,
  NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID: productsCollectionId,
  NEXT_PUBLIC_APPWRITE_LOGOS_BUCKET_ID: logosBucketId,
  NEXT_PUBLIC_APPWRITE_RECEIPTS_BUCKET_ID: receiptsBucketId,
  NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID: paymentsCollectionId,
  NEXT_PUBLIC_APPWRITE_PAYMENTS_AUDIT_COLLECTION_ID: paymentsAuditCollectionId,
};

Object.entries(config).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required Appwrite configuration: ${key}`);
  }
});

const client = new Client();

if (endpoint) {
  client.setEndpoint(endpoint);
}

if (projectId) {
  client.setProject(projectId);
}

const account = new Account(client);
const databases = new Databases(client);
const teams = new Teams(client);
const storage = new Storage(client);

const APPWRITE_CONFIG = {
  endpoint: endpoint!,
  projectId: projectId!,
  databaseId: databaseId!,
  companyCollectionId: companyCollectionId!,
  documentsCollectionId: documentsCollectionId!,
  contactsCollectionId: contactsCollectionId!,
  productsCollectionId: productsCollectionId!,
  logosBucketId: logosBucketId!,
  receiptsBucketId: receiptsBucketId!,
  paymentsCollectionId: paymentsCollectionId!,
  paymentsAuditCollectionId: paymentsAuditCollectionId!,
};

export { client, account, databases, teams, storage, APPWRITE_CONFIG };
