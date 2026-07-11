"use client";

import { useQuery } from "@tanstack/react-query";
import type { Execution } from "@orchestra/contracts";
import { api } from "@/lib/http";

/**
 * GET /api/execution/[id] — polls execution status.
 * Refetches every 2s while status is pending or running.
 * Stops polling when terminal (succeeded, failed, cancelled).
 */
export function useExecution(executionId: string | null) {
  return useQuery({
    queryKey: ["execution", executionId],
    queryFn: () => api<Execution>(`/api/execution/${executionId}`),
    enabled: !!executionId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "running") return 2000;
      return false;
    },
  });
}
