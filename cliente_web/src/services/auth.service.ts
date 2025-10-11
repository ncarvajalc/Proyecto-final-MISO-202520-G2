/**
 * Authentication Service
 *
 * This service handles all authentication-related API calls.
 * Integrates with the SecurityAndAudit backend service.
 */

// API Base URL - update this based on your environment
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: UserInfo;
  permissions?: string[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  profile_id: string;
  profile_name: string;
  is_active: boolean;
  permissions: string[];
  last_login_at: string | null;
  created_at: string;
}

/**
 * Login with email and password
 *
 * @param credentials - User email and password
 * @returns AuthResponse with token, user info, and permissions
 * @throws Error if login fails
 */
export const login = async (
  credentials: LoginCredentials
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Login failed" }));
      throw new Error(error.detail || "Login failed");
    }

    const data: AuthResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error de conexión con el servidor");
  }
};

/**
 * Validate JWT token
 *
 * @param token - JWT token to validate
 * @returns true if token is valid, false otherwise
 */
export const validateToken = async (token: string): Promise<boolean> => {
  if (!token || token === "null" || token === "undefined") {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/validate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.valid === true;
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
};

/**
 * Get current user profile
 *
 * @param token - JWT token
 * @returns User profile with permissions
 * @throws Error if request fails
 */
export const getCurrentUser = async (token: string): Promise<UserProfile> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Failed to get user profile" }));
      throw new Error(error.detail || "Failed to get user profile");
    }

    const data: UserProfile = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error de conexión con el servidor");
  }
};
