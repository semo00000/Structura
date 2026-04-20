"use client";

import { Account, Client, Databases, Teams, Storage } from "appwrite";

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
const projectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69e3ae46001bba40769f";
const databaseId =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "69e3b4e40016f9a896bb";
const companyCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_COMPANY_COLLECTION_ID ?? "companysettings";
const documentsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID ?? "documents";
const contactsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_CONTACTS_COLLECTION_ID ?? "contacts";
const productsCollectionId =
  process.env.NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID ?? "products";
const logosBucketId =
  process.env.NEXT_PUBLIC_APPWRITE_LOGOS_BUCKET_ID ?? "logos";
const receiptsBucketId =
  process.env.NEXT_PUBLIC_APPWRITE_RECEIPTS_BUCKET_ID ?? "payment_receipts";

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
  endpoint,
  projectId,
  databaseId,
  companyCollectionId,
  documentsCollectionId,
  contactsCollectionId,
  productsCollectionId,
  logosBucketId,
  receiptsBucketId,
};

export { client, account, databases, teams, storage, APPWRITE_CONFIG };