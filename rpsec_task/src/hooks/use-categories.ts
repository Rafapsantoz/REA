import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { categoriesApi, getToken } from "@/lib/api";
import type { CategoriesDoapp } from "@/types/doapp";

export interface CategoryResult {
  ok: boolean;
  error?: string;
}

export function useCategories() {
  const query = useQuery<CategoriesDoapp[]>({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    enabled: !!getToken(),
  });

  return {
    categories: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
  };
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  const mutation = useMutation<CategoriesDoapp, Error, string>({
    mutationFn: (description: string) => {
      const name = description.trim();
      if (!name) {
        throw new Error("Give the category a name.");
      }
      return categoriesApi.create(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const createCategory = async (description: string): Promise<CategoryResult> => {
    try {
      await mutation.mutateAsync(description);
      return { ok: true };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create category.";
      return { ok: false, error: errorMsg };
    }
  };

  return { createCategory, isPending: mutation.isPending };
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, number>({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["demands"] });
    },
  });

  const deleteCategory = async (id: number): Promise<CategoryResult> => {
    try {
      await mutation.mutateAsync(id);
      return { ok: true };
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete category.";
      return { ok: false, error: errorMsg };
    }
  };

  return { deleteCategory, isPending: mutation.isPending };
}
