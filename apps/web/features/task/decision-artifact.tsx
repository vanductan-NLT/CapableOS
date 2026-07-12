"use client";

import { clsx } from "clsx";
import { motion } from "framer-motion";
import type { DecisionResponse, ExecuteResponse, ScoredCandidate } from "@orchestra/contracts";
import {
  Avatar,
  Badge,
  Button,
  EstimatedTag,
  Icon,
  Meter,
  VERDICT_PRESENTATION,
  confidenceLabel,
} from "@/components/ui";
import { useT } from "@/lib/i18n";

type Translate = (vi: string, en: string) => string;

const mins = (n: number) => `~${Math.round(n)}′`;
const pct = (n: number) => `${Math.round(n * 100)}%`;
const humanMoney = (n: number) => (n >= 1 ? `$${Math.round(n)}` : `$${n.toFixed(2)}`);

const REASON_COPY: Record<string, string> = {
  NO_REQUIRED_CAPABILITIES: "Yêu cầu chưa đủ rõ về năng lực, cần người làm rõ trước.",
  NO_CANDIDATES: "Chưa có người hoặc AI phù hợp trong danh sách nguồn lực.",
  TOP_FIT_BELOW_THRESHOLD: "Ứng viên tốt nhất chưa đủ phù hợp, nên chuyển người quản lý xem xét.",
  AMBIGUOUS_HUMAN_AI_HYBRID: "Người và AI đang sát điểm nhau, phương án kết hợp an toàn hơn.",
  AMBIGUOUS_HUMAN_CANDIDATES: "Có nhiều người phù hợp gần nhau, cần chọn theo bối cảnh thực tế.",
  AMBIGUOUS_AI_CANDIDATES: "Có nhiều AI phù hợp gần nhau, nên chọn theo độ tin cậy và chi phí.",
  TOP_CANDIDATE_HUMAN: "Ứng viên phù hợp nhất là con người, phù hợp với việc cần phán đoán hoặc trách nhiệm.",
  TOP_CANDIDATE_AI_LOW_RISK: "Ứng viên phù hợp nhất là AI và rủi ro thấp, có thể giao cho AI để tiết kiệm thời gian.",
  HIGH_RISK_AI_REQUIRES_HUMAN: "AI có thể hỗ trợ, nhưng việc rủi ro cao nên có người kiểm tra.",
  NO_HUMAN_REVIEWER_AVAILABLE: "Chưa có người phù hợp để kiểm tra đầu ra, cần quản lý can thiệp.",
};

/**
 * The decision "artifact": surfaces the ranked candidate comparison
 * (people vs AI: match / fit / cost / time) that the backend already
 * produces — the direct answer to "who should do this work?".
 */
export function DecisionArtifact({
  decision,
  execution,
  onExecute,
  executing = false,
}: {
  decision: DecisionResponse;
  execution?: ExecuteResponse | null;
  onExecute?: () => void;
  executing?: boolean;
}) {
  const t = useT();
  const v = VERDICT_PRESENTATION[decision.verdict];
  const candidates = [...decision.candidates].sort((a, b) => b.fit - a.fit);
  const selectedCandidates = candidates.filter((candidate) => decision.chosen.includes(candidate.id));
  const primary = selectedCandidates[0] ?? candidates[0];
  const confidence = decision.confidence ?? decision.reason.top_fit ?? primary?.fit ?? null;
  const visibleCandidates = [...selectedCandidates, ...candidates.filter((candidate) => !decision.chosen.includes(candidate.id))].slice(0, 3);
  const chosen = new Set(decision.chosen);
  const canExecute = onExecute && (decision.verdict === "ai" || decision.verdict === "hybrid") && !execution;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm"
    >
      <div className="h-1" style={{ background: v.hex }} />
      <div className="space-y-4 p-4 md:p-5">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: `${v.hex}1a`, color: v.hex }}
            aria-hidden
          >
            <Icon name={v.icon} size={22} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-ink">{decisionTitle(t, decision, primary)}</h3>
              <Badge tone={v.tone}>{v.label}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-ink2">
              {REASON_COPY[decision.reason.code] ?? t("Hệ thống đã so sánh năng lực, độ tin cậy, chi phí và thời gian để đề xuất phương án này.", "The system compared capability, confidence, cost and time to recommend this option.")}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {confidence != null ? (
            <Meter
              value={confidence}
              label={t("Độ tin cậy", "Confidence")}
              caption={`${confidenceLabel(confidence)} · ${pct(confidence)}`}
              tone={v.tone}
            />
          ) : (
            <p className="self-center text-xs text-muted">{t("Độ tin cậy: chưa đủ dữ liệu", "Confidence: not enough data")}</p>
          )}
          <DecisionMetric label={t("Nguồn lực đã so sánh", "Resources compared")} value={`${candidates.length}`} />
          <DecisionMetric label={t("Rủi ro", "Risk")} value={decision.risk === "high" ? t("Cao", "High") : t("Thấp", "Low")} tone={decision.risk === "high" ? "text-gold" : "text-good"} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <BriefCard
            title={t("Phương án", "Option")}
            body={primary ? `${primary.name} ${primary.type === "ai" ? t("xử lý tự động", "handles it automatically") : t("chịu trách nhiệm xử lý", "is responsible for handling it")}` : t("Cần quản lý phân công", "Needs a manager to assign")}
          />
          <BriefCard title={t("Kiểm soát", "Control")} body={controlCopy(t, decision)} />
          <BriefCard
            title={t("Dự kiến", "Estimate")}
            body={`${decision.minutes_est != null ? mins(decision.minutes_est) : t("chưa rõ thời gian", "time unknown")} · ${decision.cost_est != null ? humanMoney(decision.cost_est) : t("chưa rõ chi phí", "cost unknown")}`}
            estimated={decision.estimated}
          />
        </div>

        {candidates.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {t("Phương án được cân nhắc", "Options considered")}
            </p>
            <ul className="flex flex-col gap-2">
              {visibleCandidates.map((c) => (
                <CandidateRow key={c.id} c={c} chosen={chosen.has(c.id)} estimated={decision.estimated} verdictHex={v.hex} verdictTone={v.tone} />
              ))}
              {candidates.length > visibleCandidates.length ? (
                <li className="rounded-lg border border-dashed border-line px-3 py-2 text-center text-xs text-muted">
                  {t(`Đã so sánh thêm ${candidates.length - visibleCandidates.length} nguồn lực khác`, `${candidates.length - visibleCandidates.length} more resources compared`)}
                </li>
              ) : null}
            </ul>
          </div>
        )}

        {execution && <ExecutionResult execution={execution} />}
        {canExecute && (
          <Button onClick={onExecute} loading={executing} icon="play">
            {t("Chạy phương án đề xuất", "Run the recommended option")}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function decisionTitle(t: Translate, decision: DecisionResponse, primary?: ScoredCandidate): string {
  if (decision.verdict === "escalate") return t("Cần quản lý quyết định", "Needs a manager decision");
  if (decision.verdict === "hybrid") return t("Đề xuất người và AI cùng xử lý", "Recommend a person and AI handle it together");
  if (!primary) return VERDICT_PRESENTATION[decision.verdict].headline;
  return decision.verdict === "ai" ? t(`Đề xuất giao cho ${primary.name}`, `Recommend assigning to ${primary.name}`) : t(`Đề xuất giao cho ${primary.name}`, `Recommend assigning to ${primary.name}`);
}

function controlCopy(t: Translate, decision: DecisionResponse): string {
  if (decision.verdict === "escalate") return t("Chưa giao tự động; cần quản lý xem xét.", "Not auto-assigned; needs a manager to review.");
  if (decision.verdict === "hybrid" || decision.risk === "high") return t("AI hỗ trợ, con người kiểm tra trước khi hoàn tất.", "AI assists, a person checks before it is finalized.");
  if (decision.verdict === "human") return t("Con người chịu trách nhiệm kết quả cuối.", "A person is responsible for the final result.");
  return t("Rủi ro thấp, có thể tự động hóa và đo lại bằng feedback.", "Low risk; can be automated and remeasured via feedback.");
}

function DecisionMetric({ label, value, tone = "text-ink" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper/60 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function BriefCard({ title, body, estimated }: { title: string; body: string; estimated?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-paper/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
        {estimated ? <EstimatedTag /> : null}
      </div>
      <p className="mt-1 text-sm leading-5 text-ink2">{body}</p>
    </div>
  );
}

function CandidateRow({
  c,
  chosen,
  estimated,
  verdictHex,
  verdictTone,
}: {
  c: ScoredCandidate;
  chosen: boolean;
  estimated: boolean;
  verdictHex: string;
  verdictTone: "a" | "b" | "gold" | "bad" | "good" | "muted";
}) {
  const t = useT();
  return (
    <li
      className={clsx(
        "rounded-lg border p-3 transition-colors",
        chosen ? "bg-b-soft/40" : "border-line",
      )}
      style={chosen ? { borderColor: verdictHex } : undefined}
    >
      <div className="flex items-center gap-3">
        <Avatar type={c.type} name={c.name} size={32} selected={chosen} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-ink">{c.name}</span>
            {chosen && (
              <Badge tone={verdictTone}>
                <Icon name="check" size={12} /> {t("Được chọn", "Selected")}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Icon name="cost" size={13} />
              {humanMoney(c.cost)}
              {estimated && <span className="text-gold">*</span>}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" size={13} />
              {mins(c.minutes)}
            </span>
            <span>{t("Khớp năng lực", "Capability match")} {pct(c.match)}</span>
          </div>
        </div>
        <div className="w-20 shrink-0 sm:w-24">
          <Meter value={c.fit} caption={pct(c.fit)} tone={chosen ? verdictTone : "muted"} />
          <p className="mt-0.5 text-right text-[10px] text-muted">{t("độ phù hợp", "fit")}</p>
        </div>
      </div>
    </li>
  );
}

function ExecutionResult({ execution }: { execution: ExecuteResponse }) {
  const t = useT();
  if (execution.kind === "ai_success") {
    return (
      <div className="rounded-lg border border-good/30 bg-good/5 p-3">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-good">
          <Icon name="check-circle" size={14} /> {t("AI đã thực thi xong", "AI finished execution")}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{execution.output}</p>
        {(execution.tokens != null || execution.ms != null) && (
          <p className="mt-2 font-mono text-[11px] text-muted">
            {execution.tokens != null && `${execution.tokens} tokens`}
            {execution.ms != null && ` · ${execution.ms}ms`}
          </p>
        )}
      </div>
    );
  }
  if (execution.kind === "human_pending") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper p-3 text-sm text-ink2">
        <Icon name="user" size={16} />
        {t("Đã giao cho người:", "Assigned to a person:")} <strong>{execution.assignee_id}</strong>. {t("Đang chờ hoàn thành.", "Waiting for completion.")}
      </div>
    );
  }
  if (execution.kind === "denied") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/5 p-3 text-sm text-bad">
        <Icon name="ban" size={16} /> {t("Bị chặn bởi governance:", "Blocked by governance:")} {execution.reason}
      </div>
    );
  }
  return null;
}
