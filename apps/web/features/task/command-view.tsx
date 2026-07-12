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
  CheckIcon,
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
  type Tone,
} from "@orchestra/ui";
import { HttpError } from "@/lib/http";
import { PageHeader } from "@/components/page-header";
import { useLang, useT } from "@/lib/i18n";
import { usePipeline, useTasks, type PipelineResponse } from "./hooks";
import { STATUS_META, statusLabel } from "./status";
import { verdictTone, verdictLabel, confidencePhrase, riskPhrase } from "./verdict";

// Solid, friendly verdict pill per tone (bold blue-on-white system, AA-large).
const PILL: Record<Tone, string> = {
  muted: "bg-muted text-white",
  a: "bg-a text-white",
  b: "bg-b-deep text-white",
  gold: "bg-gold text-white",
  good: "bg-good text-white",
  bad: "bg-bad text-white",
};

export function CommandView() {
  const t = useT();
  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <PageHeader
        eyebrow={t("Giao việc", "Assign")}
        title={t("Giao một việc, viết như đang nói.", "Assign work, just by writing.")}
        lead={t(
          "Bạn viết. Orchestra chọn người hay AI — và làm luôn.",
          "You write. Orchestra picks a person or AI — and gets it done.",
        )}
      />
      <CommandStage />
      <RecentTasks />
    </div>
  );
}

function CommandStage() {
  const t = useT();
  const { lang } = useLang();
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

  const suggestions: [string, string][] = [
    [t("Tóm tắt báo cáo", "Summarize a report"), t("Tóm tắt báo cáo thị trường quý 4", "Summarize the Q4 market report")],
    [t("Soạn email khách hàng", "Draft a client email"), t("Soạn email cảm ơn khách hàng lớn", "Draft a thank-you email to a key client")],
    [t("Lên kế hoạch tuần", "Plan the week"), t("Lên kế hoạch công việc tuần này", "Plan this week's work")],
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Reveal>
        {/* One elevated "stage": the blue router hero sits directly above the input. */}
        <Card elevated className="overflow-hidden p-0">
          <div className="bg-grad-aurora px-6 pb-2 pt-8 md:px-12 md:pt-10">
            <RoutingPipeline className="mx-auto max-w-xl" />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            onKeyDown={onKeyDown}
            className="flex flex-col gap-4 border-t border-line px-6 pb-8 pt-6 md:px-12"
          >
            <Field label={t("Việc cần làm", "What needs doing")}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t(
                  "VD: Tóm tắt báo cáo thị trường quý 4 (30 trang)",
                  "e.g. Summarize the Q4 market report (30 pages)",
                )}
                aria-label={t("Tiêu đề công việc", "Task title")}
                maxLength={200}
                autoFocus
              />
            </Field>
            <Field label={t("Thêm bối cảnh", "Add context")} optional={t("(tuỳ chọn)", "(optional)")}>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={t("Yêu cầu, ràng buộc, đường dẫn tài liệu…", "Requirements, constraints, document links…")}
                rows={3}
                aria-label={t("Mô tả công việc", "Task description")}
                maxLength={4000}
              />
            </Field>

            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted">{t("Gợi ý", "Try")}</span>
              {suggestions.map(([label, full]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTitle(full)}
                  className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-line/60"
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                size="md"
                disabled={!title.trim() || pipeline.isPending}
                rightIcon={<ArrowRightIcon size={18} />}
              >
                {pipeline.isPending ? t("Đang xử lý…", "Working…") : t("Giao việc", "Assign")}
              </Button>
              <kbd className="hidden rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline">
                ⌘ + Enter
              </kbd>
              {pipeline.isError ? (
                <span className="flex items-center gap-1.5 text-sm text-bad">
                  <AlertIcon size={16} />{" "}
                  {pipeline.error instanceof HttpError ? pipeline.error.message : t("Lỗi tạo task", "Failed to create task")}
                </span>
              ) : null}
            </div>
          </form>
        </Card>
      </Reveal>

      {pipeline.isPending ? <PipelineProgress /> : null}
      {lastResult ? <PipelineResult result={lastResult} lang={lang} /> : null}
    </div>
  );
}

function PipelineProgress() {
  const t = useT();
  const stages = [t("Phân tích", "Analyze"), t("Định tuyến", "Route"), t("Thực thi", "Execute")];
  return (
    <Card className="bg-grad-aurora">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-grad-cta text-white shadow-glow-brand">
          <SparkIcon size={18} />
        </span>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {stages.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-medium text-ink2">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
                {s}
              </span>
              {i < stages.length - 1 ? <ArrowRightIcon size={13} className="text-faint" /> : null}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}

/** Result — leads with a bold plain-language verdict; dev telemetry demoted. */
function PipelineResult({ result, lang }: { result: PipelineResponse; lang: "vi" | "en" }) {
  const t = useT();
  const { decision, execution, error_stage, error_message } = result;

  return (
    <Reveal>
      <Card className="flex flex-col gap-5">
        {decision ? (
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-card",
                PILL[verdictTone(decision.verdict)],
              )}
            >
              {decision.verdict === "ai" ? <AiIcon size={16} /> : <HumanIcon size={16} />}
              {verdictLabel(decision.verdict, lang)} · {confidencePhrase(decision.confidence, lang)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1.5 text-xs font-semibold text-good">
              <ShieldCheckIcon size={14} /> {riskPhrase(decision.risk, lang)}
            </span>
            {decision.reasoning ? (
              <p className="w-full max-w-prose text-[15px] leading-relaxed text-ink2">{decision.reasoning}</p>
            ) : null}
          </div>
        ) : null}

        {execution?.kind === "ai_success" ? (
          <div className="rounded-2xl border border-line bg-surface p-4 md:p-5">
            <p className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-good">
              <CheckIcon size={14} /> {t("AI đã làm xong", "AI finished")}
            </p>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{execution.output}</p>
            {execution.tokens != null || execution.ms != null ? (
              <p className="mt-3 font-mono text-[11px] text-faint">
                {execution.tokens != null ? `${execution.tokens} token` : null}
                {execution.tokens != null && execution.ms != null ? " · " : null}
                {execution.ms != null
                  ? execution.ms >= 1000
                    ? `${(execution.ms / 1000).toFixed(1)} ${t("giây", "s")}`
                    : `${execution.ms} ms`
                  : null}
              </p>
            ) : null}
          </div>
        ) : null}

        {execution?.kind === "human_pending" ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-b-line bg-b-soft/50 p-4 text-sm text-ink2">
            <HumanIcon size={18} className="mt-0.5 flex-none text-b-deep" />
            <span>
              {t("Đã giao cho", "Assigned to")} <strong className="text-ink">{execution.assignee_id}</strong>.{" "}
              {t("Đang chờ hoàn thành.", "Waiting for completion.")}
            </span>
          </div>
        ) : null}

        {decision?.verdict === "escalate" ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-bad/25 bg-bad-soft/60 p-4 text-sm text-bad">
            <AlertIcon size={18} className="mt-0.5 flex-none" />
            <span>
              {t(
                "Chưa tìm được người/AI phù hợp — cần bạn xem xét và quyết.",
                "No suitable person/AI found — this needs your review.",
              )}
            </span>
          </div>
        ) : null}

        {execution?.kind === "denied" ? (
          <div className="flex items-start gap-2.5 rounded-2xl border border-bad/25 bg-bad-soft/60 p-4 text-sm text-bad">
            <ShieldCheckIcon size={18} className="mt-0.5 flex-none" />
            <span>
              {t("Bị chặn bởi quy tắc quản trị:", "Blocked by a governance rule:")} {execution.reason}
            </span>
          </div>
        ) : null}

        {error_stage ? (
          <div className="rounded-2xl border border-bad/20 bg-bad-soft/50 p-4">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-bad">
              {t("Lỗi ở bước:", "Error at stage:")} {error_stage}
            </p>
            <p className="mt-1 text-sm text-bad/85">{error_message}</p>
          </div>
        ) : null}
      </Card>
    </Reveal>
  );
}

function RecentTasks() {
  const t = useT();
  const { lang } = useLang();
  const { data, isLoading, isError, error, refetch } = useTasks();
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-muted">
          {t("Gần đây", "Recent")}
        </h2>
        <Link
          href="/board"
          className="flex items-center gap-1 text-sm font-medium text-brand-deep transition-colors hover:text-brand"
        >
          {t("Xem tất cả", "See all")} <ArrowRightIcon size={14} />
        </Link>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[54px] w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error instanceof HttpError ? error.message : t("Không tải được", "Couldn't load")} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title={t("Chưa có việc nào", "No tasks yet")}
          hint={t("Giao việc đầu tiên ở ô phía trên.", "Assign your first task in the box above.")}
          illustration={<EmptyRecentArt />}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.slice(0, 6).map((task) => (
            <li
              key={task.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3",
                "transition-colors hover:border-brand-line hover:bg-brand-soft/50",
              )}
            >
              <span className="line-clamp-1 text-[15px] text-ink2">{task.title}</span>
              <Badge tone={STATUS_META[task.status].tone} dot>
                {statusLabel(task.status, lang)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
