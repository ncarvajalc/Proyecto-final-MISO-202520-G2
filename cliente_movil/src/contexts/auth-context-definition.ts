import { createContext } from "react";

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  profileName?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserInfo | null;
  permissions: string[];
  login: (token: string, user: UserInfo, permissions?: string[]) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
