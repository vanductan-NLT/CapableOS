"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FeedbackResult, Metrics } from "@orchestra/contracts";
import type { Flow, SideStat } from "@/lib/metrics";
import type { Reputation } from "@/lib/reputation";
import { api } from "@/lib/http";

export function useMetrics() {
  return useQuery({ queryKey: ["metrics"], queryFn: () => api<Metrics>("/api/metrics") });
}

export function useBreakdown() {
  return useQuery({
    queryKey: ["breakdown"],
    queryFn: () => api<{ human: SideStat; ai: SideStat }>("/api/metrics/breakdown"),
  });
}

export function useFlow() {
  return useQuery({ queryKey: ["flow"], queryFn: () => api<Flow>("/api/metrics/flow") });
}

export function useReputation() {
  return useQuery({
    queryKey: ["reputation"],
    queryFn: () => api<Record<string, Reputation>>("/api/agents/reputation"),
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { task_id: string; rating: "pass" | "fail"; note?: string }) =>
      api<FeedbackResult>("/api/feedback", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      for (const key of ["agents", "metrics", "breakdown", "tasks", "flow", "reputation"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
