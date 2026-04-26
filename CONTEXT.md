# Structura — Full Project Context & Handoff Document
> Last updated: 2026-04-25

---

## 1. What Is Structura?

Structura is a **Moroccan-market SaaS invoicing & commercial management platform**. It allows Moroccan entrepreneurs to create invoices, quotes, purchase orders, delivery notes, and credit notes — all compliant with Moroccan fiscal requirements (ICE, TVA, MAD currency formatting).

**Tech Stack:**
- **Frontend**: Next.js 15 (App Router) + TypeScript + shadcn/ui + Tailwind CSS v4
- **Backend**: Appwrite BaaS (cloud instance, NOT self-hosted)
- **PDF Export**: jsPDF (custom generator)
- **Auth**: Appwrite Account service, wrapped in a React context
- **Repo**: `https://github.com/semo00000/Structura.git` (branch: `master`)
- **Local path**: `c:\Users\me\Desktop\test cl\Structura`

---

## 2. Appwrite Configuration

All Appwrite config lives in `src/lib/appwrite.ts`. The env vars are in `.env.local`:

```
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=<project-id>
NEXT_PUBLIC_APPWRITE_DATABASE_ID=<db-id>
NEXT_PUBLIC_APPWRITE_COMPANY_COLLECTION_ID=<collection-id>
NEXT_PUBLIC_APPWRITE_CONTACTS_COLLECTION_ID=<collection-id>
NEXT_PUBLIC_APPWRITE_PRODUCTS_COLLECTION_ID=<collection-id>
NEXT_PUBLIC_APPWRITE_DOCUMENTS_COLLECTION_ID=<collection-id>
```

### Database Collections:
| Collection | Key Fields |
|---|---|
| `company` | userId, companyName, address, city, telephone, email, ice, rc, ifValue, patente, cnss, logoUrl |
| `contacts` | userId, type (CLIENT/FOURNISSEUR), category (INDIVIDUAL/COMPANY), nameOrCompany, email, telephone, address, city, ice |
| `products` | userId, name, reference, sellingPriceHT, tvaRate, unit, stock, type (PRODUCT/SERVICE) |
| `documents` | userId, type (FACTURE/DEVIS/BON_COMMANDE/BON_LIVRAISON/AVOIR), number, status, contactId, date, dueDate, totalHT, totalTVA, totalTTC, totalPaid, linesJson, notes, footer |

---

## 3. Codebase Architecture

```
src/
├── app/
│   ├── (auth)/                    ← Public auth pages
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               ← Protected routes (14 pages)
│   │   ├── layout.tsx             # Shell: Sidebar + Header + auth guard
│   │   ├── dashboard/page.tsx     # Main stats overview
│   │   ├── factures/page.tsx      # Invoice list + creation
│   │   ├── devis/page.tsx         # Quotes
│   │   ├── bons-commande/page.tsx # Purchase orders
│   │   ├── bons-livraison/page.tsx# Delivery notes
│   │   ├── avoirs/page.tsx        # Credit notes
│   │   ├── clients/page.tsx       # Client management
│   │   ├── fournisseurs/page.tsx  # Supplier management
│   │   ├── produits/page.tsx      # Product catalog
│   │   ├── stock/page.tsx         # Inventory tracking
│   │   ├── suivi-paiements/page.tsx # Payment follow-up
│   │   ├── statistiques/page.tsx  # Business analytics
│   │   ├── abonnement/page.tsx    # Subscription plan management
│   │   └── parametres/page.tsx    # Company settings/profile
│   ├── globals.css                # Design system tokens
│   ├── layout.tsx                 # Root layout (fonts, providers)
│   └── page.tsx                   # Redirects to /dashboard
│
├── components/
│   ├── AppSidebar.tsx             # Main navigation sidebar
│   ├── AppHeader.tsx              # Top header with breadcrumbs
│   ├── UpgradeModal.tsx           # Plan upgrade prompt modal
│   ├── contacts/
│   │   ├── ContactsTable.tsx      # Paginated contacts table with search/sort
│   │   ├── ContactFormModal.tsx   # Create/edit contact dialog
│   │   └── ContactModal.tsx       # Contact detail modal
│   ├── documents/
│   │   ├── DocumentEditor.tsx     # Full document creation form (THE big component)
│   │   └── ComboboxSearch.tsx     # Searchable dropdown for client/product selection
│   ├── products/
│   │   ├── ProductsTable.tsx      # Products list with stock badges
│   │   └── ProductModal.tsx       # Create/edit product form
│   ├── settings/
│   │   └── CompanyProfileForm.tsx # Company info editor
│   └── ui/                        # shadcn primitives (button, card, table, dialog, etc.)
│       ├── card.tsx
│       ├── table.tsx
│       ├── page-transition.tsx    # Fade-in animation wrapper
│       ├── table-skeleton.tsx     # Loading skeleton for tables
│       └── ... (standard shadcn components)
│
├── contexts/
│   ├── AuthContext.tsx             # Single account.get() on mount, caches userId
│   ├── PlanContext.tsx             # Subscription tier, invoice count limits
│   ├── CompanyContext.tsx          # Company profile data provider
│   └── SidebarContext.tsx          # Sidebar open/collapsed state
│
├── hooks/
│   └── use-toast.ts               # Toast notification hook
│
├── lib/
│   ├── appwrite.ts                # Appwrite Client, Account, Databases + config constants
│   ├── pdf-generator.ts           # jsPDF document generator (Moroccan-compliant)
│   ├── navigation.ts              # Route definitions and nav items
│   ├── utils.ts                   # cn() Tailwind merge helper
│   ├── prisma.ts                  # STALE/UNUSED — leftover, can be deleted
│   └── validations/
│       ├── document.ts            # Zod schema for document forms
│       ├── contact.ts             # Zod schema for contacts
│       └── product.ts             # Zod schema for products
│
└── proxy.ts                       # Appwrite session cookie proxy for SSR
```

---

## 4. Key Technical Patterns

### Authentication Flow
- `AuthContext.tsx` calls `account.get()` ONCE on mount and caches `userId` + `user` object.
- ALL components use `const { userId } = useAuth()` — never call `account.get()` directly.
- Login/Register pages live in `(auth)/` group and DO use `account.get()` for session checks (this is correct).
- The dashboard `layout.tsx` wraps children in `<AuthContext>` → `<PlanContext>` → `<CompanyContext>` → `<SidebarProvider>`.

### Data Fetching Pattern (every dashboard page follows this):
```tsx
const { userId } = useAuth();

const loadData = useCallback(async () => {
  if (!userId) return;
  const response = await databases.listDocuments(
    APPWRITE_CONFIG.databaseId,
    APPWRITE_CONFIG.someCollectionId,
    [Query.equal("userId", userId), Query.limit(100)]
  );
  setData(response.documents);
}, [userId]);

useEffect(() => { loadData(); }, [loadData]);
```

### Document Editor Flow
- `DocumentEditor.tsx` is the universal form for ALL 5 document types.
- It receives a `type` prop (FACTURE | DEVIS | BON_COMMANDE | BON_LIVRAISON | AVOIR).
- Uses react-hook-form + zod + useFieldArray for dynamic line items.
- Client/product selection uses the `ComboboxSearch` component.
- On submit: creates document in Appwrite, then shows a success screen with PDF download.

### Plan Gating
- `PlanContext.tsx` tracks the user's subscription tier.
- `checkInvoiceLimit()` blocks invoice creation if free-tier limit is reached.
- `UpgradeModal.tsx` appears when limits are hit.

---

## 5. Current Design System (globals.css)

The app uses a "Corporate Slate & Trust Blue" theme defined via CSS custom properties in `globals.css`:
- **Background**: Off-white slate (`oklch(0.975 0.005 260)`)
- **Cards**: Pure white
- **Primary**: Trust Blue / blue-600 (`oklch(0.546 0.197 262)`)
- **Sidebar**: Deep slate/navy (`oklch(0.18 0.015 260)`)
- **Borders**: slate-200 (`oklch(0.90 0.005 260)`)
- **Border radius**: `0.5rem` base
- Dark mode is fully defined but not the primary focus.

---

## 6. What Has Been Completed

### Performance Optimization (DONE ✅)
- Eliminated ALL redundant `account.get()` calls from every dashboard page and component.
- Refactored files: suivi-paiements, stock, fournisseurs, avoirs, abonnement, ContactsTable, ContactFormModal, ProductsTable, DocumentEditor.
- Navigation is now near-instant (no blocking network calls on route change).

### Core Features (DONE ✅)
- Full CRUD for Contacts (clients + suppliers)
- Full CRUD for Products with stock tracking
- Document creation for all 5 types with line items, TVA calc, and PDF export
- Company profile settings
- Payment tracking page
- Statistics/analytics dashboard
- Subscription/plan management
- Auth flow (login, register, logout with toast feedback)
- Skeleton loaders for tables
- Page transitions (fade-in animations)

### Code Pushed to GitHub ✅
- All changes committed and pushed to `https://github.com/semo00000/Structura.git` (master branch)
- Last commit: `feat: performance optimization, auth refactoring, and UI polish`

---

## 7. What Needs To Be Done Next

### PRIORITY 1: Complete UI Overhaul — Stripe Dashboard Clone
The user explicitly requested a full design system overhaul to clone the Stripe dashboard aesthetic. This is the #1 pending task. The plan:

1. **Color Palette**: Replace current Corporate Slate with Stripe's exact colors:
   - Background: `#F6F9FC`
   - Surface/Card: `#FFFFFF`
   - Primary/Accent: `#635BFF` (Stripe Blurple)
   - Text Primary: `#0A2540`
   - Text Secondary: `#425466`
   - Border: `#E3E8EE`

2. **Borders & Shadows**: Stripe uses:
   - `border-radius: 8px` on cards, `4px` on controls
   - Multi-layered shadows: `0 50px 100px -20px rgba(50,50,93,0.25), 0 30px 60px -30px rgba(0,0,0,0.3)`
   - Very crisp, thin borders

3. **Tables**: Stripe-style high-density data tables:
   - Tight padding, sticky headers
   - Subtle row hover states
   - Uppercase tracked-out header labels
   - Font-mono for numbers/amounts

4. **Sidebar & Navigation**: Clean, minimal, Stripe-like sidebar with subtle active states

5. **Components**: Update all shadcn primitives (card, dialog, button, input, table) to match

### PRIORITY 2: Deployment to Vercel
- The user wants to stop running locally and deploy to production.
- Needs `NEXT_PUBLIC_APPWRITE_*` env vars configured in Vercel.
- The `proxy.ts` handles Appwrite session cookies for SSR.

### PRIORITY 3: Cleanup
- Delete stale `src/lib/prisma.ts` (unused)
- Final end-to-end test of registration → onboarding → document creation flow

---

## 8. Known Issues
- Appwrite cloud latency is noticeable (3-5 seconds for initial data loads) — this is Appwrite's cold-start, not a code issue. The auth caching we implemented mitigates subsequent navigation.
- `prisma.ts` exists but is unused — safe to delete.
- The logout flow previously had a redirect loop bug — this was fixed by adding proper cookie cleanup and toast feedback.

---

## 9. How To Run Locally

```bash
cd "c:\Users\me\Desktop\test cl\Structura"
npm install
npm run dev
# Opens on http://localhost:3000
```

For production build:
```bash
npm run build
npm start
```
