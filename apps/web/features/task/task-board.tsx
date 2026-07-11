"use client";

import { useState } from "react";
import type { Agent, Task } from "@orchestra/contracts";
import {
  AgentAvatar,
  Badge,
  Button,
  Card,
  CheckIcon,
  ChevronRightIcon,
  CloseIcon,
  EmptyState,
  ErrorState,
  Lift,
  Skeleton,
  Stagger,
  StaggerItem,
  cn,
  type Tone,
} from "@orchestra/ui";
import { HttpError } from "@/lib/http";
import { useSubmitFeedback } from "@/features/dashboard/hooks";
import { useAgents, useRealtimeTasks, useTasks } from "./hooks";
import { BOARD_COLUMNS, STATUS_META } from "./status";

// Column accent rail — ties each Kanban column to its status tone.
const RAIL: Record<Tone, string> = {
  muted: "bg-muted",
  a: "bg-a",
  b: "bg-b",
  gold: "bg-gold",
  good: "bg-good",
  bad: "bg-bad",
};

export function TaskBoard() {
  const { data: tasks, isLoading, isError, error, refetch } = useTasks();
  const { data: agents } = useAgents();
  useRealtimeTasks();

  const agentById = new Map((agents ?? []).map((a) => [a.id, a]));

  if (isLoading) {
    return (
      <div className="grid grid-flow-col gap-3 overflow-x-auto pb-2">
        {BOARD_COLUMNS.slice(0, 5).map((c) => (
          <Skeleton key={c} className="h-44 w-64" />
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
    <div className="grid auto-cols-[minmax(256px,1fr)] grid-flow-col gap-3.5 overflow-x-auto pb-4">
      {visible.map((status) => {
        const meta = STATUS_META[status];
        const list = byStatus.get(status) ?? [];
        return (
          <section key={status} aria-label={meta.label} className="min-w-[256px]">
            <div className="mb-2.5 flex items-center gap-2 px-0.5">
              <span className={cn("h-3.5 w-1 rounded-full", RAIL[meta.tone])} aria-hidden />
              <Badge tone={meta.tone}>{meta.label}</Badge>
              <span className="ml-auto font-mono text-xs tabular-nums text-muted">{list.length}</span>
            </div>
            <Stagger className="flex min-h-[80px] flex-col gap-2.5 rounded-2xl bg-line/25 p-2">
              {list.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-faint">Trống</p>
              ) : (
                list.map((t) => (
                  <StaggerItem key={t.id}>
                    <TaskCard task={t} agent={t.assignee_id ? agentById.get(t.assignee_id) : undefined} />
                  </StaggerItem>
                ))
              )}
            </Stagger>
          </section>
        );
      })}
    </div>
  );
}

function TaskCard({ task, agent }: { task: Task; agent?: Agent }) {
  return (
    <Lift>
      <Card className="flex flex-col gap-2.5 p-3.5">
      <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
      {task.description ? <p className="line-clamp-2 text-xs leading-relaxed text-muted">{task.description}</p> : null}
      <div className="flex items-center gap-2">
        {agent ? (
          <span className="flex items-center gap-1.5">
            <AgentAvatar type={agent.type} size="sm" />
            <span className="text-xs font-medium text-ink2">{agent.name}</span>
          </span>
        ) : (
          <span className="text-xs text-faint">Chưa gán</span>
        )}
      </div>
      {task.result ? (
        <details className="group rounded-lg border border-line bg-paper/60 px-2.5 py-1.5">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-b">
            <ChevronRightIcon size={13} className="transition-transform group-open:rotate-90" />
            Xem kết quả
          </summary>
          <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-ink2">{task.result}</p>
        </details>
      ) : null}
        {task.status === "done" ? <FeedbackControl taskId={task.id} /> : null}
      </Card>
    </Lift>
  );
}

function FeedbackControl({ taskId }: { taskId: string }) {
  const fb = useSubmitFeedback();
  const [done, setDone] = useState<null | number>(null);

  if (done !== null) {
    return (
      <p className="flex items-center gap-1.5 border-t border-line pt-2.5 text-xs text-good" role="status">
        <CheckIcon size={14} /> Đã đánh giá · trust hiện tại {done}
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2 border-t border-line pt-2.5">
      <span className="text-xs text-muted">Đánh giá:</span>
      <Button
        size="sm"
        variant="secondary"
        disabled={fb.isPending}
        leftIcon={<CheckIcon size={14} />}
        className="border-good/30 bg-good-soft text-good hover:bg-good/15"
        onClick={() => fb.mutate({ task_id: taskId, rating: "pass" }, { onSuccess: (r) => setDone(r.new_trust) })}
        aria-label="Đánh giá đạt (trust +1)"
      >
        Đạt
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={fb.isPending}
        leftIcon={<CloseIcon size={14} />}
        onClick={() => fb.mutate({ task_id: taskId, rating: "fail" }, { onSuccess: (r) => setDone(r.new_trust) })}
        aria-label="Đánh giá không đạt (trust −1)"
      >
        Không
      </Button>
    </div>
  );
}
