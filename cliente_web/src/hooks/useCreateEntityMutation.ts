import {
  useMutation,
  useQueryClient,
  type QueryKey,
  type QueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

type MutationContext = { client: QueryClient } & Record<string, unknown>;

interface UseCreateEntityMutationOptions<
  TVariables,
  TResponse,
  TError extends Error & { detail?: string }
> {
  mutationFn: (variables: TVariables, context?: MutationContext) => Promise<TResponse>;
  queryKey: QueryKey;
  successMessage: string;
  successDescription?: string;
  errorTitle: string;
  getErrorDescription?: (error: TError) => string | undefined;
  onSuccess?: (data: TResponse, variables: TVariables) => void;
}

export function useCreateEntityMutation<
  TVariables,
  TResponse = void,
  TError extends Error & { detail?: string } = Error & { detail?: string }
>({
  mutationFn,
  queryKey,
  successMessage,
  successDescription,
  errorTitle,
  getErrorDescription,
  onSuccess,
}: UseCreateEntityMutationOptions<TVariables, TResponse, TError>) {
  const queryClient = useQueryClient();

  return useMutation<TResponse, TError, TVariables>({
    mutationFn: (variables, context) => {
      const mergedContext: MutationContext = {
        ...(context ?? {}),
        client: context?.client ?? queryClient,
      };

      return mutationFn(variables, mergedContext);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey });

      if (successDescription) {
        toast.success(successMessage, { description: successDescription });
      } else {
        toast.success(successMessage);
      }

      onSuccess?.(data, variables);
    },
    onError: (error) => {
      const description =
        getErrorDescription?.(error) ??
        error.detail ??
        error.message ??
        "Error inesperado";

      toast.error(errorTitle, { description });
    },
  });
}
