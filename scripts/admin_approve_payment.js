const { Client, Databases } = require('node-appwrite');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY || process.env.APPWRITE_ADMIN_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COMPANY_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_COLLECTION_ID;

async function approvePayment(companyDocId) {
    if (!companyDocId) {
        console.error("Usage: node admin_approve_payment.js <company_document_id>");
        process.exit(1);
    }

    try {
        console.log(`Approving payment for company document: ${companyDocId}`);
        
        // 1. Fetch the document
        const doc = await databases.getDocument(
            DATABASE_ID,
            COMPANY_COLLECTION_ID,
            companyDocId
        );

        console.log(`Found company: ${doc.businessName} (Current Tier: ${doc.planTier})`);
        
        if (doc.paymentStatus !== 'pending') {
            console.log(`WARNING: Payment status is '${doc.paymentStatus}', not 'pending'. Proceeding anyway...`);
        }

        const newTier = doc.pendingTier || 'Pro'; // Default to Pro if not set, though it should be

        // 2. Update the document
        console.log(`Flipping tier to: ${newTier}`);
        const updatedDoc = await databases.updateDocument(
            DATABASE_ID,
            COMPANY_COLLECTION_ID,
            companyDocId,
            {
                planTier: newTier,
                paymentStatus: 'approved',
                pendingTier: null // Clear the pending tier
            }
        );

        console.log('✅ Payment approved successfully!');
        console.log(`Business '${updatedDoc.businessName}' is now on the ${updatedDoc.planTier} plan.`);

    } catch (error) {
        console.error("❌ Failed to approve payment:", error.message);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
approvePayment(args[0]);
