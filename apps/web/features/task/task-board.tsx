"use client";

import { useState } from "react";
import type { Agent, DecisionResponse, ExecuteResponse, Task } from "@orchestra/contracts";
import { Badge, Card, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { useSubmitFeedback } from "@/features/dashboard/hooks";
import { useAgents, useRealtimeTasks, useTasks } from "./hooks";
import { BOARD_COLUMNS, STATUS_META } from "./status";
import { useRouteDecision } from "@/lib/queries/use-route-decision";
import { useExecute } from "@/lib/queries/use-execute";
import { useReview } from "@/lib/queries/use-review";
import { useDecision } from "@/lib/queries/use-decision";

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
    return <EmptyState title="Chưa có việc" hint="Tạo yêu cầu ở trang Giao việc để hệ thống định tuyến người hoặc AI." />;
  }

  const byStatus = new Map(BOARD_COLUMNS.map((s) => [s, [] as Task[]]));
  for (const t of tasks) byStatus.get(t.status)?.push(t);
  const visible = BOARD_COLUMNS.filter((s, i) => i === 0 || (byStatus.get(s)?.length ?? 0) > 0);
  const maxCardsPerColumn = 8;

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
              {list.slice(0, maxCardsPerColumn).map((t) => (
                <TaskCard key={t.id} task={t} agent={t.assignee_id ? agentById.get(t.assignee_id) : undefined} />
              ))}
              {list.length > maxCardsPerColumn ? (
                <div className="rounded-lg border border-dashed border-line px-3 py-2 text-center text-xs text-muted">
                  Còn {list.length - maxCardsPerColumn} việc khác trong trạng thái này
                </div>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TaskCard({ task, agent }: { task: Task; agent?: Agent }) {
  const decision = useDecision(task.decision_id);
  const chosenCandidate = decision.data?.candidates.find((candidate) => decision.data?.chosen.includes(candidate.id));
  const assignmentLabel = agent?.name ?? chosenCandidate?.name;
  const assignmentType = agent?.type ?? chosenCandidate?.type;

  return (
    <Card className="p-3">
      <p className="text-sm font-medium">{task.title}</p>
      {task.description ? <p className="mt-1 line-clamp-2 text-xs text-muted">{task.description}</p> : null}
      <div className="mt-2 flex items-center gap-2">
        {agent ? (
          <Badge tone={agent.type === "ai" ? "a" : "b"}>
            <Icon name={agent.type === "ai" ? "bot" : "user"} size={13} />
            {agent.name}
          </Badge>
        ) : assignmentLabel ? (
          <Badge tone={assignmentType === "ai" ? "a" : "b"}>
            <Icon name={assignmentType === "ai" ? "bot" : "user"} size={13} />
            {assignmentLabel}
          </Badge>
        ) : task.decision_id && decision.isLoading ? (
          <span className="text-xs text-muted">Đang đọc nguồn lực đã chọn…</span>
        ) : (
          <span className="text-xs text-muted">Chưa chọn nguồn lực</span>
        )}
      </div>

      {/* Action: Route created tasks */}
      {task.status === "created" && <RouteAction taskId={task.id} />}

      {/* Action: Execute routed tasks */}
      {task.status === "routed" && task.decision_id && <ExecuteAction decisionId={task.decision_id} />}

      {/* Action: Review awaiting_approval tasks */}
      {task.status === "awaiting_approval" && task.decision_id && <ReviewAction decisionId={task.decision_id} />}

      {/* Show result */}
      {task.result ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-b">► Xem kết quả</summary>
          <p className="mt-1 whitespace-pre-wrap text-xs text-ink2">{task.result}</p>
        </details>
      ) : null}

      {/* Feedback for done tasks */}
      {task.status === "done" ? <FeedbackControl taskId={task.id} /> : null}
    </Card>
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
          execute.mutate(
            { decisionId: dec.id },
            { onSuccess: (r) => setExecResult(r) },
          );
        }
      },
    });
  }

  const isPending = route.isPending || execute.isPending;

  return (
    <div className="mt-2 space-y-1.5">
      {!decision && !route.isError && (
        <button
          type="button"
          disabled={isPending}
          onClick={handleRouteAndExecute}
          className="w-full rounded-md bg-a px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Đang so sánh nguồn lực…" : "Chọn nguồn lực tốt nhất"}
        </button>
      )}
      {route.isError && (
        <p className="text-xs text-bad">{route.error instanceof HttpError ? route.error.message : "Lỗi routing"}</p>
      )}
      {decision && (
        <div className="rounded border border-line bg-paper/50 p-1.5">
          <div className="flex items-center gap-1.5">
            <Badge tone={decision.verdict === "ai" ? "a" : decision.verdict === "human" ? "b" : "gold"}>
              {decision.verdict.toUpperCase()}
            </Badge>
            <span className="text-[10px] text-muted">
              Độ tin cậy {((decision.confidence ?? 0) * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
      {execResult?.kind === "ai_success" && (
        <p className="text-xs text-good">✓ AI đã xong · {execResult.ms}ms</p>
      )}
      {execute.isError && <p className="text-xs text-bad">{execute.error instanceof HttpError ? execute.error.message : "Không bắt đầu xử lý được"}</p>}
    </div>
  );
}

function ExecuteAction({ decisionId }: { decisionId: string }) {
  const execute = useExecute();
  const [result, setResult] = useState<ExecuteResponse | null>(null);

  if (result) {
    return (
      <div className="mt-2">
        {result.kind === "ai_success" && <p className="text-xs text-good">✓ AI xong · {result.ms}ms</p>}
        {result.kind === "human_pending" && <p className="text-xs text-muted">Đã giao cho người</p>}
        {result.kind === "denied" && <p className="text-xs text-bad">Bị chặn: {result.reason}</p>}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        disabled={execute.isPending}
        onClick={() => execute.mutate({ decisionId }, { onSuccess: (r) => setResult(r) })}
        className="w-full rounded-md bg-a px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
      >
        {execute.isPending ? "Đang bắt đầu…" : "Bắt đầu xử lý"}
      </button>
      {execute.isError && (
        <p className="mt-1 text-xs text-bad">
          {execute.error instanceof HttpError ? execute.error.message : "Không bắt đầu xử lý được"}
        </p>
      )}
    </div>
  );
}

function ReviewAction({ decisionId }: { decisionId: string }) {
  const review = useReview();
  const [done, setDone] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (done) {
    return <p className="mt-2 text-xs text-good">✓ Đã duyệt</p>;
  }

  async function loadAndReview(outcome: "approve" | "reject") {
    if (!executionId) {
      setLoading(true);
      try {
        const res = await fetch(`/api/execution/by-decision/${decisionId}`);
        const data = await res.json();
        if (data.ok && data.data.id) {
          setExecutionId(data.data.id);
          review.mutate(
            { executionId: data.data.id, outcome },
            { onSuccess: () => setDone(true) },
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    } else {
      review.mutate({ executionId, outcome }, { onSuccess: () => setDone(true) });
    }
  }

  return (
    <div className="mt-2 space-y-1">
      <p className="text-[10px] font-medium uppercase text-muted">Kết quả cần xác nhận:</p>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={review.isPending || loading}
          onClick={() => loadAndReview("approve")}
          className="flex-1 rounded-md border border-good/40 px-2 py-0.5 text-xs text-good disabled:opacity-50"
        >
          Duyệt
        </button>
        <button
          type="button"
          disabled={review.isPending || loading}
          onClick={() => loadAndReview("reject")}
          className="flex-1 rounded-md border border-bad/40 px-2 py-0.5 text-xs text-bad disabled:opacity-50"
        >
          Từ chối
        </button>
      </div>
      {review.isError && <p className="text-xs text-bad">{review.error instanceof HttpError ? review.error.message : "Không duyệt được"}</p>}
    </div>
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
