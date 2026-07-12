"use client";

import type { ExecuteResponse, Task } from "@orchestra/contracts";
import { useState } from "react";
import { Badge, Card, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { HttpError, api } from "@/lib/http";
import { useT } from "@/lib/i18n";
import { useReview } from "@/lib/queries/use-review";
import { useRealtimeTasks, useTasks } from "./hooks";
import { STATUS_META } from "./status";

const DEFAULT_RISK = {
  label: "Cần xem lại",
  tone: "gold",
  reason: "Việc đang ở trạng thái cần người có trách nhiệm kiểm tra trước khi đi tiếp.",
} as const;

const RISK_COPY: Record<string, { label: string; tone: "gold" | "bad" | "b"; reason: string }> = {
  awaiting_approval: {
    label: "Cần duyệt trước khi chạy tiếp",
    tone: "gold",
    reason: "AI đã tham gia hoặc hành động có tác động ra ngoài. Chủ doanh nghiệp cần chốt.",
  },
  review: {
    label: "Cần kiểm tra chất lượng",
    tone: "gold",
    reason: "Đầu ra đã có, cần người xác nhận trước khi tính là hoàn thành.",
  },
  rejected: {
    label: "Bị từ chối",
    tone: "bad",
    reason: "Việc không đạt yêu cầu hoặc vi phạm luật kiểm soát.",
  },
};

export function GovernanceWorkbench() {
  const t = useT();
  const { data: tasks, isLoading, isError, error, refetch } = useTasks();
  useRealtimeTasks();

  if (isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-44" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof HttpError ? error.message : t("Không tải được hàng đợi phê duyệt", "Could not load the approval queue")}
        onRetry={refetch}
      />
    );
  }

  const queue = (tasks ?? []).filter((task) =>
    ["awaiting_approval", "review", "rejected"].includes(task.status),
  );
  const highTouch = (tasks ?? []).filter((task) => task.status === "awaiting_human").length;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-3" aria-label={t("Tổng quan kiểm soát", "Control overview")}>
        <ControlTile label={t("Cần quyết định", "Needs decision")} value={queue.length} tone="bg-gold" />
        <ControlTile label={t("Đang chờ người", "Waiting on a person")} value={highTouch} tone="bg-b" />
        <ControlTile label={t("Luật đang bật", "Active rules")} value={3} tone="bg-a" />
      </section>

      <section className="grid gap-2 sm:grid-cols-3" aria-label={t("Luồng phê duyệt", "Approval flow")}>
        <FlowTile step="1" title={t("AI hoặc người tạo kết quả", "AI or a person produces output")} />
        <FlowTile step="2" title={t("Luật kiểm soát giữ lại việc rủi ro", "Control rules hold risky work")} />
        <FlowTile step="3" title={t("Chủ doanh nghiệp duyệt hoặc từ chối", "The owner approves or rejects")} />
      </section>

      <section className="rounded-xl border border-line bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{t("Hàng đợi phê duyệt", "Approval queue")}</h2>
            <p className="mt-1 text-sm text-muted">
              {t("Nơi chủ doanh nghiệp xem rủi ro, quyết định duyệt hoặc từ chối trước khi AI tác động ra ngoài.", "Where the owner reviews risk and decides to approve or reject before AI acts externally.")}
            </p>
          </div>
          <Badge tone={queue.length ? "gold" : "good"}>{queue.length ? t("cần xử lý", "needs action") : t("ổn định", "stable")}</Badge>
        </div>

        {queue.length === 0 ? (
          <EmptyState
            icon={<Icon name="shield" size={28} />}
            title={t("Không có việc đang kẹt phê duyệt", "No work stuck in approval")}
            hint={t("Khi AI tạo đầu ra cần người xác nhận hoặc luật governance kích hoạt, việc sẽ xuất hiện tại đây.", "When AI produces output needing confirmation or a governance rule triggers, the work appears here.")}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {queue.map((task) => (
              <ApprovalCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3 lg:grid-cols-3" aria-label={t("Luật kiểm soát", "Control rules")}>
        <RuleCard title={t("Tác động khách hàng", "Customer impact")} detail={t("Email, phản hồi khách hàng, nội dung gửi ra ngoài phải được duyệt.", "Emails, customer replies and outbound content must be approved.")} />
        <RuleCard title={t("Chi phí chưa xác thực", "Unverified cost")} detail={t("Chi phí và thời gian chưa kiểm chứng luôn gắn nhãn ước tính.", "Unverified cost and time are always labeled as estimates.")} />
        <RuleCard title={t("Rủi ro chất lượng", "Quality risk")} detail={t("Việc quan trọng do AI hỗ trợ phải có người kiểm tra trước khi hoàn thành.", "Important AI-assisted work must be checked by a person before completion.")} />
      </section>
    </div>
  );
}

function ControlTile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} aria-hidden />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function ApprovalCard({ task }: { task: Task }) {
  const t = useT();
  const review = useReview();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const risk = RISK_COPY[task.status] ?? DEFAULT_RISK;

  async function decide(outcome: "approve" | "reject") {
    if (!task.decision_id) {
      setMessage(t("Task này chưa có decision_id để phê duyệt.", "This task has no decision_id to approve."));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const executionId = await resolveExecutionId(task);
      if (!executionId) {
        setMessage(t("Chưa có kết quả để duyệt. Hãy bắt đầu xử lý ở Luồng xử lý trước.", "No result to approve yet. Start processing in the Pipeline first."));
        return;
      }
      review.mutate(
        {
          executionId,
          outcome,
          note: outcome === "approve" ? "Duyệt từ tab Phê duyệt" : "Từ chối từ tab Phê duyệt",
        },
        { onSuccess: () => setMessage(outcome === "approve" ? t("Đã duyệt.", "Approved.") : t("Đã từ chối.", "Rejected.")) },
      );
    } catch (e) {
      setMessage(e instanceof HttpError ? e.message : t("Không phê duyệt được.", "Could not approve."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-lg border border-line bg-paper/55 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_META[task.status].tone}>{STATUS_META[task.status].label}</Badge>
        <Badge tone={risk.tone}>{risk.label}</Badge>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-ink">{task.title}</h3>
      {task.description ? <p className="mt-1 line-clamp-2 text-sm text-muted">{task.description}</p> : null}
      <p className="mt-3 rounded-md bg-card p-3 text-xs leading-5 text-ink2">{risk.reason}</p>
      {task.result ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-b">{t("Xem đầu ra cần duyệt", "View output to approve")}</summary>
          <p className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-card p-3 text-xs text-ink2">
            {task.result}
          </p>
        </details>
      ) : null}
      <p className="mt-3 text-xs text-muted">
        {t("Duyệt sẽ xác nhận kết quả và cho phép quy trình đi tiếp. Từ chối sẽ giữ việc ở trạng thái không đạt.", "Approving confirms the result and lets the process continue. Rejecting keeps the work in a failed state.")}
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={busy || review.isPending || task.status === "rejected"}
          onClick={() => decide("approve")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-b px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Icon name="check" size={16} />
          {t("Duyệt", "Approve")}
        </button>
        <button
          type="button"
          disabled={busy || review.isPending || task.status === "rejected"}
          onClick={() => decide("reject")}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-bad/40 px-3 py-2 text-sm font-medium text-bad disabled:opacity-50"
        >
          <Icon name="x" size={16} />
          {t("Từ chối", "Reject")}
        </button>
      </div>
      {message ? <p className="mt-2 text-xs text-muted" role="status">{message}</p> : null}
    </article>
  );
}

async function resolveExecutionId(task: Task): Promise<string | null> {
  if (!task.decision_id) return null;

  if (task.status === "awaiting_approval" || task.status === "review") {
    const existing = await api<{ execution_id: string }>(`/api/execution/by-decision/${task.decision_id}`);
    return existing.execution_id;
  }

  const execution = await api<ExecuteResponse>("/api/execute", {
    method: "POST",
    body: JSON.stringify({ decision_id: task.decision_id }),
  });

  return execution.execution_id;
}

function FlowTile({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-card p-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-b-soft text-sm font-semibold text-b">
        {step}
      </span>
      <p className="text-sm font-medium text-ink">{title}</p>
    </div>
  );
}

function RuleCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4">
      <div className="mb-2 flex items-center gap-2 text-b">
        <Icon name="shield" size={17} />
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}
