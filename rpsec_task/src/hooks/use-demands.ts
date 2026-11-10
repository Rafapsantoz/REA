import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demandsApi, getToken } from "@/lib/api";
import { compareDemands } from "@/lib/demands";
import type { Horizon, ListDoapp, PriorityLevel, TaskStatus } from "@/types/doapp";

export interface DemandInput {
  description: string;
  category_id: number;
  link: string | null;
  deadline: string | null;
  horizon: Horizon;
  status: TaskStatus;
  priority?: PriorityLevel;
}

/** Demands owned by the signed-in user, ordered by deadline. */
export function useDemands(userId: number | null) {
  const query = useQuery<ListDoapp[]>({
    queryKey: ["demands", userId],
    queryFn: async () => {
      if (!userId || !getToken()) return [];
      const list = await demandsApi.list({ user_id: userId });
      return list.sort(compareDemands);
    },
    enabled: !!userId && !!getToken(),
  });

  return { demands: query.data ?? [], isPending: query.isPending, error: query.error };
}

export function useCreateDemand(userId: number | null) {
  const queryClient = useQueryClient();

  const mutation = useMutation<ListDoapp, Error, DemandInput>({
    mutationFn: async (input: DemandInput) => {
      if (userId === null) {
        throw new Error("You need to be signed in to add a demand.");
      }
      return demandsApi.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
    },
  });

  return {
    createDemand: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

export function useUpdateDemand() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ListDoapp,
    Error,
    { id: number; input: DemandInput }
  >({
    mutationFn: ({ id, input }) => demandsApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
    },
  });

  return {
    updateDemand: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/** Status change coming from a drag between board lanes or the card menu. */
export function useMoveDemand() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ListDoapp,
    Error,
    { id: number; status: TaskStatus }
  >({
    mutationFn: ({ id, status }) => demandsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
    },
  });

  return {
    moveDemand: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

export function useDeleteDemand() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, number>({
    mutationFn: (id: number) => demandsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
    },
  });

  return {
    deleteDemand: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/** Priority change coming from dragging to a priority column or selecting in card menu. */
export function useUpdatePriority() {
  const queryClient = useQueryClient();

  const mutation = useMutation<
    ListDoapp,
    Error,
    { id: number; priority: PriorityLevel }
  >({
    mutationFn: ({ id, priority }) => demandsApi.updatePriority(id, priority),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
    },
  });

  return {
    updatePriority: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}

/** Clears all demands to start the board fresh with a clean slate. */
export function useClearAllDemands() {
  const queryClient = useQueryClient();

  const mutation = useMutation<void, Error, void>({
    mutationFn: () => demandsApi.clearAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["demands"] });
    },
  });

  return {
    clearAllDemands: mutation.mutateAsync,
    isPending: mutation.isPending,
  };
}
