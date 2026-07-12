"use client";

import type { Agent, Task } from "@orchestra/contracts";
import { useMemo, useState } from "react";
import { Badge, Card, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { useT } from "@/lib/i18n";
import { useAgents, useRealtimeTasks, useTasks, useUpdateTask } from "./hooks";
import { STATUS_META, statusLabel } from "./status";

const WORK_STATUSES = new Set(["awaiting_human", "review", "routed", "executing"]);

export function MyWorkView() {
  const t = useT();
  const tasks = useTasks();
  const agents = useAgents();
  useRealtimeTasks();

  const agentById = useMemo(
    () => new Map((agents.data ?? []).map((agent) => [agent.id, agent])),
    [agents.data],
  );

  if (tasks.isLoading || agents.isLoading) {
    return (
      <div className="grid gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    );
  }

  if (tasks.isError) {
    return (
      <ErrorState
        message={tasks.error instanceof HttpError ? tasks.error.message : t("Không tải được việc của tôi", "Couldn't load my work")}
        onRetry={tasks.refetch}
      />
    );
  }

  const work = (tasks.data ?? []).filter((task) => WORK_STATUSES.has(task.status));
  const humanWork = work.filter((task) => task.status === "awaiting_human" || task.status === "review");
  const automatedWork = work.filter((task) => task.status === "routed" || task.status === "executing");
  const visibleAutomatedWork = automatedWork.slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="grid gap-2 sm:grid-cols-3" aria-label={t("Vai trò của con người", "The role of people")}>
        <RoleTile title={t("Chịu trách nhiệm", "Accountability")} body={t("Việc rủi ro hoặc cần bối cảnh được đưa về người xử lý.", "Risky work or work needing context is routed to people.")} />
        <RoleTile title="Review AI" body={t("AI có thể làm nhanh, nhưng đầu ra quan trọng cần người xác nhận.", "AI can work fast, but important output needs human confirmation.")} />
        <RoleTile title={t("Tạo dữ liệu đo lường", "Generate measurement data")} body={t("Kết quả và feedback giúp hệ thống chọn tốt hơn lần sau.", "Results and feedback help the system choose better next time.")} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label={t("Tổng quan việc cá nhân", "Personal work overview")}>
        <WorkMetric label={t("Cần bạn xử lý", "Needs your action")} value={humanWork.length} color="bg-b" />
        <WorkMetric label={t("Đang tự động xử lý", "Being handled automatically")} value={automatedWork.length} color="bg-a" />
        <WorkMetric label={t("Cần review", "Needs review")} value={work.filter((task) => task.status === "review").length} color="bg-gold" />
      </section>

      {work.length === 0 ? (
        <EmptyState
          icon={<Icon name="inbox" size={28} />}
          title={t("Chưa có việc cần bạn xử lý", "No work needs your action yet")}
          hint={t("Khi hệ thống quyết định cần con người làm hoặc review đầu ra AI, task sẽ xuất hiện ở đây.", "When the system decides a human should act or review AI output, tasks will appear here.")}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-3" aria-label={t("Việc cần làm", "Work to do")}>
            <SectionHeader title={t("Cần bạn xử lý", "Needs your action")} count={humanWork.length} />
            {humanWork.length ? (
              humanWork.map((task) => (
                <WorkCard key={task.id} task={task} agent={task.assignee_id ? agentById.get(task.assignee_id) : undefined} />
              ))
            ) : (
              <EmptyState title={t("Không có việc thủ công", "No manual work")} hint={t("Các việc đang chạy hiện chưa cần bạn can thiệp.", "Running work currently needs no intervention from you.")} />
            )}
          </section>

          <section className="space-y-3" aria-label={t("Việc hệ thống đang tự động xử lý", "Work the system is handling automatically")}>
            <SectionHeader title={t("Đang tự động xử lý", "Being handled automatically")} count={automatedWork.length} />
            {automatedWork.length ? (
              <>
              {visibleAutomatedWork.map((task) => (
                <AssistiveCard key={task.id} task={task} agent={task.assignee_id ? agentById.get(task.assignee_id) : undefined} />
              ))}
              {automatedWork.length > visibleAutomatedWork.length ? (
                <div className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-xs text-muted">
                  {t("Còn", "")} {automatedWork.length - visibleAutomatedWork.length} {t("việc đang theo dõi trong Luồng xử lý", "more tasks being tracked in the Workflow")}
                </div>
              ) : null}
              </>
            ) : (
              <EmptyState title={t("Không có việc tự động", "No automated work")} hint={t("Giao việc mới để hệ thống chọn AI hoặc đội người + AI.", "Assign new work so the system can pick AI or a human + AI team.")} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function RoleTile({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{body}</p>
    </div>
  );
}

function WorkMetric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <span className="font-mono text-xs text-muted">{count}</span>
    </div>
  );
}

function WorkCard({ task, agent }: { task: Task; agent?: Agent }) {
  const t = useT();
  const update = useUpdateTask();
  const [result, setResult] = useState(task.result ?? "");
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  function complete() {
    update.mutate(
      { id: task.id, patch: { status: "done", result: result.trim() } },
      { onSuccess: () => setLocalStatus(t("Đã nộp kết quả.", "Result submitted.")) },
    );
  }

  return (
    <article className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_META[task.status].tone}>{statusLabel(task.status, t)}</Badge>
        <Badge tone={agent?.type === "ai" ? "a" : "b"}>{agent ? agent.name : t("Chưa rõ người xử lý", "Assignee unknown")}</Badge>
      </div>
      <h3 className="mt-3 text-sm font-semibold">{task.title}</h3>
      {task.description ? <p className="mt-1 text-sm leading-6 text-muted">{task.description}</p> : null}
      <label className="mt-4 block text-xs font-medium text-muted" htmlFor={`result-${task.id}`}>
        {t("Kết quả bàn giao", "Handoff result")}
      </label>
      <textarea
        id={`result-${task.id}`}
        value={result}
        onChange={(e) => setResult(e.target.value)}
        rows={5}
        className="mt-1 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-b"
        placeholder={t("Nhập kết quả, link tài liệu, ghi chú bàn giao...", "Enter the result, document links, handoff notes...")}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!result.trim() || update.isPending}
          onClick={complete}
          className="inline-flex items-center gap-1.5 rounded-lg bg-b px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Icon name="check" size={16} />
          {t("Nộp & hoàn thành", "Submit & complete")}
        </button>
        {update.isError ? (
          <span className="text-xs text-bad">
            {update.error instanceof HttpError ? update.error.message : t("Không cập nhật được task", "Couldn't update the task")}
          </span>
        ) : null}
        {localStatus ? <span className="text-xs text-good">{localStatus}</span> : null}
      </div>
    </article>
  );
}

function AssistiveCard({ task, agent }: { task: Task; agent?: Agent }) {
  const t = useT();
  return (
    <article className="rounded-xl border border-line bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS_META[task.status].tone}>{statusLabel(task.status, t)}</Badge>
        <Badge tone={agent?.type === "ai" ? "a" : "b"}>{agent ? agent.name : t("Đã có quyết định, chờ chạy", "Decided, waiting to run")}</Badge>
      </div>
      <h3 className="mt-3 text-sm font-semibold">{task.title}</h3>
      <div className="mt-3 grid gap-2">
        <ProgressLine label={t("Đã chọn nguồn lực", "Resource selected")} done />
        <ProgressLine label={task.status === "executing" ? t("Đang xử lý", "Processing") : t("Chờ bấm bắt đầu ở Luồng xử lý", "Waiting to be started in the Workflow")} done={task.status === "executing"} />
        <ProgressLine label={t("Chỉ cần bạn can thiệp nếu hệ thống chuyển sang cần duyệt hoặc cần người làm", "You only need to step in if the system switches to needing approval or a human")} done={false} />
      </div>
    </article>
  );
}

function ProgressLine({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${done ? "bg-b text-white" : "bg-line text-muted"}`}>
        {done ? <Icon name="check" size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      </span>
      <span className={done ? "text-ink2" : "text-muted"}>{label}</span>
    </div>
  );
}
