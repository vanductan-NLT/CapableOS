"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AiIcon,
  AlertIcon,
  ArrowRightIcon,
  Badge,
  Button,
  Card,
  CommandIcon,
  EmptyRecentArt,
  EmptyState,
  ErrorState,
  Field,
  HumanIcon,
  Input,
  Reveal,
  RoutingPipeline,
  ShieldCheckIcon,
  Skeleton,
  SparkIcon,
  Textarea,
  cn,
} from "@orchestra/ui";
import { HttpError } from "@/lib/http";
import { PageHeader } from "@/components/page-header";
import { usePipeline, useTasks, type PipelineResponse } from "./hooks";
import { STATUS_META } from "./status";

export function CommandView() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Command"
        title="Giao một công việc"
        lead="Nhập bằng ngôn ngữ thường. Hệ thống phân tích → định tuyến người/AI → thực thi thật → đo lường, trong một câu lệnh."
        icon={<CommandIcon size={20} />}
      />
      <Reveal>
        <Card className="overflow-hidden bg-grad-mesh">
          <RoutingPipeline className="mx-auto max-w-2xl" />
        </Card>
      </Reveal>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <CommandInput />
        <RecentTasks />
      </div>
    </div>
  );
}

function CommandInput() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [lastResult, setLastResult] = useState<PipelineResponse | null>(null);
  const pipeline = usePipeline();

  function submit() {
    if (!title.trim() || pipeline.isPending) return;
    setLastResult(null);
    pipeline.mutate(
      { title: title.trim(), description: desc.trim() || undefined },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setTitle("");
          setDesc("");
        },
      },
    );
  }

  // ⌘/Ctrl + Enter to submit from any field (power-user affordance).
  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          onKeyDown={onKeyDown}
          className="flex flex-col gap-4"
        >
          <Field label="Việc cần làm">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tóm tắt báo cáo thị trường quý 4 (30 trang)"
              aria-label="Tiêu đề công việc"
              maxLength={200}
              autoFocus
            />
          </Field>
          <Field label="Mô tả" optional>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Bối cảnh, yêu cầu, ràng buộc…"
              rows={4}
              aria-label="Mô tả công việc"
              maxLength={4000}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={!title.trim() || pipeline.isPending}
              rightIcon={<ArrowRightIcon size={16} />}
            >
              {pipeline.isPending ? "Đang xử lý…" : "Giao việc"}
            </Button>
            <kbd className="hidden rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline">
              ⌘ + Enter
            </kbd>
            {pipeline.isError ? (
              <span className="flex items-center gap-1.5 text-sm text-bad">
                <AlertIcon size={16} /> {pipeline.error instanceof HttpError ? pipeline.error.message : "Lỗi tạo task"}
              </span>
            ) : null}
          </div>
        </form>
      </Card>

      {pipeline.isPending ? <PipelineProgress /> : null}
      {lastResult ? <PipelineResult result={lastResult} /> : null}
    </div>
  );
}

const STAGES = ["Phân tích", "Định tuyến", "Thực thi"] as const;

function PipelineProgress() {
  return (
    <Card className="overflow-hidden bg-grad-mesh">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-grad-b text-white shadow-glow-b">
          <SparkIcon size={17} />
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {STAGES.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-medium text-ink2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-b" style={{ animationDelay: `${i * 200}ms` }} />
                {s}
              </span>
              {i < STAGES.length - 1 ? <ArrowRightIcon size={13} className="text-faint" /> : null}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

const VERDICT_TONE = { ai: "a", human: "b", hybrid: "gold", escalate: "bad" } as const;

function PipelineResult({ result }: { result: PipelineResponse }) {
  const { decision, execution, error_stage, error_message } = result;

  return (
    <Reveal>
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Kết quả định tuyến</h2>
          {decision ? (
            <Badge tone={VERDICT_TONE[decision.verdict]} dot>
              {decision.verdict}
            </Badge>
          ) : null}
        </div>

        {decision ? (
          <div className="flex flex-col gap-2.5">
            <p className="text-sm leading-relaxed text-ink2">{decision.reasoning}</p>
            <div className="flex flex-wrap gap-2">
              <Metric label="Confidence" value={`${((decision.confidence ?? 0) * 100).toFixed(0)}%`} />
              <Metric label="Risk" value={decision.risk} />
              {decision.chosen.length > 0 ? <Metric label="Giao cho" value={decision.chosen.join(", ")} /> : null}
            </div>
          </div>
        ) : null}

        {execution?.kind === "ai_success" ? (
          <div className="rounded-xl border border-good/25 bg-good-soft/60 p-3.5">
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-wide text-good">
              <AiIcon size={14} /> AI đã thực thi xong
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{execution.output}</p>
            <p className="mt-2 font-mono text-[11px] text-muted">
              {execution.tokens != null ? `${execution.tokens} tokens` : null}
              {execution.ms != null ? ` · ${execution.ms}ms` : null}
            </p>
          </div>
        ) : null}

        {execution?.kind === "human_pending" ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-b-line bg-b-soft/50 p-3.5 text-sm text-ink2">
            <HumanIcon size={17} className="mt-0.5 flex-none text-b-deep" />
            <span>
              Đã giao cho người: <strong className="text-ink">{execution.assignee_id}</strong>. Đang chờ hoàn thành.
            </span>
          </div>
        ) : null}

        {decision?.verdict === "escalate" ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-bad/25 bg-bad-soft/60 p-3.5 text-sm text-bad">
            <AlertIcon size={17} className="mt-0.5 flex-none" />
            <span>Không tìm thấy ứng viên phù hợp. Cần người quản lý xem xét.</span>
          </div>
        ) : null}

        {execution?.kind === "denied" ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-bad/25 bg-bad-soft/60 p-3.5 text-sm text-bad">
            <ShieldCheckIcon size={17} className="mt-0.5 flex-none" />
            <span>Bị chặn bởi governance: {execution.reason}</span>
          </div>
        ) : null}

        {error_stage ? (
          <div className="rounded-xl border border-bad/20 bg-bad-soft/50 p-3.5">
            <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-bad">Lỗi ở bước: {error_stage}</p>
            <p className="mt-1 text-sm text-bad/85">{error_message}</p>
          </div>
        ) : null}
      </Card>
    </Reveal>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1 text-xs">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </span>
  );
}

function RecentTasks() {
  const { data, isLoading, isError, error, refetch } = useTasks();
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Gần đây</h2>
        <Link
          href="/board"
          className="flex items-center gap-1 text-xs font-medium text-b transition-colors hover:text-b-deep"
        >
          Xem Board <ArrowRightIcon size={13} />
        </Link>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[52px] w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error instanceof HttpError ? error.message : "Không tải được"} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Chưa có task nào" hint="Tạo task đầu tiên ở ô bên trái." illustration={<EmptyRecentArt />} />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.slice(0, 6).map((t) => (
            <li
              key={t.id}
              className={cn(
                "flex items-start justify-between gap-2 rounded-xl border border-line px-3 py-2.5",
                "transition-colors hover:border-b-line hover:bg-b-soft/40",
              )}
            >
              <span className="line-clamp-2 text-sm text-ink2">{t.title}</span>
              <Badge tone={STATUS_META[t.status].tone} dot>
                {STATUS_META[t.status].label}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
