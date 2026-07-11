"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReviewResult, ReviewOutcome } from "@orchestra/contracts";
import { api } from "@/lib/http";

interface ReviewParams {
  executionId: string;
  outcome: ReviewOutcome;
  note?: string;
}

/**
 * POST /api/execution/[id]/review — approve or reject a hybrid execution.
 * Invalidates the execution query on success so polling picks up the new status.
 */
export function useReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ executionId, outcome, note }: ReviewParams) =>
      api<ReviewResult>(`/api/execution/${executionId}/review`, {
        method: "POST",
        body: JSON.stringify({ outcome, note }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["execution", variables.executionId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
