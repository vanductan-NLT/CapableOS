"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Agent, AgentPatch, NewAgentInput } from "@orchestra/contracts";
import { api } from "@/lib/http";

export function useCapabilities() {
  return useQuery({ queryKey: ["capabilities"], queryFn: () => api<string[]>("/api/capabilities") });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: NewAgentInput) => api<Agent>("/api/agents", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: ["capabilities"] });
    },
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: AgentPatch }) =>
      api<Agent>(`/api/agents/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}
