"use client";

import { useQuery } from "@tanstack/react-query";
import type { DecisionResponse } from "@orchestra/contracts";
import { api } from "@/lib/http";

export function useDecision(decisionId?: string) {
  return useQuery({
    queryKey: ["decision", decisionId],
    enabled: Boolean(decisionId),
    queryFn: () => api<DecisionResponse>(`/api/decision/${decisionId}`),
  });
}
