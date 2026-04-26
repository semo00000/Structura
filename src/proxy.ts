import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Using the project ID from env
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

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

export function proxy(request: NextRequest) {
  if (!projectId) {
    console.error("Error: NEXT_PUBLIC_APPWRITE_PROJECT_ID is missing.");
    // Fail securely: if we don't have the project ID, we cannot verify sessions.
    // Redirect to an error page or return a 500 error.
    return new NextResponse("Server Configuration Error", { status: 500 });
  }

  const { pathname } = request.nextUrl;
  
  // 1. Check if the current path is protected
  const isProtected = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // 2. Detection of Appwrite session via cookies (Standard & Legacy) + Custom Structura Fallback
  const sessionCookie = request.cookies.get(`a_session_${projectId}`)?.value || 
                        request.cookies.get(`a_session_${projectId}_legacy`)?.value ||
                        request.cookies.get(`structura_session`)?.value;

  // 3. Redirect to login if no session is present for protected routes
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Session exists, allow through
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
