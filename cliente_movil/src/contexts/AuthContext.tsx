import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getAuthToken, setAuthToken, removeAuthToken, setUserData, getUserData, removeUserData } from "../lib/auth";
import { AuthContext, type UserInfo } from "./auth-context-definition";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken();
      const storedUser = await getUserData();

      if (token && storedUser) {
        setUser(storedUser.user);
        setPermissions(storedUser.permissions || []);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (token: string, userInfo: UserInfo, userPermissions: string[] = []) => {
    await setAuthToken(token);
    await setUserData({ user: userInfo, permissions: userPermissions });
    setUser(userInfo);
    setPermissions(userPermissions);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await removeAuthToken();
    await removeUserData();
    setUser(null);
    setPermissions([]);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => permissions.includes(permission));
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => permissions.includes(permission));
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        permissions,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
