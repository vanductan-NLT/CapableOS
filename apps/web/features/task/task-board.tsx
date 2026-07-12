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
  EmptyBoardArt,
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
import { PageHeader } from "@/components/page-header";
import { useLang, useT, type Lang } from "@/lib/i18n";
import { useSubmitFeedback } from "@/features/dashboard/hooks";
import { useAgents, useRealtimeTasks, useTasks } from "./hooks";
import { BOARD_COLUMNS, STATUS_META, statusLabel } from "./status";
import { confidencePhrase, verdictTone, verdictWho } from "./verdict";
import { useRouteDecision } from "@/lib/queries/use-route-decision";
import { useExecute } from "@/lib/queries/use-execute";
import { useReview } from "@/lib/queries/use-review";

// Column accent dot — a hairline tie between each Kanban column and its status tone.
const RAIL: Record<Tone, string> = {
  muted: "bg-muted",
  a: "bg-a",
  b: "bg-b",
  gold: "bg-gold",
  good: "bg-good",
  bad: "bg-bad",
};

// Tone-tinted count pill — the calm signal that keeps the two blue-ish columns from
// reading the same (per critique). One quiet tint per status, no competing systems.
const COUNT_TINT: Record<Tone, string> = {
  muted: "bg-surface text-muted",
  a: "bg-a-soft text-a",
  b: "bg-b-soft text-b-deep",
  gold: "bg-gold-soft text-gold",
  good: "bg-good-soft text-good",
  bad: "bg-bad-soft text-bad",
};

// Purple-tinted button for AI/decision actions (secondary hierarchy, AA-safe both themes).
const AI_BTN = "w-full border border-a-line bg-a-soft text-a hover:bg-a/10";

// Telemetry whisper: keep the number, speak human — seconds once it crosses a second.
function formatDuration(ms: number, secondsLabel: string): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)} ${secondsLabel}` : `${ms} ms`;
}

export function TaskBoard() {
  const t = useT();
  const { lang } = useLang();
  const { data: tasks, isLoading, isError, error, refetch } = useTasks();
  const { data: agents } = useAgents();
  useRealtimeTasks();

  const agentById = new Map((agents ?? []).map((a) => [a.id, a]));

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <PageHeader
        eyebrow={t("Bảng việc", "Board")}
        title={t("Ai đang làm gì", "Who's doing what")}
        lead={t(
          "Bảng công việc chung — cập nhật tức thì.",
          "One shared board — updated in real time.",
        )}
        accent="b"
        actions={
          <Badge tone="b" dot>
            {t("Trực tiếp", "Live")}
          </Badge>
        }
      />

      {isLoading ? (
        <div className="grid grid-flow-col gap-6 overflow-x-auto pb-2">
          {BOARD_COLUMNS.slice(0, 5).map((c) => (
            <Skeleton key={c} className="h-52 w-72" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof HttpError ? error.message : t("Không tải được bảng việc", "Couldn't load the board")}
          onRetry={refetch}
        />
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState
          title={t("Bảng việc trống", "Board is empty")}
          hint={t(
            "Tạo việc ở màn Giao việc để nó xuất hiện ở đây.",
            "Assign a task on the Command screen and it will appear here.",
          )}
          illustration={<EmptyBoardArt />}
        />
      ) : (
        <BoardColumns tasks={tasks} agentById={agentById} lang={lang} emptyLabel={t("Trống", "Empty")} />
      )}
    </div>
  );
}

/** The horizontal-scroll kanban — realtime columns by status. Airy, hairline headers. */
function BoardColumns({
  tasks,
  agentById,
  lang,
  emptyLabel,
}: {
  tasks: Task[];
  agentById: Map<string, Agent>;
  lang: Lang;
  emptyLabel: string;
}) {
  const byStatus = new Map(BOARD_COLUMNS.map((s) => [s, [] as Task[]]));
  for (const t of tasks) byStatus.get(t.status)?.push(t);
  const visible = BOARD_COLUMNS.filter((s, i) => i === 0 || (byStatus.get(s)?.length ?? 0) > 0);

  return (
    <div className="grid auto-cols-[minmax(288px,1fr)] grid-flow-col gap-6 overflow-x-auto pb-4 md:gap-8">
      {visible.map((status) => {
        const meta = STATUS_META[status];
        const list = byStatus.get(status) ?? [];
        const label = statusLabel(status, lang);
        return (
          <section key={status} aria-label={label} className="min-w-[288px]">
            <div className="mb-4 flex items-center gap-2.5 border-b border-line px-1 pb-3">
              <span className={cn("h-2 w-2 flex-none rounded-full", RAIL[meta.tone])} aria-hidden />
              <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-muted">
                {label}
              </span>
              <span
                className={cn(
                  "ml-auto inline-flex min-w-[1.5rem] justify-center rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
                  COUNT_TINT[meta.tone],
                )}
              >
                {list.length}
              </span>
            </div>
            <Stagger className="flex min-h-[80px] flex-col gap-4">
              {list.length === 0 ? (
                <p className="px-1 py-8 text-center text-xs text-faint">{emptyLabel}</p>
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
  const t = useT();
  return (
    <Lift>
      <Card className="flex flex-col gap-3 rounded-2xl">
        <p className="text-body-lg font-semibold leading-snug text-ink">{task.title}</p>
        {task.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">{task.description}</p>
        ) : null}
        <div className="flex items-center gap-2">
          {agent ? (
            <span className="flex items-center gap-1.5">
              <AgentAvatar type={agent.type} size="sm" />
              <span className="text-xs font-medium text-ink2">{agent.name}</span>
            </span>
          ) : (
            <span className="text-xs text-faint">{t("Chưa gán", "Unassigned")}</span>
          )}
        </div>

        {task.status === "created" ? <RouteAction taskId={task.id} /> : null}
        {task.status === "routed" && task.decision_id ? <ExecuteAction decisionId={task.decision_id} /> : null}
        {task.status === "awaiting_approval" && task.decision_id ? (
          <ReviewAction decisionId={task.decision_id} />
        ) : null}

        {task.result ? (
          <details className="group rounded-xl border border-line bg-surface px-3 py-2">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-b">
              <ChevronRightIcon size={13} className="transition-transform group-open:rotate-90" />
              {t("Xem kết quả", "View result")}
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink2">{task.result}</p>
          </details>
        ) : null}

        {task.status === "done" ? <FeedbackControl taskId={task.id} /> : null}
      </Card>
    </Lift>
  );
}

function RouteAction({ taskId }: { taskId: string }) {
  const t = useT();
  const { lang } = useLang();
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
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      {!decision && !route.isError ? (
        <Button
          size="sm"
          variant="secondary"
          disabled={isPending}
          leftIcon={<SparkIcon size={14} />}
          className={AI_BTN}
          onClick={handleRouteAndExecute}
        >
          {isPending ? t("Đang xử lý…", "Working…") : t("Để Orchestra lo", "Let Orchestra handle it")}
        </Button>
      ) : null}
      {route.isError ? (
        <p className="text-xs text-bad">
          {route.error instanceof HttpError ? route.error.message : t("Lỗi định tuyến", "Routing failed")}
        </p>
      ) : null}
      {decision ? (
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
          <Badge tone={verdictTone(decision.verdict)} dot>
            {verdictWho(decision.verdict, lang)}
          </Badge>
          <span className="text-xs text-muted">{confidencePhrase(decision.confidence, lang)}</span>
        </div>
      ) : null}
      {execResult?.kind === "ai_success" ? (
        <p className="flex items-center gap-1.5 text-xs text-good">
          <CheckIcon size={13} /> {t("AI đã xong", "AI finished")}
          <span className="font-mono text-[11px] text-faint">{formatDuration(execResult.ms, t("giây", "s"))}</span>
        </p>
      ) : null}
      {execute.isError ? <p className="text-xs text-bad">{t("Lỗi thực thi", "Execution failed")}</p> : null}
    </div>
  );
}

function ExecuteAction({ decisionId }: { decisionId: string }) {
  const t = useT();
  const execute = useExecute();
  const [result, setResult] = useState<ExecuteResponse | null>(null);

  if (result) {
    return (
      <div className="border-t border-line pt-3 text-xs">
        {result.kind === "ai_success" ? (
          <p className="flex items-center gap-1.5 text-good">
            <CheckIcon size={13} /> {t("AI xong", "AI done")}
            <span className="font-mono text-[11px] text-faint">{formatDuration(result.ms, t("giây", "s"))}</span>
          </p>
        ) : null}
        {result.kind === "human_pending" ? (
          <p className="text-muted">{t("Đã giao cho người", "Assigned to a person")}</p>
        ) : null}
        {result.kind === "denied" ? (
          <p className="text-bad">
            {t("Bị chặn:", "Blocked:")} {result.reason}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-t border-line pt-3">
      <Button
        size="sm"
        variant="secondary"
        disabled={execute.isPending}
        leftIcon={<SparkIcon size={14} />}
        className={AI_BTN}
        onClick={() => execute.mutate({ decisionId }, { onSuccess: (r) => setResult(r) })}
      >
        {execute.isPending ? t("Đang thực thi…", "Executing…") : t("Thực thi", "Execute")}
      </Button>
      {execute.isError ? <p className="mt-1 text-xs text-bad">{t("Lỗi thực thi", "Execution failed")}</p> : null}
    </div>
  );
}

function ReviewAction({ decisionId }: { decisionId: string }) {
  const t = useT();
  const review = useReview();
  const [done, setDone] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <p className="flex items-center gap-1.5 border-t border-line pt-3 text-xs text-good">
        <CheckIcon size={14} /> {t("Đã duyệt", "Approved")}
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
    <div className="flex flex-col gap-2 border-t border-line pt-3">
      <p className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-muted">
        {t("AI đã xong — cần duyệt", "AI finished — needs approval")}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          leftIcon={<CheckIcon size={14} />}
          className="flex-1 border-good/30 bg-good-soft text-good hover:bg-good/15"
          onClick={() => loadAndReview("approve")}
        >
          {t("Duyệt", "Approve")}
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={busy}
          leftIcon={<CloseIcon size={14} />}
          className="flex-1"
          onClick={() => loadAndReview("reject")}
        >
          {t("Từ chối", "Reject")}
        </Button>
      </div>
      {review.isError ? <p className="text-xs text-bad">{t("Lỗi duyệt", "Approval failed")}</p> : null}
    </div>
  );
}

function FeedbackControl({ taskId }: { taskId: string }) {
  const t = useT();
  const fb = useSubmitFeedback();
  const [done, setDone] = useState<null | number>(null);

  if (done !== null) {
    return (
      <p className="flex items-center gap-1.5 border-t border-line pt-3 text-xs text-good" role="status">
        <CheckIcon size={14} /> {t("Đã đánh giá", "Rated")} · {t("trust hiện tại", "current trust")} {done}
      </p>
    );
  }
  return (
    <div className="flex items-center gap-2 border-t border-line pt-3">
      <span className="text-xs text-muted">{t("Đánh giá:", "Rate:")}</span>
      <Button
        size="sm"
        variant="secondary"
        disabled={fb.isPending}
        leftIcon={<CheckIcon size={14} />}
        className="border-good/30 bg-good-soft text-good hover:bg-good/15"
        onClick={() => fb.mutate({ task_id: taskId, rating: "pass" }, { onSuccess: (r) => setDone(r.new_trust) })}
        aria-label={t("Đánh giá đạt (trust +1)", "Rate as pass (trust +1)")}
      >
        {t("Đạt", "Pass")}
      </Button>
      <Button
        size="sm"
        variant="danger"
        disabled={fb.isPending}
        leftIcon={<CloseIcon size={14} />}
        onClick={() => fb.mutate({ task_id: taskId, rating: "fail" }, { onSuccess: (r) => setDone(r.new_trust) })}
        aria-label={t("Đánh giá không đạt (trust −1)", "Rate as fail (trust −1)")}
      >
        {t("Không", "Fail")}
      </Button>
    </div>
  );
}
