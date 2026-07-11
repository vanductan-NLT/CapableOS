"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { Agent, Task, TaskStatus } from "@orchestra/contracts";
import { api } from "@/lib/http";
import { supabaseBrowser } from "@/lib/supabase/client";
import { hasSupabase } from "@/lib/env";

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
