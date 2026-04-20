import { Client, Databases } from 'node-appwrite';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Configuration
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY; 
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const collectionId = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_COLLECTION_ID;

if (!apiKey) {
    console.warn("NO API KEY! We will use client-side session trick if possible, or fail.");
    process.exit(1);
}

const client = new Client();
client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);

const databases = new Databases(client);

async function createAttr(key, size = 255) {
    try {
        await databases.createStringAttribute(databaseId, collectionId, key, size, false);
        console.log(`Created attribute: ${key}`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`Attribute ${key} already exists`);
        } else {
            console.error(`Failed to create ${key}:`, e.message);
        }
    }
}

async function main() {
    console.log(`Adding attributes to Database ${databaseId}, Collection ${collectionId}...`);
    await createAttr('teamId', 64);
    await createAttr('logoUrl', 500);
    await createAttr('primaryColor', 32);
    await createAttr('defaultFooter', 1000);
    console.log("Done.");
}

main();
