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
const VERDICTS = [
  { key: "human", label: "Người", color: "#0E9C8B" },
  { key: "ai", label: "AI", color: "#5A4BD4" },
  { key: "hybrid", label: "Hybrid", color: "#B27916" },
  { key: "escalate", label: "Escalate", color: "#BB4C3B" },
] as const satisfies readonly { key: keyof AllocationSplit; label: string; color: string }[];

const pct = (v: number) => `${Math.round(v * 100)}%`;
const num = (v: number) => new Intl.NumberFormat("vi-VN").format(v);

export function DashboardView() {
  const m = useMetrics();
  const b = useBreakdown();
  const flow = useFlow();

  if (m.isLoading || b.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }
  if (m.isError) {
    return (
      <ErrorState
        message={m.error instanceof HttpError ? m.error.message : "Không tải được metrics"}
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
        title="Chưa có dữ liệu đo lường"
        hint="Khi task được định tuyến và có feedback, các chỉ số sẽ xuất hiện ở đây."
        illustration={<EmptyDashboardArt />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Reveal>
        <section aria-label="KPI" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Tự động hoá"
            value={<CountUp value={metrics.automation * 100} format={(v) => `${Math.round(v)}%`} />}
            hint="AI + Hybrid / tổng"
            icon={<BoltIcon size={17} />}
            accent="a"
          />
          <StatTile
            label="Chi phí tiết kiệm"
            value={<CountUp value={metrics.cost_saving} format={(v) => num(Math.round(v))} />}
            icon={<WalletIcon size={17} />}
            accent="good"
            estimated
          />
          <StatTile
            label="Thời gian TB / lần"
            value={<CountUp value={metrics.avg_ms} format={(v) => `${num(Math.round(v))} ms`} />}
            icon={<ClockIcon size={17} />}
            accent="b"
          />
          <StatTile
            label="Chất lượng"
            value={feedbackCount ? <CountUp value={metrics.quality * 100} format={(v) => `${Math.round(v)}%`} /> : "—"}
            hint={feedbackCount ? `${feedbackCount} đánh giá` : "chưa có đánh giá"}
            icon={<GaugeIcon size={17} />}
            accent="gold"
          />
        </section>
      </Reveal>

      {flow.data && flow.data.completed > 0 ? (
        <Reveal>
          <section aria-label="Flow (DORA)" className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Việc hoàn thành"
              value={<CountUp value={flow.data.completed} format={(v) => num(Math.round(v))} />}
              hint="tổng luỹ kế"
              icon={<LayersIcon size={17} />}
              accent="b"
            />
            <StatTile
              label="Lead time (P50)"
              value={dur(flow.data.leadTimeMsP50)}
              hint="tạo → xong, trung vị"
              icon={<ClockIcon size={17} />}
              accent="a"
            />
            <StatTile
              label={`Throughput ${flow.data.windowDays} ngày`}
              value={<CountUp value={flow.data.throughput} format={(v) => num(Math.round(v))} />}
              hint="việc xong gần đây"
              icon={<ActivityIcon size={17} />}
              accent="good"
            />
          </section>
        </Reveal>
      ) : null}

      <Reveal>
        <div className="grid gap-5 lg:grid-cols-2">
          <Allocation split={metrics.split} total={total} />
          {b.data ? <Breakdown human={b.data.human} ai={b.data.ai} /> : null}
        </div>
      </Reveal>
    </div>
  );
}

function Allocation({ split, total }: { split: AllocationSplit; total: number }) {
  const max = Math.max(1, ...VERDICTS.map((v) => split[v.key]));
  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-ink">Phân bổ quyết định</h2>
        <p className="mt-0.5 text-xs text-muted">Người · AI · Hybrid · Escalate — {total} quyết định</p>
      </div>
      <ul className="flex flex-col gap-3" role="list">
        {VERDICTS.map((v) => {
          const count = split[v.key];
          return (
            <li key={v.key} className="grid grid-cols-[84px_1fr_auto] items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-ink2">
                <span className="h-2.5 w-2.5 flex-none rounded-[3px]" style={{ background: v.color }} aria-hidden />
                {v.label}
              </span>
              <Meter value={count} max={max} color={v.color} label={`${v.label}: ${count}`} />
              <span className="w-8 text-right font-mono text-sm tabular-nums text-ink2">{count}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function Breakdown({ human, ai }: { human: SideStat; ai: SideStat }) {
  const rows: { label: string; type: "human" | "ai"; s: SideStat }[] = [
    { label: "Người", type: "human", s: human },
    { label: "AI", type: "ai", s: ai },
  ];
  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-ink">Người vs AI · cùng đơn vị</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-2 font-medium">Bên</th>
              <th className="py-2 pr-2 font-medium">Task</th>
              <th className="py-2 pr-2 font-medium">Phút TB</th>
              <th className="py-2 pr-2 font-medium">Chi phí</th>
              <th className="py-2 font-medium">Chất lượng</th>
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
      <p className="text-xs text-muted">Chi phí/thời gian của người là ESTIMATED; của AI đo từ log thực thi.</p>
    </Card>
  );
}
