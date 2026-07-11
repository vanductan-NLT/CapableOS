"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Agent, DecisionResponse, ExecuteResponse, Task, TaskStatus } from "@orchestra/contracts";
import { api } from "@/lib/http";
import { supabaseBrowser } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/env";

export interface PipelineResponse {
  task: Task;
  decision: DecisionResponse | null;
  execution: ExecuteResponse | null;
  error_stage?: "route" | "execute";
  error_message?: string;
}

export function useTasks(status?: TaskStatus) {
  return useQuery({
    queryKey: ["tasks", status ?? "all"],
    queryFn: () => api<Task[]>(`/api/tasks${status ? `?status=${status}` : ""}`),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      api<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/** Full pipeline: create → route → execute in one call. */
export function usePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      api<PipelineResponse>("/api/tasks/pipeline", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["metrics"] });
      qc.invalidateQueries({ queryKey: ["breakdown"] });
      qc.invalidateQueries({ queryKey: ["flow"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<Task, "status" | "assignee_id" | "result">> }) =>
      api<Task>(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useAgents() {
  return useQuery({ queryKey: ["agents"], queryFn: () => api<Agent[]>("/api/agents") });
}

/** Subscribe to task changes → invalidate the tasks cache (FR-10 realtime). */
export function useRealtimeTasks() {
  const qc = useQueryClient();
  useEffect(() => {
    if (!hasSupabase()) return;
    const sb = supabaseBrowser();
    const channel = sb
      .channel("tasks-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => {
        qc.invalidateQueries({ queryKey: ["tasks"] });
      })
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [qc]);
}
