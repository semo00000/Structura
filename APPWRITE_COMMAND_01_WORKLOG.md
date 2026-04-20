# Structura - Command 01 Worklog

Date: 2026-04-18

## Objective Completed

Initialize the Appwrite SDK foundation and build the Parametres UI so company/legal identifiers can be saved to Appwrite instead of hardcoded placeholders.

## Work Done

1. Installed Appwrite SDK
- Added dependency `appwrite` to the project.
- Files affected by install:
  - `package.json`
  - `package-lock.json`

2. Created Appwrite connection utility
- Added `src/lib/appwrite.ts`.
- Implemented and exported:
  - `client` (`Client`)
  - `account` (`Account`)
  - `databases` (`Databases`)
  - `APPWRITE_CONFIG` object
- Config uses environment variables:
  - `NEXT_PUBLIC_APPWRITE_ENDPOINT`
  - `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
  - `NEXT_PUBLIC_APPWRITE_DATABASE_ID`
  - `NEXT_PUBLIC_APPWRITE_COMPANY_COLLECTION_ID`

3. Rebuilt Parametres page as a full client-side Appwrite form
- Replaced `src/app/(dashboard)/parametres/page.tsx`.
- Built with `react-hook-form` + `zod` + `zodResolver`.
- Organized UI in shadcn `Card` sections following Corporate Slate & Trust Blue style.

## Form Fields Implemented

General Information:
- Company Name (`companyName`)
- Address (`address`)
- Telephone (`telephone`)
- Email (`email`)

Legal Identifiers:
- ICE (`ice`)
- RC (`rc`)
- IF (`ifValue`)
- Patente (`patente`)
- CNSS (`cnss`)

## Validation Rules Implemented

- `companyName`: min 2 characters
- `address`: min 5 characters
- `telephone`: min 6 characters
- `email`: valid email format
- `ice`: exactly 15 digits
- `rc`, `ifValue`, `patente`, `cnss`: min 2 characters

## Appwrite Persistence Logic Implemented

On load:
- Checks if Appwrite env config is present.
- Reads first company document from collection using `listDocuments(..., [Query.limit(1)])`.
- If found, hydrates form fields and stores document ID in state.

On submit:
- Validates form with Zod.
- If document ID exists: updates with `updateDocument`.
- If no document ID:
  - tries to find first existing document and update it, or
  - creates a new document via `createDocument(..., ID.unique(), payload)`.

UX handling:
- Loading state while fetching initial settings.
- Success/error notice banners.
- Last saved timestamp display.
- Submit button disabled when config missing, loading, or submitting.

## Design Details Applied

- Uses slate-based surfaces and borders (`slate-200`, white cards).
- Uses Trust Blue accents (`#2563EB`) on key section markers and CTA.
- Uses monospace input styling for legal identifier fields (`ICE`, `RC`, `IF`, `Patente`, `CNSS`).

## .env.local Template Provided

```env
# Appwrite Public SDK
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here

# Appwrite Database for Structura
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id_here
NEXT_PUBLIC_APPWRITE_COMPANY_COLLECTION_ID=your_company_collection_id_here
```

## Files Changed

- `package.json`
- `package-lock.json`
- `src/lib/appwrite.ts` (new)
- `src/app/(dashboard)/parametres/page.tsx` (replaced)

## Validation Status

- Checked edited TypeScript files for problems.
- No errors reported in:
  - `src/lib/appwrite.ts`
  - `src/app/(dashboard)/parametres/page.tsx`