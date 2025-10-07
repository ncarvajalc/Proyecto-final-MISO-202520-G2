/**
 * Authentication Service
 * 
 * This service handles all authentication-related API calls.
 * Currently using mock data - replace with real API endpoints when backend is ready.
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Mock login function
 * 
 * TODO: Replace this with actual API call when backend is ready
 * Example:
 * ```
 * export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
 *   const response = await fetch('https://your-api.com/auth/login', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(credentials),
 *   });
 *   if (!response.ok) throw new Error('Login failed');
 *   return response.json();
 * };
 * ```
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock validation (accept any non-empty credentials)
  if (!credentials.email || !credentials.password) {
    throw new Error("Email y contraseña son requeridos");
  }

  // Mock successful response
  return {
    token: "mock-jwt-token-" + Date.now(),
    user: {
      id: "1",
      email: credentials.email,
      name: "Usuario Demo",
    },
  };
};

/**
 * Mock token validation
 * 
 * TODO: Replace with real token validation when backend is ready
 * Example:
 * ```
 * export const validateToken = async (token: string): Promise<boolean> => {
 *   const response = await fetch('https://your-api.com/auth/validate', {
 *     headers: { 'Authorization': `Bearer ${token}` },
 *   });
 *   return response.ok;
 * };
 * ```
 */
export const validateToken = async (token: string): Promise<boolean> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock validation - check if token exists and is not expired
  if (!token || token === "null" || token === "undefined") {
    return false;
  }

  // For demo purposes, all tokens are valid
  return true;
};

