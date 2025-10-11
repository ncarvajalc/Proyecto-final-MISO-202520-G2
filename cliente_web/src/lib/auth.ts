/**
 * Authentication utilities
 * 
 * Handles JWT storage and retrieval from localStorage
 */

const TOKEN_KEY = "auth_token";
const USER_DATA_KEY = "user_data";

export interface UserData {
  user: {
    id: string;
    email: string;
    name: string;
    profileName?: string;
  };
  permissions: string[];
}

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const setUserData = (data: UserData): void => {
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
};

export const getUserData = (): UserData | null => {
  const data = localStorage.getItem(USER_DATA_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const removeUserData = (): void => {
  localStorage.removeItem(USER_DATA_KEY);
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

