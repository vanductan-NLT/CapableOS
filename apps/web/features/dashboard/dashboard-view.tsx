"use client";

import type { AllocationSplit } from "@orchestra/contracts";
import {
  ActivityIcon,
  AgentAvatar,
  Badge,
  BoltIcon,
  Card,
  ClockIcon,
  CountUp,
  EmptyDashboardArt,
  EmptyState,
  ErrorState,
  EstimatedTag,
  GaugeIcon,
  LayersIcon,
  Meter,
  Reveal,
  Skeleton,
  StatTile,
  WalletIcon,
} from "@orchestra/ui";
import type { SideStat } from "@/lib/metrics";
import { HttpError } from "@/lib/http";
import { PageHeader } from "@/components/page-header";
import { useT } from "@/lib/i18n";
import { useBreakdown, useFlow, useMetrics } from "./hooks";

const dur = (ms: number) => {
  if (!ms || ms < 0) return "—";
  const m = ms / 60000;
  if (m < 60) return `${Math.round(m)} phút`;
  const h = m / 60;
  if (h < 24) return `${h.toFixed(1)} giờ`;
  return `${(h / 24).toFixed(1)} ngày`;
};

// Validated categorical palette (dataviz skill: CVD ΔE≥20; dark purple relieved by labels+table).
// Reserved to the two semantic viz blocks (Allocation + Người-vs-AI); the rest of the
// screen stays blue + neutral so meaning — not decoration — carries the colour.
const VERDICTS = [
  { key: "human", label: "Người", color: "#0E9C8B" },
  { key: "ai", label: "AI", color: "#5A4BD4" },
  { key: "hybrid", label: "Hybrid", color: "#B27916" },
  { key: "escalate", label: "Escalate", color: "#BB4C3B" },
] as const satisfies readonly { key: keyof AllocationSplit; label: string; color: string }[];

const pct = (v: number) => `${Math.round(v * 100)}%`;
const num = (v: number) => new Intl.NumberFormat("vi-VN").format(v);

export function DashboardView() {
  const t = useT();
  const m = useMetrics();
  const b = useBreakdown();
  const flow = useFlow();

  // Editorial masthead — shown across every state so the screen reads as one family.
  const header = (
    <PageHeader
      eyebrow={t("Năng suất", "Performance")}
      title={t("Người & AI, cùng một thước đo", "People & AI, one scoreboard")}
      lead={t(
        "Năng suất, chi phí và chất lượng trên một bảng chung.",
        "Productivity, cost and quality on one board.",
      )}
    />
  );

  if (m.isLoading || b.isLoading) {
    return (
      <div className="flex flex-col gap-10 md:gap-12">
        {header}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }
  if (m.isError) {
    return (
      <div className="flex flex-col gap-10 md:gap-12">
        {header}
        <ErrorState
          message={m.error instanceof HttpError ? m.error.message : t("Không tải được số liệu", "Couldn't load metrics")}
          onRetry={() => m.refetch()}
        />
      </div>
    );
  }

  const metrics = m.data!;
  const total = Object.values(metrics.split).reduce((a, c) => a + c, 0);
  const feedbackCount = (b.data?.human.feedbackCount ?? 0) + (b.data?.ai.feedbackCount ?? 0);

  if (total === 0 && feedbackCount === 0) {
    return (
      <div className="flex flex-col gap-10 md:gap-12">
        {header}
        <EmptyState
          title={t("Chưa có dữ liệu đo lường", "No measurements yet")}
          hint={t(
            "Khi task được định tuyến và có feedback, các chỉ số sẽ xuất hiện ở đây.",
            "Once tasks are routed and rated, the metrics will appear here.",
          )}
          illustration={<EmptyDashboardArt />}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      {header}
      <div className="flex flex-col gap-8 md:gap-10">
        <Reveal>
          <section aria-label={t("Chỉ số vận hành", "Operating metrics")} className="flex flex-col gap-4">
            <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-muted">
              {t("Chỉ số vận hành", "Operating metrics")}
            </span>
            <div className="grid gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
              <StatTile
                label={t("Tự động hoá", "Automation")}
                value={<CountUp value={metrics.automation * 100} format={(v) => `${Math.round(v)}%`} />}
                hint={t("AI + Hybrid / tổng", "AI + Hybrid / total")}
                icon={<BoltIcon size={17} />}
                accent="brand"
              />
              <StatTile
                label={t("Chi phí tiết kiệm", "Cost saved")}
                value={<CountUp value={metrics.cost_saving} format={(v) => num(Math.round(v))} />}
                icon={<WalletIcon size={17} />}
                accent="good"
                estimated
              />
              <StatTile
                label={t("Thời gian TB / lần", "Avg time / run")}
                value={
                  <CountUp
                    value={metrics.avg_ms}
                    format={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)} ${t("giây", "s")}` : `${num(Math.round(v))} ms`
                    }
                  />
                }
                icon={<ClockIcon size={17} />}
                accent="brand"
              />
              <StatTile
                label={t("Chất lượng", "Quality")}
                value={
                  feedbackCount ? (
                    <CountUp value={metrics.quality * 100} format={(v) => `${Math.round(v)}%`} />
                  ) : (
                    "—"
                  )
                }
                hint={
                  feedbackCount
                    ? t(`${feedbackCount} đánh giá`, `${feedbackCount} ratings`)
                    : t("chưa có đánh giá", "no ratings yet")
                }
                icon={<GaugeIcon size={17} />}
                accent="brand"
              />
            </div>
          </section>
        </Reveal>

        {flow.data && flow.data.completed > 0 ? (
          <Reveal>
            <section aria-label={t("Nhịp giao việc (DORA)", "Delivery flow (DORA)")} className="flex flex-col gap-4">
              <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-muted">
                {t("Nhịp giao việc", "Delivery flow")}
              </span>
              <div className="grid gap-4 sm:grid-cols-3 md:gap-5">
                <StatTile
                  label={t("Việc hoàn thành", "Completed")}
                  value={<CountUp value={flow.data.completed} format={(v) => num(Math.round(v))} />}
                  hint={t("tổng luỹ kế", "cumulative")}
                  icon={<LayersIcon size={17} />}
                  accent="brand"
                />
                <StatTile
                  label={t("Lead time (P50)", "Lead time (P50)")}
                  value={dur(flow.data.leadTimeMsP50)}
                  hint={t("tạo → xong, trung vị", "created → done, median")}
                  icon={<ClockIcon size={17} />}
                  accent="brand"
                />
                <StatTile
                  label={t(`Throughput ${flow.data.windowDays} ngày`, `Throughput ${flow.data.windowDays}d`)}
                  value={<CountUp value={flow.data.throughput} format={(v) => num(Math.round(v))} />}
                  hint={t("việc xong gần đây", "recently completed")}
                  icon={<ActivityIcon size={17} />}
                  accent="brand"
                />
              </div>
            </section>
          </Reveal>
        ) : null}

        <Reveal>
          <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
            <Allocation split={metrics.split} total={total} />
            {b.data ? <Breakdown human={b.data.human} ai={b.data.ai} /> : null}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function Allocation({ split, total }: { split: AllocationSplit; total: number }) {
  const t = useT();
  const max = Math.max(1, ...VERDICTS.map((v) => split[v.key]));
  // Display names live here (VERDICTS keeps its stable keys + colours untouched).
  const name: Record<keyof AllocationSplit, string> = {
    human: t("Người", "People"),
    ai: t("AI", "AI"),
    hybrid: t("Hybrid", "Hybrid"),
    escalate: t("Escalate", "Escalate"),
  };
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-muted">
          {t("Phân bổ", "Allocation")}
        </span>
        <h2 className="font-serif text-lg font-medium text-ink">{t("Phân bổ quyết định", "Decision allocation")}</h2>
        <p className="text-sm text-muted">
          {t("Người · AI · Hybrid · Escalate", "People · AI · Hybrid · Escalate")} —{" "}
          {t(`${total} quyết định`, `${total} decisions`)}
        </p>
      </div>
      <ul className="flex flex-col gap-3" role="list">
        {VERDICTS.map((v) => {
          const count = split[v.key];
          return (
            <li key={v.key} className="grid grid-cols-[84px_1fr_auto] items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-ink2">
                <span className="h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: v.color }} aria-hidden />
                {name[v.key]}
              </span>
              <Meter value={count} max={max} color={v.color} label={`${name[v.key]}: ${count}`} />
              <span className="w-8 text-right font-mono text-sm tabular-nums text-ink2">{count}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Breakdown({ human, ai }: { human: SideStat; ai: SideStat }) {
  const t = useT();
  const rows: { label: string; type: "human" | "ai"; s: SideStat }[] = [
    { label: t("Người", "People"), type: "human", s: human },
    { label: t("AI", "AI"), type: "ai", s: ai },
  ];
  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-muted">
          {t("So sánh", "Compare")}
        </span>
        <h2 className="font-serif text-lg font-medium text-ink">
          {t("Người vs AI · cùng đơn vị", "People vs AI · same unit")}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              <th className="py-2 pr-2 font-medium">{t("Bên", "Side")}</th>
              <th className="py-2 pr-2 font-medium">{t("Task", "Tasks")}</th>
              <th className="py-2 pr-2 font-medium">{t("Phút TB", "Avg min")}</th>
              <th className="py-2 pr-2 font-medium">{t("Chi phí", "Cost")}</th>
              <th className="py-2 font-medium">{t("Chất lượng", "Quality")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, type, s }) => (
              <tr key={label} className="border-b border-line/60 last:border-0">
                <td className="py-3 pr-2">
                  <span className="flex items-center gap-2">
                    <AgentAvatar type={type} size="sm" />
                    <span className="font-medium text-ink2">{label}</span>
                    {s.estimated ? <EstimatedTag /> : null}
                  </span>
                </td>
                <td className="py-3 pr-2 tabular-nums text-ink2">{s.tasks}</td>
                <td className="py-3 pr-2 tabular-nums text-ink2">{s.tasks ? num(s.avgMinutes) : "—"}</td>
                <td className="py-3 pr-2 tabular-nums text-ink2">{s.tasks ? num(s.totalCost) : "—"}</td>
                <td className="py-3 tabular-nums">
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
      <p className="text-xs text-muted">
        {t(
          "Chi phí/thời gian của người là ESTIMATED; của AI đo từ log thực thi.",
          "People's cost/time is ESTIMATED; AI is measured from execution logs.",
        )}
      </p>
    </Card>
  );
}
