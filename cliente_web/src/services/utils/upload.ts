import { ApiClient } from "@/lib/api-client";
import { getApiBaseUrl } from "@/config/api";

export const uploadCsvFile = async <TResponse>(
  path: string,
  file: File
): Promise<TResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  const apiClient = new ApiClient(getApiBaseUrl());

  return apiClient.post<TResponse>(path, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
