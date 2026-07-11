"use client";

import type { DecisionResponse } from "@orchestra/contracts";
import { Badge, Card, EstimatedTag } from "@/components/ui";
import { getVerdictConfig, formatMetric } from "./decision-utils";

export { getVerdictConfig, formatMetric } from "./decision-utils";
export type { VerdictTone, VerdictConfig } from "./decision-utils";

// ── Component ───────────────────────────────────────────────

export interface DecisionCardProps {
  decision: DecisionResponse;
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const { verdict, confidence, ambiguity, reason, reasoning, estimated, cost_est, minutes_est } = decision;
  const config = getVerdictConfig(verdict);

  return (
    <Card className="space-y-4">
      {/* Header: verdict badge + confidence */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={config.tone}>{config.label}</Badge>
        <span className="text-sm text-muted">
          Độ tin cậy: <span className="font-medium text-ink">{formatMetric(confidence)}</span>
        </span>
        <span className="text-sm text-muted">
          Mơ hồ: <span className="font-medium text-ink">{formatMetric(ambiguity)}</span>
        </span>
      </div>

      {/* Reasoning */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Lý do</p>
        <p className="text-sm text-ink2">{reasoning}</p>
        {reason.code && (
          <p className="font-mono text-[11px] text-muted">
            {reason.code}
            {reason.top_fit != null && ` · fit=${(reason.top_fit * 100).toFixed(0)}%`}
          </p>
        )}
      </div>

      {/* Estimates (if available) */}
      {(cost_est != null || minutes_est != null) && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          {cost_est != null && <span>Chi phí ước tính: ${cost_est.toFixed(2)}</span>}
          {minutes_est != null && <span>Thời gian: ~{minutes_est} phút</span>}
          {estimated && <EstimatedTag />}
        </div>
      )}

      {/* Escalate-specific message */}
      {verdict === "escalate" && (
        <div className="rounded-lg border border-[color:#F0C7BE] bg-[color:#F7E7E3] px-3 py-2 text-sm text-bad dark:border-bad/30 dark:bg-bad/10">
          Cần người quản lý xem xét. Không có hành động tự động nào được thực hiện.
        </div>
      )}
    </Card>
  );
}
