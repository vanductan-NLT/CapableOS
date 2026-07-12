"use client";

import type { AllocationSplit } from "@orchestra/contracts";
import { Badge, Card, EmptyState, ErrorState, EstimatedTag, Skeleton } from "@/components/ui";
import type { SideStat } from "@/lib/metrics";
import { HttpError } from "@/lib/http";
import { useT } from "@/lib/i18n";
import { useBreakdown, useFlow, useMetrics } from "./hooks";

type Translate = (vi: string, en: string) => string;

const dur = (ms: number, t: Translate) => {
  if (!ms || ms < 0) return "—";
  const m = ms / 60000;
  if (m < 60) return `${Math.round(m)} ${t("phút", "min")}`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)} ${t("giờ", "h")}`;
  return `${(h / 24).toFixed(1)} ${t("ngày", "days")}`;
};

// Validated categorical palette (dataviz skill: CVD ΔE≥20; dark purple relieved by labels+table).
const VERDICTS = [
  { key: "human", label: { vi: "Người", en: "Human" }, color: "#0E9C8B" },
  { key: "ai", label: { vi: "AI", en: "AI" }, color: "#5A4BD4" },
  { key: "hybrid", label: { vi: "Người + AI", en: "Human + AI" }, color: "#B27916" },
  { key: "escalate", label: { vi: "Cần quản lý xem", en: "Needs manager review" }, color: "#BB4C3B" },
] as const satisfies readonly { key: keyof AllocationSplit; label: { vi: string; en: string }; color: string }[];

const pct = (v: number) => `${Math.round(v * 100)}%`;
const num = (v: number) => new Intl.NumberFormat("vi-VN").format(v);

export function DashboardView() {
  const t = useT();
  const m = useMetrics();
  const b = useBreakdown();
  const flow = useFlow();

  if (m.isLoading || b.isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }
  if (m.isError) {
    return (
      <ErrorState
        message={m.error instanceof HttpError ? m.error.message : t("Không tải được metrics", "Couldn't load metrics")}
        onRetry={() => m.refetch()}
      />
    );
  }

  const metrics = m.data!;
  const total = Object.values(metrics.split).reduce((a, c) => a + c, 0);
  const feedbackCount = (b.data?.human.feedbackCount ?? 0) + (b.data?.ai.feedbackCount ?? 0);

  if (total === 0 && feedbackCount === 0) {
    return (
      <EmptyState
        title={t("Chưa có dữ liệu đo lường", "No measurement data yet")}
        hint={t(
          "Khi task được định tuyến (domain A) và có feedback, các chỉ số sẽ xuất hiện ở đây.",
          "Once tasks are routed (domain A) and feedback arrives, metrics will show up here.",
        )}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="KPI" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={t("Tự động hoá", "Automation")} value={pct(metrics.automation)} hint={t("AI + Hybrid / tổng", "AI + Hybrid / total")} />
        <StatTile label={t("Chi phí tiết kiệm", "Cost saved")} value={num(metrics.cost_saving)} estimated />
        <StatTile label={t("Thời gian TB / lần", "Avg time / run")} value={`${num(metrics.avg_ms)} ms`} />
        <StatTile
          label={t("Chất lượng", "Quality")}
          value={feedbackCount ? pct(metrics.quality) : "—"}
          hint={feedbackCount ? `${feedbackCount} ${t("đánh giá", "reviews")}` : t("chưa có đánh giá", "no reviews yet")}
        />
      </section>

      <BehaviorHeatmap
        automation={metrics.automation}
        quality={feedbackCount ? metrics.quality : null}
        waiting={metrics.split.escalate + metrics.split.hybrid}
        total={total}
      />

      <ExecutiveScorecard metrics={metrics} feedbackCount={feedbackCount} />

      {flow.data && flow.data.completed > 0 ? (
        <section aria-label="Flow (DORA)" className="grid gap-3 sm:grid-cols-3">
          <StatTile label={t("Việc hoàn thành", "Completed")} value={num(flow.data.completed)} hint={t("tổng luỹ kế", "cumulative total")} />
          <StatTile label={t("Thời gian hoàn thành (P50)", "Completion time (P50)")} value={dur(flow.data.leadTimeMsP50, t)} hint={t("tạo → xong, trung vị", "created → done, median")} />
          <StatTile
            label={`${t("Sản lượng", "Throughput")} ${flow.data.windowDays} ${t("ngày", "days")}`}
            value={num(flow.data.throughput)}
            hint={t("việc xong gần đây", "recently completed")}
          />
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Allocation split={metrics.split} total={total} />
        {b.data ? <Breakdown human={b.data.human} ai={b.data.ai} /> : null}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  estimated,
}: {
  label: string;
  value: string;
  hint?: string;
  estimated?: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        {estimated ? <EstimatedTag /> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}

function Allocation({ split, total }: { split: AllocationSplit; total: number }) {
  const t = useT();
  const max = Math.max(1, ...VERDICTS.map((v) => split[v.key]));
  return (
    <Card>
      <h2 className="text-sm font-semibold">{t("Phân bổ quyết định", "Decision allocation")}</h2>
      <p className="mb-3 text-xs text-muted">
        {t("Người, AI, đội kết hợp và việc cần quản lý", "People, AI, hybrid teams and work needing management")} ({total} {t("quyết định", "decisions")})
      </p>
      <ul className="flex flex-col gap-2.5" role="list">
        {VERDICTS.map((v) => {
          const count = split[v.key];
          const label = t(v.label.vi, v.label.en);
          return (
            <li key={v.key} className="grid grid-cols-[80px_1fr_auto] items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: v.color }} aria-hidden />
                {label}
              </span>
              <span className="h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={`${label}: ${count}`}>
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${(count / max) * 100}%`, background: v.color, minWidth: count ? 4 : 0 }}
                />
              </span>
              <span className="w-10 text-right font-mono text-sm tabular-nums">{count}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Breakdown({ human, ai }: { human: SideStat; ai: SideStat }) {
  const t = useT();
  const rows: { label: string; icon: string; s: SideStat }[] = [
    { label: t("Người", "Human"), icon: t("Người", "Human"), s: human },
    { label: "AI", icon: "AI", s: ai },
  ];
  return (
    <Card>
      <h2 className="text-sm font-semibold">{t("So sánh hiệu suất người và AI", "Human vs AI performance")}</h2>
      <p className="mt-1 text-xs text-muted">{t("Cùng một thước đo: số việc, thời gian, chi phí và chất lượng sau feedback.", "One shared measure: task count, time, cost and post-feedback quality.")}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-2 font-medium">{t("Bên", "Side")}</th>
              <th className="py-2 pr-2 font-medium">{t("Việc", "Tasks")}</th>
              <th className="py-2 pr-2 font-medium">{t("Phút TB", "Avg min")}</th>
              <th className="py-2 pr-2 font-medium">{t("Chi phí", "Cost")}</th>
              <th className="py-2 font-medium">{t("Chất lượng", "Quality")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, icon, s }) => (
              <tr key={label} className="border-b border-line/60">
                <td className="py-2.5 pr-2">
                  <span className="flex items-center gap-1.5">
                    <span className="rounded bg-line/60 px-1.5 py-0.5 text-[10px] font-medium">{icon}</span> {label}
                    {s.estimated ? <EstimatedTag /> : null}
                  </span>
                </td>
                <td className="py-2.5 pr-2 tabular-nums">{s.tasks}</td>
                <td className="py-2.5 pr-2 tabular-nums">{s.tasks ? num(s.avgMinutes) : "—"}</td>
                <td className="py-2.5 pr-2 tabular-nums">{s.tasks ? num(s.totalCost) : "—"}</td>
                <td className="py-2.5 tabular-nums">
                  {s.feedbackCount ? (
                    <Badge tone={s.quality >= 0.6 ? "good" : "bad"}>{pct(s.quality)}</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted">{t("Chi phí/thời gian của người là ESTIMATED; của AI đo từ log thực thi.", "Human cost/time is ESTIMATED; AI is measured from execution logs.")}</p>
    </Card>
  );
}

function ExecutiveScorecard({ metrics, feedbackCount }: { metrics: { automation: number; quality: number; split: AllocationSplit }; feedbackCount: number }) {
  const t = useT();
  const rows = [
    {
      label: t("Tốc độ", "Speed"),
      value: pct(metrics.automation),
      note: t("Tỷ lệ việc có thể giao cho AI hoặc đội người + AI.", "Share of work that can go to AI or human + AI teams."),
      tone: metrics.automation >= 0.6 ? "good" : "gold",
    },
    {
      label: t("Chất lượng", "Quality"),
      value: feedbackCount ? pct(metrics.quality) : t("Chưa đủ dữ liệu", "Not enough data"),
      note: feedbackCount ? t("Dựa trên feedback sau khi hoàn thành.", "Based on post-completion feedback.") : t("Cần thêm đánh giá ở Luồng xử lý.", "Needs more reviews in the Workflow."),
      tone: feedbackCount && metrics.quality >= 0.75 ? "good" : "gold",
    },
    {
      label: "Governance",
      value: `${metrics.split.escalate + metrics.split.hybrid}`,
      note: t("Việc cần quản lý hoặc người kiểm tra trước khi hoàn tất.", "Work needing management or a human check before completion."),
      tone: metrics.split.escalate > 0 ? "gold" : "good",
    },
  ] as const;

  return (
    <Card>
      <h2 className="text-sm font-semibold">{t("Scorecard cho người ra quyết định", "Scorecard for decision-makers")}</h2>
      <p className="mt-1 text-xs text-muted">{t("Tóm tắt trực tiếp theo mục tiêu đề bài: tốc độ, chất lượng, kiểm soát.", "A direct summary against the goals: speed, quality, control.")}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-line bg-paper/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{row.label}</p>
              <Badge tone={row.tone}>{row.tone === "good" ? t("ổn", "OK") : t("cần chú ý", "needs attention")}</Badge>
            </div>
            <p className="mt-2 text-2xl font-semibold">{row.value}</p>
            <p className="mt-1 text-xs leading-5 text-muted">{row.note}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BehaviorHeatmap({
  automation,
  quality,
  waiting,
  total,
}: {
  automation: number;
  quality: number | null;
  waiting: number;
  total: number;
}) {
  const t = useT();
  const cells = [
    {
      label: t("Tin AI để giao việc", "Trust AI to take work"),
      value: automation,
      detail: t("Tỷ lệ việc AI/hybrid có thể nhận", "Share of work AI/hybrid can take"),
    },
    {
      label: t("Việc cần người kiểm tra", "Work needing a human check"),
      value: total ? waiting / total : 0,
      detail: t("AI không nên tự hoàn tất", "AI shouldn't finish on its own"),
      inverse: true,
    },
    {
      label: t("Chất lượng sau review", "Quality after review"),
      value: quality ?? 0,
      detail: quality == null ? t("Chưa đủ feedback", "Not enough feedback") : t("Tỷ lệ đạt từ phản hồi", "Pass rate from feedback"),
    },
    {
      label: t("Tốc độ ra quyết định", "Decision speed"),
      value: Math.min(1, automation + 0.15),
      detail: t("Ước lượng từ split hiện tại", "Estimated from the current split"),
    },
  ];

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{t("Bản đồ nhiệt hành vi vận hành", "Operational behavior heatmap")}</h2>
          <p className="mt-1 text-xs text-muted">{t("Đọc nhanh nơi đội ngũ tin hệ thống, kẹt phê duyệt hoặc thiếu dữ liệu.", "A quick read on where the team trusts the system, gets stuck on approvals or lacks data.")}</p>
        </div>
        <EstimatedTag />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {cells.map((cell) => (
          <HeatCell key={cell.label} {...cell} />
        ))}
      </div>
    </Card>
  );
}

function HeatCell({
  label,
  value,
  detail,
  inverse,
}: {
  label: string;
  value: number;
  detail: string;
  inverse?: boolean;
}) {
  const normalized = Math.max(0, Math.min(1, value));
  const score = inverse ? 1 - normalized : normalized;
  const background =
    score >= 0.72
      ? "bg-[color:#DDF3E8] text-good dark:bg-good/15"
      : score >= 0.45
        ? "bg-[color:#F7EED8] text-gold dark:bg-gold/15"
        : "bg-[color:#F7E7E3] text-bad dark:bg-bad/15";
  return (
    <div className={`rounded-lg border border-line p-3 ${background}`}>
      <p className="text-xs font-medium text-ink">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{pct(normalized)}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}
