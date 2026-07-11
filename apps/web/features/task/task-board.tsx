"use client";

import { useState } from "react";
import type { Agent, Task } from "@orchestra/contracts";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { useSubmitFeedback } from "@/features/dashboard/hooks";
import { useAgents, useRealtimeTasks, useTasks } from "./hooks";
import { BOARD_COLUMNS, STATUS_META } from "./status";

export function TaskBoard() {
  const { data: tasks, isLoading, isError, error, refetch } = useTasks();
  const { data: agents } = useAgents();
  useRealtimeTasks();

  const agentById = new Map((agents ?? []).map((a) => [a.id, a]));

  if (isLoading) {
    return (
      <div className="grid grid-flow-col gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.slice(0, 5).map((c) => (
          <Skeleton key={c} className="h-40 w-64" />
        ))}
      </div>
    );
  }
  if (isError) {
    return <ErrorState message={error instanceof HttpError ? error.message : "Không tải được board"} onRetry={refetch} />;
  }
  if (!tasks || tasks.length === 0) {
    return <EmptyState title="Board trống" hint="Tạo task ở trang Command để nó xuất hiện ở đây." />;
  }

  const byStatus = new Map(BOARD_COLUMNS.map((s) => [s, [] as Task[]]));
  for (const t of tasks) byStatus.get(t.status)?.push(t);
  // only show columns that have tasks, plus the first (created) always
  const visible = BOARD_COLUMNS.filter((s, i) => i === 0 || (byStatus.get(s)?.length ?? 0) > 0);

  return (
    <div className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3">
      {visible.map((status) => {
        const list = byStatus.get(status) ?? [];
        return (
          <section key={status} aria-label={STATUS_META[status].label} className="min-w-[240px]">
            <div className="mb-2 flex items-center justify-between px-1">
              <Badge tone={STATUS_META[status].tone}>{STATUS_META[status].label}</Badge>
              <span className="font-mono text-xs text-muted">{list.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {list.map((t) => (
                <TaskCard key={t.id} task={t} agent={t.assignee_id ? agentById.get(t.assignee_id) : undefined} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TaskCard({ task, agent }: { task: Task; agent?: Agent }) {
  return (
    <Card className="p-3">
      <p className="text-sm font-medium">{task.title}</p>
      {task.description ? <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        {agent ? (
          <Badge tone={agent.type === "ai" ? "a" : "b"}>
            {agent.type === "ai" ? "🤖" : "🧑"} {agent.name}
          </Badge>
        ) : (
          <span className="text-xs text-muted">Chưa gán</span>
        )}
      </div>
      {task.result ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-b">Xem kết quả</summary>
          <p className="mt-1 whitespace-pre-wrap text-xs text-ink2">{task.result}</p>
        </details>
      ) : null}
      {task.status === "done" ? <FeedbackControl taskId={task.id} /> : null}
    </Card>
  );
}

function FeedbackControl({ taskId }: { taskId: string }) {
  const fb = useSubmitFeedback();
  const [done, setDone] = useState<null | number>(null);

  if (done !== null) {
    return (
      <p className="mt-2 text-xs text-good" role="status">
        ✓ Đã đánh giá · trust hiện tại {done}
      </p>
    );
  }
  return (
    <div className="mt-2 flex items-center gap-2">
      <span className="text-xs text-muted">Đánh giá:</span>
      <button
        type="button"
        disabled={fb.isPending}
        onClick={() => fb.mutate({ task_id: taskId, rating: "pass" }, { onSuccess: (r) => setDone(r.new_trust) })}
        className="rounded-md border border-good/40 px-2 py-0.5 text-xs text-good disabled:opacity-50"
        aria-label="Đánh giá đạt (trust +1)"
      >
        Đạt +1
      </button>
      <button
        type="button"
        disabled={fb.isPending}
        onClick={() => fb.mutate({ task_id: taskId, rating: "fail" }, { onSuccess: (r) => setDone(r.new_trust) })}
        className="rounded-md border border-bad/40 px-2 py-0.5 text-xs text-bad disabled:opacity-50"
        aria-label="Đánh giá không đạt (trust −1)"
      >
        Không −1
      </button>
    </div>
  );
}
