import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/auth";
import { validateToken } from "@/services/auth.service";
import { AuthContext } from "./auth-context-definition";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();

      if (token) {
        try {
          const isValid = await validateToken(token);
          setIsAuthenticated(isValid);

          if (!isValid) {
            removeAuthToken();
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          setIsAuthenticated(false);
          removeAuthToken();
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeAuthToken();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
