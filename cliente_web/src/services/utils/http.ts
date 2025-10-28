export const fetchJsonOrThrow = async <T>(
  url: string,
  init?: RequestInit,
  errorMessage?: string
): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(errorMessage ?? `HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
};
