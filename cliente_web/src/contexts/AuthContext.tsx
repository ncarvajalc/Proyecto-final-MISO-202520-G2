import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getAuthToken, setAuthToken, removeAuthToken, setUserData, getUserData, removeUserData } from "@/lib/auth";
import { validateToken, getCurrentUser } from "@/services/auth.service";
import { AuthContext, type UserInfo } from "./auth-context-definition";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAuthToken();
      const storedUser = getUserData();

      if (token) {
        try {
          const isValid = await validateToken(token);
          
          if (isValid) {
            // Token is valid, try to get user profile
            try {
              const profile = await getCurrentUser(token);
              setUser({
                id: profile.id,
                email: profile.email,
                name: profile.username,
                profileName: profile.profile_name,
              });
              setPermissions(profile.permissions || []);
              setIsAuthenticated(true);
            } catch (profileError) {
              // If we can't get profile but token is valid, use stored data
              if (storedUser) {
                setUser(storedUser.user);
                setPermissions(storedUser.permissions || []);
                setIsAuthenticated(true);
              } else {
                // No stored data, logout
                removeAuthToken();
                removeUserData();
                setIsAuthenticated(false);
              }
            }
          } else {
            // Token invalid, cleanup
            removeAuthToken();
            removeUserData();
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Token validation failed:", error);
          setIsAuthenticated(false);
          removeAuthToken();
          removeUserData();
        }
      } else {
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, userInfo: UserInfo, userPermissions: string[] = []) => {
    setAuthToken(token);
    setUserData({ user: userInfo, permissions: userPermissions });
    setUser(userInfo);
    setPermissions(userPermissions);
    setIsAuthenticated(true);
  };

  const logout = () => {
    removeAuthToken();
    removeUserData();
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
