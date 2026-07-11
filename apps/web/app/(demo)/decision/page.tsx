"use client";

import { useState } from "react";
import type { DecisionResponse, ExecuteResponse } from "@orchestra/contracts";
import { useRouteDecision } from "@/lib/queries/use-route-decision";
import { useExecute } from "@/lib/queries/use-execute";
import { useExecution } from "@/lib/queries/use-execution";
import { useReview } from "@/lib/queries/use-review";
import { DecisionCard } from "@/components/decision/decision-card";
import { Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";

// ── Error message mapping ───────────────────────────────────

function friendlyError(message: string, code?: string): string {
  if (code === "upstream_error") return "Hệ thống AI tạm thời lỗi, thử lại sau";
  return message;
}

// ── Page ────────────────────────────────────────────────────

export default function DecisionDemoPage() {
  const [taskId, setTaskId] = useState("");
  const [decision, setDecision] = useState<DecisionResponse | null>(null);
  const [executeResult, setExecuteResult] = useState<ExecuteResponse | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);

  const routeMutation = useRouteDecision();
  const executeMutation = useExecute();
  const executionQuery = useExecution(executionId);
  const reviewMutation = useReview();

  // ── Handlers ──────────────────────────────────────────────

  function handleRoute() {
    if (!taskId.trim()) return;
    setDecision(null);
    setExecuteResult(null);
    setExecutionId(null);

    routeMutation.mutate(taskId.trim(), {
      onSuccess: (data) => setDecision(data),
    });
  }

  function handleExecute() {
    if (!decision) return;
    executeMutation.mutate(
      { decisionId: decision.id },
      {
        onSuccess: (data) => {
          setExecuteResult(data);
          // Track execution for polling if applicable
          if ("execution_id" in data && data.execution_id) {
            setExecutionId(data.execution_id);
          }
        },
      },
    );
  }

  function handleReview(outcome: "approve" | "reject") {
    if (!executionId) return;
    reviewMutation.mutate({ executionId, outcome });
  }

  // ── Derived state ─────────────────────────────────────────

  const canExecute =
    decision &&
    (decision.verdict === "ai" || decision.verdict === "hybrid") &&
    !executeMutation.isPending &&
    !executeResult;

  const showApproval =
    executeResult &&
    (executeResult.kind === "ai_success" || executeResult.kind === "ai_failed") &&
    executeResult.verdict === "hybrid" &&
    !reviewMutation.isSuccess;

  const isDenied = executeResult?.kind === "denied";
  const isEscalate = executeResult?.kind === "escalate";

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-ink">Decision Demo</h1>

      {/* Step 1: Task input */}
      <Card className="space-y-3">
        <label htmlFor="task-id-input" className="text-sm font-medium text-ink2">
          Task ID
        </label>
        <div className="flex gap-2">
          <input
            id="task-id-input"
            type="text"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRoute()}
            placeholder="Nhập UUID của task..."
            className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-a focus:outline-none focus:ring-1 focus:ring-a dark:bg-card"
            aria-label="Task ID input"
          />
          <button
            type="button"
            onClick={handleRoute}
            disabled={!taskId.trim() || routeMutation.isPending}
            className="rounded-lg bg-a px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-a focus:ring-offset-2"
          >
            {routeMutation.isPending ? "Đang phân tích..." : "Phân tích"}
          </button>
        </div>
      </Card>

      {/* Loading state for route */}
      {routeMutation.isPending && (
        <div className="space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {/* Route error */}
      {routeMutation.isError && (
        <ErrorState
          message={friendlyError(routeMutation.error.message, (routeMutation.error as { code?: string }).code)}
          onRetry={handleRoute}
        />
      )}

      {/* Step 2: Decision card */}
      {decision && <DecisionCard decision={decision} />}

      {/* Execute button (verdict=ai|hybrid, not yet executed) */}
      {canExecute && (
        <button
          type="button"
          onClick={handleExecute}
          className="rounded-lg bg-a px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-a focus:ring-offset-2"
        >
          Thực thi
        </button>
      )}

      {/* Execute loading */}
      {executeMutation.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {/* Execute error */}
      {executeMutation.isError && (
        <ErrorState
          message={friendlyError(executeMutation.error.message, (executeMutation.error as { code?: string }).code)}
          onRetry={handleExecute}
        />
      )}

      {/* Step 3: Governance denied */}
      {isDenied && executeResult.kind === "denied" && (
        <Card className="border-bad/30 bg-[color:#F7E7E3] dark:bg-bad/10">
          <p className="font-medium text-bad">Bị chặn bởi governance</p>
          <p className="mt-1 text-sm text-bad/80">{executeResult.reason}</p>
        </Card>
      )}

      {/* Escalate (from execute response) */}
      {isEscalate && executeResult.kind === "escalate" && (
        <Card className="border-bad/30 bg-[color:#F7E7E3] dark:bg-bad/10">
          <p className="font-medium text-bad">Cần người quản lý xem xét</p>
          <p className="mt-1 text-sm text-bad/80">{executeResult.reason}</p>
        </Card>
      )}

      {/* Step 4: AI success output */}
      {executeResult?.kind === "ai_success" && (
        <Card className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Kết quả AI</p>
          <p className="whitespace-pre-wrap text-sm text-ink">{executeResult.output}</p>
          <p className="font-mono text-[11px] text-muted">
            {executeResult.tokens != null && `${executeResult.tokens} tokens`}
            {executeResult.ms != null && ` · ${executeResult.ms}ms`}
          </p>
        </Card>
      )}

      {/* Step 5: Human pending */}
      {executeResult?.kind === "human_pending" && (
        <Card className="space-y-2">
          <p className="text-sm text-ink2">
            Đã giao cho <span className="font-medium">{executeResult.assignee_id}</span>. Đang chờ hoàn thành.
          </p>
        </Card>
      )}

      {/* Step 5b: Approval actions (hybrid with AI output) */}
      {showApproval && (
        <Card className="space-y-3">
          <p className="text-sm font-medium text-ink2">Kết quả cần duyệt (hybrid)</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleReview("approve")}
              disabled={reviewMutation.isPending}
              className="rounded-lg bg-good px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-good focus:ring-offset-2"
            >
              {reviewMutation.isPending ? "Đang xử lý..." : "Duyệt"}
            </button>
            <button
              type="button"
              onClick={() => handleReview("reject")}
              disabled={reviewMutation.isPending}
              className="rounded-lg border border-bad/40 px-4 py-2 text-sm font-medium text-bad transition-opacity hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-bad focus:ring-offset-2"
            >
              Từ chối
            </button>
          </div>
        </Card>
      )}

      {/* Review result */}
      {reviewMutation.isSuccess && (
        <Card>
          <p className="text-sm text-ink2">
            {reviewMutation.data.outcome === "approve"
              ? "Đã duyệt thành công."
              : "Đã từ chối."}
            {" "}Trạng thái task: <span className="font-medium">{reviewMutation.data.task_status}</span>
          </p>
        </Card>
      )}

      {/* Review error */}
      {reviewMutation.isError && (
        <ErrorState
          message={friendlyError(reviewMutation.error.message, (reviewMutation.error as { code?: string }).code)}
        />
      )}

      {/* Polling execution status (for long-running tasks) */}
      {executionId && executionQuery.data && !executeResult?.kind?.startsWith("ai_") && executeResult?.kind !== "human_pending" && (
        <Card className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Trạng thái thực thi</p>
          <p className="text-sm text-ink2">
            {executionQuery.data.status}
            {executionQuery.data.output && (
              <span className="ml-2 text-ink">{executionQuery.data.output}</span>
            )}
          </p>
        </Card>
      )}

      {/* Empty state when nothing has happened yet */}
      {!decision && !routeMutation.isPending && !routeMutation.isError && (
        <EmptyState
          title="Chưa có decision nào"
          hint="Nhập Task ID ở trên rồi bấm Phân tích để xem Router quyết định verdict."
        />
      )}
    </div>
  );
}
