"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DecisionResponse } from "@orchestra/contracts";
import { api } from "@/lib/http";

/**
 * POST /api/route — routes a task and returns a DecisionResponse.
 * Uses mutation because it triggers a server-side decision process (not idempotent GET).
 */
export function useRouteDecision() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      api<DecisionResponse>("/api/route", {
        method: "POST",
        body: JSON.stringify({ task_id: taskId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
