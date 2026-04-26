# Design System: Structura Commercial Ecosystem

## 1. Visual Theme & Atmosphere
**"Monolithic Precision"** - A highly sophisticated, high-density B2B interface that feels like a professional trading terminal meets modern fintech. It avoids the soft, overly-rounded "generic SaaS" look. Instead, it uses sharp, structural borders, subtle depths, and a highly controlled monochromatic base with striking, deliberate accent colors. It feels dense but breathable, utilitarian but premium.

## 2. Color Palette & Roles
*   **Base Background:** "Arctic Paper" (`#FDFDFD`) - Almost pure white, but slightly matte to reduce eye strain.
*   **Surface:** "Frosted Titanium" (`#F3F5F7`) - Used for cards, sidebars, and input backgrounds to separate them from the base.
*   **Primary Accent:** "Electric Indigo" (`#4338CA`) - Used for primary actions, active states, and core branding. Deep, professional, yet vibrant.
*   **Secondary Accent (Success):** "Mint Obsidian" (`#059669`) - Used for 'Paid', 'Delivered' statuses. A sharp, non-toxic green.
*   **Secondary Accent (Warning):** "Burnt Amber" (`#D97706`) - Used for 'Pending', 'Draft' statuses.
*   **Secondary Accent (Danger):** "Crimson Edge" (`#DC2626`) - Used for 'Cancelled', 'Overdue' or destructive actions.
*   **Text Primary:** "Carbon Fiber" (`#111827`) - Deep, readable near-black for all primary text.
*   **Text Secondary:** "Slate Dust" (`#6B7280`) - Muted gray for metadata, timestamps, and secondary labels.
*   **Borders:** "Platinum Wire" (`#E5E7EB`) - Crisp, barely-there lines to separate structural elements without clutter.

## 3. Typography Rules
*   **Font Family:** `Inter` for general UI, but heavily utilizing `JetBrains Mono` or `Roboto Mono` for all financial figures, invoice numbers, and data tables to create that "terminal" precision.
*   **Headers:** Semi-bold, tight tracking. No oversized, playful headings.
*   **Body:** Crisp, legible, optimizing for data density.

## 4. Component Stylings
*   **Buttons:** Sharp (`rounded-md` - 6px, not pill-shaped). Primary buttons have a subtle inner shadow to look slightly tactile. No massive drop shadows.
*   **Cards/Containers:** Crisp borders (`border border-gray-200`), minimal corner roundness (`rounded-lg` - 8px). Flat design, using borders rather than shadows to define hierarchy.
*   **Inputs/Forms:** Clean, utilitarian. Gray background on focus, rather than heavy colored rings.
*   **Data Tables:** The core of the experience. Sticky headers, monospaced figures, alternating row colors (`#FDFDFD` and `#F9FAFB`), tight padding to show maximum data without feeling cluttered.
*   **Status Badges:** Small, uppercase, letter-spaced, using the exact accent colors defined above with 10% opacity backgrounds.

## 5. Layout Principles
*   **Grid:** Strict 12-column structural grid.
*   **Sidebar:** Slim, icon-heavy, collapsible to maximize screen real estate for data.
*   **Whitespace:** Deliberate. Less whitespace inside data tables (for density), but generous whitespace around structural page containers (to let the data breathe).
