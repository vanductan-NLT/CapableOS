"use client";

import { useState } from "react";
import { CAPABILITIES, type Agent, type AgentType } from "@orchestra/contracts";
import { Badge, Card, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { useT } from "@/lib/i18n";
import type { Reputation } from "@/lib/reputation";
import { useAgents } from "@/features/task/hooks";
import { useReputation } from "@/features/dashboard/hooks";
import { useCreateAgent } from "./hooks";

const CAPABILITY_LABELS: Record<string, string> = {
  analysis: "Phân tích",
  writing: "Viết nội dung",
  research: "Nghiên cứu",
  summarization: "Tóm tắt",
  translation: "Dịch thuật",
  email_drafting: "Soạn email",
  meeting_notes: "Ghi chú họp",
  design: "Thiết kế",
  coding: "Lập trình",
};

export function PoolView() {
  const t = useT();
  const { data, isLoading, isError, error, refetch } = useAgents();
  const rep = useReputation();
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="mb-1 text-lg font-semibold">{t("Danh sách người & AI", "People & AI directory")}</h1>
        <p className="mb-4 text-sm text-muted">
          {t(
            "Nơi hệ thống biết ai có năng lực gì, nên giao việc nào cho người, việc nào cho AI, và khi nào cần kết hợp.",
            "Where the system knows who has which capabilities, which work should go to people, which to AI, and when to combine them.",
          )}
        </p>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <PoolPurpose title={t("Chọn đúng năng lực", "Pick the right capability")} body={t("Router dùng năng lực và độ tin cậy ở đây để đề xuất nguồn lực.", "The router uses the capabilities and trust here to suggest resources.")} />
          <PoolPurpose title={t("So sánh người vs AI", "People vs AI")} body={t("Người chịu trách nhiệm, AI tối ưu tốc độ; cả hai cùng dùng một thước đo.", "People own accountability, AI optimizes speed; both share one measure.")} />
          <PoolPurpose title={t("Cải thiện theo feedback", "Improve from feedback")} body={t("Đánh giá sau việc làm thay đổi uy tín và quyết định lần sau.", "Post-task reviews change reputation and the next decision.")} />
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error instanceof HttpError ? error.message : t("Không tải được Pool", "Couldn't load the Pool")} onRetry={refetch} />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t("Chưa có nguồn lực", "No resources yet")} hint={t("Thêm nhân sự hoặc AI agent ở form bên phải.", "Add a person or an AI agent using the form on the right.")} />
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((a) => (
              <AgentRow key={a.id} agent={a} rep={rep.data?.[a.id]} />
            ))}
          </div>
        )}
      </div>
      <AddAgentForm />
    </div>
  );
}

function PoolPurpose({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-line bg-card p-3">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{body}</p>
    </div>
  );
}

function TrustBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2" title={`trust ${value}/100`}>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-b" style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs text-ink2">{value}</span>
    </div>
  );
}

function ReputationLine({ rep }: { rep?: Reputation }) {
  const t = useT();
  if (!rep || rep.n === 0) {
    return <p className="mt-1.5 text-xs text-muted">{t("Uy tín kiểm chứng: chưa có đánh giá", "Verified reputation: no reviews yet")}</p>;
  }
  const arrow = rep.trend === "up" ? "↗" : rep.trend === "down" ? "↘" : "→";
  const tone = rep.trend === "up" ? "text-good" : rep.trend === "down" ? "text-bad" : "text-muted";
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs" title={t("Wilson lower-bound của tỉ lệ 'đạt' — phạt mẫu nhỏ", "Wilson lower-bound of the 'pass' rate — penalizes small samples")}>
      <span className="text-muted">{t("Uy tín kiểm chứng:", "Verified reputation:")}</span>
      <span className="font-mono font-semibold">{Math.round(rep.wilson * 100)}%</span>
      <span className={tone} aria-label={`${t("xu hướng", "trend")} ${rep.trend}`}>
        {arrow}
      </span>
      <span className="text-muted">({rep.n} {t("đánh giá", "reviews")} · EWMA {Math.round(rep.ewma * 100)}%)</span>
    </p>
  );
}

function AgentRow({ agent, rep }: { agent: Agent; rep?: Reputation }) {
  const t = useT();
  const caps = Object.entries(agent.caps).sort((a, b) => b[1] - a[1]);
  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={agent.type === "ai" ? "a" : "b"}>
              <Icon name={agent.type === "ai" ? "bot" : "user"} size={13} />
              {agent.type === "ai" ? "AI" : t("Con người", "Human")}
            </Badge>
            <span className="font-medium">{agent.name}</span>
            {agent.role ? <span className="text-xs text-muted">· {agent.role}</span> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {caps.map(([k, v]) => (
              <span key={k} className="inline-flex items-center gap-1.5 rounded-md bg-line/60 px-2 py-1 text-xs text-ink2">
                {CAPABILITY_LABELS[k] ?? k}
                <span className="h-1.5 w-9 overflow-hidden rounded-full bg-card" aria-hidden>
                  <span className="block h-full rounded-full bg-b" style={{ width: `${Math.round(v * 100)}%` }} />
                </span>
                <span className="font-mono text-[10px]">{Math.round(v * 100)}%</span>
              </span>
            ))}
          </div>
          <ReputationLine rep={rep} />
          <p className="mt-1.5 text-xs text-muted">{agent.type === "ai" ? t("Dùng tốt cho việc lặp lại, tốc độ cao, rủi ro thấp.", "Good for repetitive, high-speed, low-risk work.") : t("Dùng tốt cho việc cần trách nhiệm, bối cảnh và phê duyệt.", "Good for work needing accountability, context and approval.")}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <TrustBar value={agent.trust} />
          <span className="text-[11px] text-muted">{t("uy tín", "trust")}</span>
        </div>
      </div>
    </Card>
  );
}

type CapRow = { cap: string; val: string };

function AddAgentForm() {
  const t = useT();
  const create = useCreateAgent();
  const [type, setType] = useState<AgentType>("human");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [cost, setCost] = useState("");
  const [minutes, setMinutes] = useState("");
  const [caps, setCaps] = useState<CapRow[]>([{ cap: "", val: "0.8" }]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const capMap: Record<string, number> = {};
    for (const c of caps) {
      const key = c.cap.trim();
      const num = Number(c.val);
      if (key && Number.isFinite(num) && num >= 0 && num <= 1) capMap[key] = num;
    }
    create.mutate(
      {
        type,
        name: name.trim(),
        role: role.trim() || undefined,
        cost: cost ? Number(cost) : undefined,
        minutes: minutes ? Number(minutes) : undefined,
        caps: capMap,
      },
      {
        onSuccess: () => {
          setName("");
          setRole("");
          setCost("");
          setMinutes("");
          setCaps([{ cap: "", val: "0.8" }]);
        },
      },
    );
  }

  const field = "rounded-lg border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-b";

  return (
    <Card>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{t("Thêm nguồn lực", "Add resource")}</h2>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2.5">
        <div className="flex gap-2">
          {(["human", "ai"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setType(opt)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-sm ${type === opt ? "border-b bg-b-soft text-b" : "border-line"}`}
              aria-pressed={type === opt}
            >
              {opt === "human" ? t("Người", "Human") : "AI"}
            </button>
          ))}
        </div>
        <input className={field} placeholder={t("Tên", "Name")} value={name} onChange={(e) => setName(e.target.value)} aria-label={t("Tên nguồn lực", "Resource name")} />
        <input className={field} placeholder={t("Vai trò (tuỳ chọn)", "Role (optional)")} value={role} onChange={(e) => setRole(e.target.value)} aria-label={t("Vai trò", "Role")} />
        <div className="flex gap-2">
          <input className={field + " w-full"} placeholder={t("Chi phí (ESTIMATED)", "Cost (ESTIMATED)")} inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} aria-label={t("Chi phí ước tính", "Estimated cost")} />
          <input className={field + " w-full"} placeholder={t("Phút", "Minutes")} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label={t("Số phút ước tính", "Estimated minutes")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">{t("Năng lực (0–1)", "Capability (0–1)")}</span>
          {caps.map((c, i) => (
            <div key={i} className="flex gap-2">
              <select
                className={field + " w-full"}
                value={c.cap}
                onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, cap: e.target.value } : x)))}
                aria-label={`${t("Tên năng lực", "Capability name")} ${i + 1}`}
              >
                <option value="">{t("Chọn năng lực", "Select capability")}</option>
                {CAPABILITIES.map((cap) => (
                  <option key={cap} value={cap}>
                    {CAPABILITY_LABELS[cap] ?? cap}
                  </option>
                ))}
              </select>
              <div className="flex w-32 items-center gap-2 rounded-lg border border-line bg-paper px-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  className="min-w-0 flex-1 accent-[color:var(--b)]"
                  value={c.val}
                  onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, val: e.target.value } : x)))}
                  aria-label={`${t("Mức năng lực", "Capability level")} ${i + 1}`}
                />
                <span className="w-8 text-right text-xs tabular-nums text-muted">{Math.round(Number(c.val) * 100)}%</span>
              </div>
              <button
                type="button"
                onClick={() => setCaps((cs) => (cs.length > 1 ? cs.filter((_, j) => j !== i) : cs))}
                className="rounded border border-line px-2 text-sm text-muted"
                aria-label={t("Xoá năng lực", "Remove capability")}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setCaps((cs) => [...cs, { cap: "", val: "0.7" }])} className="self-start text-xs text-b">
            {t("+ chọn thêm năng lực", "+ add capability")}
          </button>
        </div>
        <button
          type="submit"
          disabled={!name.trim() || create.isPending}
          className="mt-1 rounded-lg bg-b px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {create.isPending ? t("Đang thêm…", "Adding…") : t("Thêm nguồn lực", "Add resource")}
        </button>
        {create.isError ? (
          <span className="text-sm text-bad">{create.error instanceof HttpError ? create.error.message : t("Lỗi", "Error")}</span>
        ) : null}
        {create.isSuccess ? <span className="text-sm text-good">{t("Đã thêm vào danh sách", "Added to the directory")}</span> : null}
      </form>
    </Card>
  );
}
