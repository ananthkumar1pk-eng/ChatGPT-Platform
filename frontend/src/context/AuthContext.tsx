"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, TokenResponse } from "@/types/auth";
import { ApiClient } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("chatgpt_access_token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const profile = await ApiClient.get<User>("/api/auth/me");
        setUser(profile);
      } catch (err) {
        localStorage.removeItem("chatgpt_access_token");
        localStorage.removeItem("chatgpt_refresh_token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  const handleAuthSuccess = (res: TokenResponse) => {
    localStorage.setItem("chatgpt_access_token", res.access_token);
    localStorage.setItem("chatgpt_refresh_token", res.refresh_token);
    setUser(res.user);
    router.push("/");
  };

  const login = async (email: string, password: string) => {
    const res = await ApiClient.post<TokenResponse>("/api/auth/login", { email, password });
    handleAuthSuccess(res);
  };

  const register = async (email: string, password: string, fullName?: string) => {
    const res = await ApiClient.post<TokenResponse>("/api/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    handleAuthSuccess(res);
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await ApiClient.post<TokenResponse>("/api/auth/google", { credential });
    handleAuthSuccess(res);
  };

  const logout = () => {
    localStorage.removeItem("chatgpt_access_token");
    localStorage.removeItem("chatgpt_refresh_token");
    setUser(null);
    router.push("/login");
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
