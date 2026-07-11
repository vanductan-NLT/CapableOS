"use client";

import { useState } from "react";
import type { Agent, DecisionResponse, ExecuteResponse, Task } from "@orchestra/contracts";
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
  SparkIcon,
  Stagger,
  StaggerItem,
  cn,
  type Tone,
} from "@orchestra/ui";
import { HttpError } from "@/lib/http";
import { useSubmitFeedback } from "@/features/dashboard/hooks";
import { useAgents, useRealtimeTasks, useTasks } from "./hooks";
import { BOARD_COLUMNS, STATUS_META } from "./status";
import { useRouteDecision } from "@/lib/queries/use-route-decision";
import { useExecute } from "@/lib/queries/use-execute";
import { useReview } from "@/lib/queries/use-review";

// Column accent rail — ties each Kanban column to its status tone.
const RAIL: Record<Tone, string> = {
  muted: "bg-muted",
  a: "bg-a",
  b: "bg-b",
  gold: "bg-gold",
  good: "bg-good",
  bad: "bg-bad",
};

// Purple-tinted button for AI/decision actions (secondary hierarchy, AA-safe both themes).
const AI_BTN = "w-full border border-a-line bg-a-soft text-a hover:bg-a/10";
const VERDICT_TONE = { ai: "a", human: "b", hybrid: "gold", escalate: "bad" } as const;

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
        {task.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted">{task.description}</p>
        ) : null}
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

        {task.status === "created" ? <RouteAction taskId={task.id} /> : null}
        {task.status === "routed" && task.decision_id ? <ExecuteAction decisionId={task.decision_id} /> : null}
        {task.status === "awaiting_approval" && task.decision_id ? (
          <ReviewAction decisionId={task.decision_id} />
        ) : null}

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

function RouteAction({ taskId }: { taskId: string }) {
  const route = useRouteDecision();
  const execute = useExecute();
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [execResult, setExecResult] = useState<ExecuteResponse | null>(null);

  function handleRouteAndExecute() {
    route.mutate(taskId, {
      onSuccess: (dec) => {
        setDecision(dec);
        if (dec.verdict === "ai" || dec.verdict === "hybrid") {
          execute.mutate({ decisionId: dec.id }, { onSuccess: (r) => setExecResult(r) });
        }
      },
    });
  }

  const isPending = route.isPending || execute.isPending;

  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
      {!decision && !route.isError ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          leftIcon={<SparkIcon size={14} />}
          className={AI_BTN}
          onClick={handleRouteAndExecute}
        >
          {isPending ? "Đang xử lý…" : "Định tuyến & Thực thi"}
        </Button>
      ) : null}
      {route.isError ? (
        <p className="text-xs text-bad">{route.error instanceof HttpError ? route.error.message : "Lỗi routing"}</p>
      ) : null}
      {decision ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-line bg-paper/60 px-2 py-1.5">
          <Badge tone={VERDICT_TONE[decision.verdict]} dot>
            {decision.verdict}
          </Badge>
          <span className="font-mono text-[10px] text-muted">{((decision.confidence ?? 0) * 100).toFixed(0)}% conf.</span>
        </div>
      ) : null}
      {execResult?.kind === "ai_success" ? (
        <p className="flex items-center gap-1 text-xs text-good">
          <CheckIcon size={13} /> AI đã xong · {execResult.ms}ms
        </p>
      ) : null}
      {execute.isError ? <p className="text-xs text-bad">Lỗi thực thi</p> : null}
    </div>
  );
}

function ExecuteAction({ decisionId }: { decisionId: string }) {
  const execute = useExecute();
  const [result, setResult] = useState<ExecuteResponse | null>(null);

  if (result) {
    return (
      <div className="border-t border-line pt-2.5 text-xs">
        {result.kind === "ai_success" ? (
          <p className="flex items-center gap-1 text-good">
            <CheckIcon size={13} /> AI xong · {result.ms}ms
          </p>
        ) : null}
        {result.kind === "human_pending" ? <p className="text-muted">Đã giao cho người</p> : null}
        {result.kind === "denied" ? <p className="text-bad">Bị chặn: {result.reason}</p> : null}
      </div>
    );
  }

  return (
    <div className="border-t border-line pt-2.5">
      <Button
        size="sm"
        variant="secondary"
        disabled={execute.isPending}
        leftIcon={<SparkIcon size={14} />}
        className={AI_BTN}
        onClick={() => execute.mutate({ decisionId }, { onSuccess: (r) => setResult(r) })}
      >
        {execute.isPending ? "Đang thực thi…" : "Thực thi"}
      </Button>
      {execute.isError ? <p className="mt-1 text-xs text-bad">Lỗi thực thi</p> : null}
    </div>
  );
}

function ReviewAction({ decisionId }: { decisionId: string }) {
  const review = useReview();
  const [done, setDone] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <p className="flex items-center gap-1.5 border-t border-line pt-2.5 text-xs text-good">
        <CheckIcon size={14} /> Đã duyệt
      </p>
    );
  }

  async function loadAndReview(outcome: "approve" | "reject") {
    if (!executionId) {
      setLoading(true);
      try {
        const res = await fetch(`/api/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision_id: decisionId }),
        });
        const data = await res.json();
        if (data.ok && data.data.execution_id) {
          setExecutionId(data.data.execution_id);
          review.mutate({ executionId: data.data.execution_id, outcome }, { onSuccess: () => setDone(true) });
        }
      } catch {
        // fallback — surfaced via review.isError below
      } finally {
        setLoading(false);
      }
    } else {
      review.mutate({ executionId, outcome }, { onSuccess: () => setDone(true) });
    }
  }

  const busy = review.isPending || loading;

  return (
    <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
      <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-muted">AI đã xong — cần duyệt</p>
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          leftIcon={<CheckIcon size={14} />}
          className="flex-1 border-good/30 bg-good-soft text-good hover:bg-good/15"
          onClick={() => loadAndReview("approve")}
        >
          Duyệt
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={busy}
          leftIcon={<CloseIcon size={14} />}
          className="flex-1"
          onClick={() => loadAndReview("reject")}
        >
          Từ chối
        </Button>
      </div>
      {review.isError ? <p className="text-xs text-bad">Lỗi duyệt</p> : null}
    </div>
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
