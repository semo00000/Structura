import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Using the project ID from env or fallback
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69e3ae46001bba40769f";

// Define sequences for protected routes
const protectedPaths = [
  "/dashboard",
  "/statistiques",
  "/suivi-paiements",
  "/devis",
  "/factures",
  "/avoirs",
  "/bons-livrais",
  "/bons-commande",
  "/clients",
  "/fournisseurs",
  "/produits",
  "/stock",
  "/parametres",
  "/onboarding",
];

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Check if the current path is protected
  const isProtected = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // 2. Detection of Appwrite session via cookies (Standard & Legacy)
  const sessionCookie = request.cookies.get(`a_session_${projectId}`)?.value || 
                        request.cookies.get(`a_session_${projectId}_legacy`)?.value;

  // 3. Redirect to login if no session is present for protected routes
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Proxy the session: In a more advanced "proxy" pattern, 
  // you might verify the session here, but for performance 
  // we let it pass and let the page handle deep verification.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
