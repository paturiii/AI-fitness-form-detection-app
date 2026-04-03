import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setTokens, clearTokens, getToken } from "../services/api";

type User = {
  id: string;
  email: string;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await api<{ id: string; email: string }>("/auth/me");
      setUser({ id: data.id, email: data.email });
    } catch {
      await clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await api<{
      access_token: string;
      refresh_token: string;
      user: { id: string; email: string };
    }>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
  }

  async function signup(email: string, password: string) {
    const data = await api<{
      access_token: string;
      refresh_token: string;
      user: { id: string; email: string };
    }>("/auth/signup", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
    await setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // fine if it fails
    }
    await clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
