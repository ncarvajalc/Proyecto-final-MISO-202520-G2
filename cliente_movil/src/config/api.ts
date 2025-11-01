import { Platform } from "react-native";

/**
 * Default API base URL
 * - Web: localhost (can access backend running on same machine)
 * - Mobile: Must use computer's local network IP address
 */
export const DEFAULT_API_BASE_URL = Platform.OS === "web"
  ? "http://localhost:8080"
  : "http://192.168.100.6:8080";

/**
 * Normalize URL value from environment variable
 */
const normalizeUrl = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

/**
 * Get API base URL from environment variable or use default
 *
 * Environment variable: EXPO_PUBLIC_API_URL
 * Configure in .env file (see .env.example)
 */
export const getApiBaseUrl = (): string => {
  const envValue = normalizeUrl(process.env.EXPO_PUBLIC_API_URL);
  return envValue ?? DEFAULT_API_BASE_URL;
};

/**
 * Current API base URL
 * For backward compatibility
 */
export const API_BASE_URL = getApiBaseUrl();
