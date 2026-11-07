import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { readDatabase, updateDatabase } from "@/lib/local-db";
import type { DoappDatabase } from "@/types/doapp";

export const DATABASE_QUERY_KEY = ["doapp", "database"] as const;

/** Reads the whole stored document; every hook in the app derives from it. */
export function useDatabase() {
  return useQuery({
    queryKey: DATABASE_QUERY_KEY,
    queryFn: () => readDatabase(),
  });
}

export function useRefreshDatabase() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: DATABASE_QUERY_KEY });
  };
}

/**
 * Wraps a storage mutation so every write refreshes the board that reads it.
 * The mutator receives the current document and returns both the next document
 * and the value handed back to the caller.
 */
export function useDatabaseMutation<TInput, TResult>(
  mutate: (
    database: DoappDatabase,
    input: TInput,
  ) => { database: DoappDatabase; result: TResult },
) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (input: TInput) => {
      let result: TResult | undefined;
      updateDatabase((database) => {
        const outcome = mutate(database, input);
        result = outcome.result;
        return outcome.database;
      });
      return result as TResult;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DATABASE_QUERY_KEY });
    },
  });

  return { mutateAsync: mutation.mutateAsync, isPending: mutation.isPending };
}
