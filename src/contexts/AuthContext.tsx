"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { account } from "@/lib/appwrite";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  authState: "checking" | "authed" | "guest";
  userId: string;
  displayName: string;
  email: string;
  initials: string;
  handleLogout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [authState, setAuthState] = React.useState<"checking" | "authed" | "guest">("checking");
  const [userId, setUserId] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [initials, setInitials] = React.useState("");

  const hasChecked = React.useRef(false);

  React.useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (hasChecked.current) {
         // If we've already done the network check, don't redo it.
         // Just handle route guarding for guest users.
         if (authState === "guest" && !pathname?.startsWith("/login") && !pathname?.startsWith("/register")) {
           const nextPath = pathname || "/statistiques";
           window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
         }
         return;
      }
      
      try {
        const user = await account.get();
        if (!isMounted) return;
        
        hasChecked.current = true;

        // Extract user info
        const prefs =
          typeof user.prefs === "object" && user.prefs !== null
            ? (user.prefs as Record<string, unknown>)
            : {};
        const prefNameCandidate = [
          prefs.name,
          prefs.fullName,
          prefs.displayName,
        ].find((value) => typeof value === "string" && value.trim().length > 0) as string | undefined;

        const resolvedEmail = user.email || "Utilisateur";
        const resolvedName =
          prefNameCandidate?.trim() || user.name?.trim() || resolvedEmail || "Utilisateur";

        const resolvedInitials =
          resolvedName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "AD";

        setUserId(user.$id);
        setDisplayName(resolvedName);
        setEmail(resolvedEmail);
        setInitials(resolvedInitials);

        // Pillar 2: The Onboarding Flow Wall
        try {
           const { databaseId, companyCollectionId } = await import("@/lib/appwrite").then(m => m.APPWRITE_CONFIG);
           const { databases } = await import("@/lib/appwrite");
           const { Query } = await import("appwrite");
           const companyDocs = await databases.listDocuments(databaseId, companyCollectionId, [Query.limit(1)]);
           
           if (companyDocs.total === 0) {
             setAuthState("guest");
             window.location.href = "/onboarding";
             return;
           }
        } catch (e) {
             console.error("Error checking company docs: ", e);
        }

        setAuthState("authed");
      } catch (error) {
        if (!isMounted) return;
        
        hasChecked.current = true;
        setAuthState("guest");
        
        // Prevent infinite loop if we are already on a public route
        if (!pathname?.startsWith("/login") && !pathname?.startsWith("/register")) {
          const nextPath = pathname || "/statistiques";
          window.location.href = `/login?next=${encodeURIComponent(nextPath)}`;
        }
      }
    }

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [pathname, authState]);

  const { toast } = useToast();

  async function handleLogout() {
    try {
      await account.deleteSession("current");
    } catch {
      // skip on error if no session
    }
    // Delete the proxy bypass cookie
    document.cookie = "structura_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    setAuthState("guest");
    
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt sur Structura.",
    });
    
    router.replace("/login");
  }

  // Render blocking state
  if (authState === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          Vérification de la session...
        </div>
      </div>
    );
  }

  const isPublicRoute = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  // If a user is not authenticated and trying to view a protected route, render null while redirecting
  if (authState === "guest" && !isPublicRoute) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        authState,
        userId,
        displayName,
        email,
        initials,
        handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
