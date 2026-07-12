"use client";

import type { AllocationSplit } from "@orchestra/contracts";
import { Badge, Card, EmptyState, ErrorState, EstimatedTag, Skeleton } from "@/components/ui";
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
  { key: "hybrid", label: "Người + AI", color: "#B27916" },
  { key: "escalate", label: "Cần quản lý xem", color: "#BB4C3B" },
] as const satisfies readonly { key: keyof AllocationSplit; label: string; color: string }[];

const pct = (v: number) => `${Math.round(v * 100)}%`;
const num = (v: number) => new Intl.NumberFormat("vi-VN").format(v);

export function DashboardView() {
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

      <BehaviorHeatmap
        automation={metrics.automation}
        quality={feedbackCount ? metrics.quality : null}
        waiting={metrics.split.escalate + metrics.split.hybrid}
        total={total}
      />

      <ExecutiveScorecard metrics={metrics} feedbackCount={feedbackCount} />

      {flow.data && flow.data.completed > 0 ? (
        <section aria-label="Flow (DORA)" className="grid gap-3 sm:grid-cols-3">
          <StatTile label="Việc hoàn thành" value={num(flow.data.completed)} hint="tổng luỹ kế" />
          <StatTile label="Thời gian hoàn thành (P50)" value={dur(flow.data.leadTimeMsP50)} hint="tạo → xong, trung vị" />
          <StatTile
            label={`Sản lượng ${flow.data.windowDays} ngày`}
            value={num(flow.data.throughput)}
            hint="việc xong gần đây"
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
  const max = Math.max(1, ...VERDICTS.map((v) => split[v.key]));
  return (
    <Card>
      <h2 className="text-sm font-semibold">Phân bổ quyết định</h2>
      <p className="mb-3 text-xs text-muted">Người, AI, đội kết hợp và việc cần quản lý ({total} quyết định)</p>
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
    { label: "Người", icon: "Người", s: human },
    { label: "AI", icon: "AI", s: ai },
  ];
  return (
    <Card>
      <h2 className="text-sm font-semibold">So sánh hiệu suất người và AI</h2>
      <p className="mt-1 text-xs text-muted">Cùng một thước đo: số việc, thời gian, chi phí và chất lượng sau feedback.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-wide text-muted">
              <th className="py-2 pr-2 font-medium">Bên</th>
              <th className="py-2 pr-2 font-medium">Việc</th>
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
      <p className="mt-2 text-xs text-muted">Chi phí/thời gian của người là ESTIMATED; của AI đo từ log thực thi.</p>
    </Card>
  );
}

function ExecutiveScorecard({ metrics, feedbackCount }: { metrics: { automation: number; quality: number; split: AllocationSplit }; feedbackCount: number }) {
  const rows = [
    {
      label: "Tốc độ",
      value: pct(metrics.automation),
      note: "Tỷ lệ việc có thể giao cho AI hoặc đội người + AI.",
      tone: metrics.automation >= 0.6 ? "good" : "gold",
    },
    {
      label: "Chất lượng",
      value: feedbackCount ? pct(metrics.quality) : "Chưa đủ dữ liệu",
      note: feedbackCount ? "Dựa trên feedback sau khi hoàn thành." : "Cần thêm đánh giá ở Luồng xử lý.",
      tone: feedbackCount && metrics.quality >= 0.75 ? "good" : "gold",
    },
    {
      label: "Governance",
      value: `${metrics.split.escalate + metrics.split.hybrid}`,
      note: "Việc cần quản lý hoặc người kiểm tra trước khi hoàn tất.",
      tone: metrics.split.escalate > 0 ? "gold" : "good",
    },
  ] as const;

  return (
    <Card>
      <h2 className="text-sm font-semibold">Scorecard cho người ra quyết định</h2>
      <p className="mt-1 text-xs text-muted">Tóm tắt trực tiếp theo mục tiêu đề bài: tốc độ, chất lượng, kiểm soát.</p>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-line bg-paper/60 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{row.label}</p>
              <Badge tone={row.tone}>{row.tone === "good" ? "ổn" : "cần chú ý"}</Badge>
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
  const cells = [
    {
      label: "Tin AI để giao việc",
      value: automation,
      detail: "Tỷ lệ việc AI/hybrid có thể nhận",
    },
    {
      label: "Việc cần người kiểm tra",
      value: total ? waiting / total : 0,
      detail: "AI không nên tự hoàn tất",
      inverse: true,
    },
    {
      label: "Chất lượng sau review",
      value: quality ?? 0,
      detail: quality == null ? "Chưa đủ feedback" : "Tỷ lệ đạt từ phản hồi",
    },
    {
      label: "Tốc độ ra quyết định",
      value: Math.min(1, automation + 0.15),
      detail: "Ước lượng từ split hiện tại",
    },
  ];

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Bản đồ nhiệt hành vi vận hành</h2>
          <p className="mt-1 text-xs text-muted">Đọc nhanh nơi đội ngũ tin hệ thống, kẹt phê duyệt hoặc thiếu dữ liệu.</p>
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
