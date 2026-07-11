"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ExecuteResponse } from "@orchestra/contracts";
import { api } from "@/lib/http";

interface ExecuteParams {
  decisionId: string;
  input?: unknown;
}

/**
 * POST /api/execute — creates and runs execution for a decision.
 */
export function useExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ decisionId, input }: ExecuteParams) =>
      api<ExecuteResponse>("/api/execute", {
        method: "POST",
        body: JSON.stringify({ decision_id: decisionId, input }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
