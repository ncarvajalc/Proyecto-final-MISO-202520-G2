export const DEFAULT_API_BASE_URL = "http://localhost:8080";

const normalizeUrl = (value: string | undefined | null): string | undefined => {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed;
};

export const getApiBaseUrl = (): string => {
  const envValue = normalizeUrl(import.meta.env?.VITE_API_URL);
  return envValue ?? DEFAULT_API_BASE_URL;
};
