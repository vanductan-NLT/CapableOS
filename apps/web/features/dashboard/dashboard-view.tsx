"use client";

import type { AllocationSplit } from "@orchestra/contracts";
import { Badge, Card, EmptyState, ErrorState, EstimatedTag, Skeleton } from "@/components/ui";
import type { SideStat } from "@/lib/metrics";
import { HttpError } from "@/lib/http";
import { useBreakdown, useMetrics } from "./hooks";

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
        hint="Khi task được định tuyến (domain A) và có feedback, các chỉ số sẽ xuất hiện ở đây."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="KPI" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Tự động hoá" value={pct(metrics.automation)} hint="AI + Hybrid / tổng" />
        <StatTile label="Chi phí tiết kiệm" value={num(metrics.cost_saving)} estimated />
        <StatTile label="Thời gian TB / lần" value={`${num(metrics.avg_ms)} ms`} />
        <StatTile
          label="Chất lượng"
          value={feedbackCount ? pct(metrics.quality) : "—"}
          hint={feedbackCount ? `${feedbackCount} đánh giá` : "chưa có đánh giá"}
        />
      </section>

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
  const max = Math.max(1, ...VERDICTS.map((v) => split[v.key]));
  return (
    <Card>
      <h2 className="text-sm font-semibold">Phân bổ quyết định</h2>
      <p className="mb-3 text-xs text-muted">Người vs AI vs Hybrid vs Escalate ({total} quyết định)</p>
      <ul className="flex flex-col gap-2.5" role="list">
        {VERDICTS.map((v) => {
          const count = split[v.key];
          return (
            <li key={v.key} className="grid grid-cols-[80px_1fr_auto] items-center gap-2">
              <span className="flex items-center gap-1.5 text-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: v.color }} aria-hidden />
                {v.label}
              </span>
              <span className="h-3 overflow-hidden rounded-full bg-line" role="img" aria-label={`${v.label}: ${count}`}>
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
  const rows: { label: string; icon: string; s: SideStat }[] = [
    { label: "Người", icon: "🧑", s: human },
    { label: "AI", icon: "🤖", s: ai },
  ];
  return (
    <Card>
      <h2 className="text-sm font-semibold">Người vs AI · cùng đơn vị</h2>
      <div className="mt-3 overflow-x-auto">
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
            {rows.map(({ label, icon, s }) => (
              <tr key={label} className="border-b border-line/60">
                <td className="py-2.5 pr-2">
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden>{icon}</span> {label}
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
      <p className="mt-2 text-xs text-muted">Chi phí/thời gian của người là ESTIMATED; của AI đo từ log thực thi.</p>
    </Card>
  );
}
