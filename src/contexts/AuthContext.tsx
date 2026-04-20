"use client";

import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { account, teams } from "@/lib/appwrite";
import { Models } from "appwrite";

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  activeTeam: Models.Team<Models.Preferences> | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType {
  state: AuthState;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    activeTeam: null,
    isLoading: true,
    error: null,
  });

  const loadAuth = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const currentUser = await account.get();
      const userTeams = await teams.list();
      
      const activeTeam = userTeams.teams.length > 0 ? userTeams.teams[0] : null;

      setState({
        user: currentUser,
        activeTeam,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Auth load failed:", err);
      setState({
        user: null,
        activeTeam: null,
        isLoading: false,
        error: err instanceof Error ? err.message : "Authentication failed",
      });
    }
  };

  useEffect(() => {
    void loadAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ state, refresh: loadAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
