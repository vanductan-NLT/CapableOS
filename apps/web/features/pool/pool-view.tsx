"use client";

import { useState } from "react";
import { CAPABILITIES, type Agent, type AgentType } from "@orchestra/contracts";
import { Badge, Card, EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";
import { HttpError } from "@/lib/http";
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
  const { data, isLoading, isError, error, refetch } = useAgents();
  const rep = useReputation();
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="mb-1 text-lg font-semibold">Danh sách người & AI</h1>
        <p className="mb-4 text-sm text-muted">
          Nơi hệ thống biết ai có năng lực gì, nên giao việc nào cho người, việc nào cho AI, và khi nào cần kết hợp.
        </p>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <PoolPurpose title="Chọn đúng năng lực" body="Router dùng năng lực và độ tin cậy ở đây để đề xuất nguồn lực." />
          <PoolPurpose title="So sánh người vs AI" body="Người chịu trách nhiệm, AI tối ưu tốc độ; cả hai cùng dùng một thước đo." />
          <PoolPurpose title="Cải thiện theo feedback" body="Đánh giá sau việc làm thay đổi uy tín và quyết định lần sau." />
        </div>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error instanceof HttpError ? error.message : "Không tải được Pool"} onRetry={refetch} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Chưa có nguồn lực" hint="Thêm nhân sự hoặc AI agent ở form bên phải." />
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
  if (!rep || rep.n === 0) {
    return <p className="mt-1.5 text-xs text-muted">Uy tín kiểm chứng: chưa có đánh giá</p>;
  }
  const arrow = rep.trend === "up" ? "↗" : rep.trend === "down" ? "↘" : "→";
  const tone = rep.trend === "up" ? "text-good" : rep.trend === "down" ? "text-bad" : "text-muted";
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs" title="Wilson lower-bound của tỉ lệ 'đạt' — phạt mẫu nhỏ">
      <span className="text-muted">Uy tín kiểm chứng:</span>
      <span className="font-mono font-semibold">{Math.round(rep.wilson * 100)}%</span>
      <span className={tone} aria-label={`xu hướng ${rep.trend}`}>
        {arrow}
      </span>
      <span className="text-muted">({rep.n} đánh giá · EWMA {Math.round(rep.ewma * 100)}%)</span>
    </p>
  );
}

function AgentRow({ agent, rep }: { agent: Agent; rep?: Reputation }) {
  const caps = Object.entries(agent.caps).sort((a, b) => b[1] - a[1]);
  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={agent.type === "ai" ? "a" : "b"}>
              <Icon name={agent.type === "ai" ? "bot" : "user"} size={13} />
              {agent.type === "ai" ? "AI" : "Con người"}
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
          <p className="mt-1.5 text-xs text-muted">{agent.type === "ai" ? "Dùng tốt cho việc lặp lại, tốc độ cao, rủi ro thấp." : "Dùng tốt cho việc cần trách nhiệm, bối cảnh và phê duyệt."}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <TrustBar value={agent.trust} />
          <span className="text-[11px] text-muted">uy tín</span>
        </div>
      </div>
    </Card>
  );
}

type CapRow = { cap: string; val: string };

function AddAgentForm() {
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
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Thêm nguồn lực</h2>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2.5">
        <div className="flex gap-2">
          {(["human", "ai"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg border px-3 py-1.5 text-sm ${type === t ? "border-b bg-b-soft text-b" : "border-line"}`}
              aria-pressed={type === t}
            >
              {t === "human" ? "Người" : "AI"}
            </button>
          ))}
        </div>
        <input className={field} placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} aria-label="Tên nguồn lực" />
        <input className={field} placeholder="Vai trò (tuỳ chọn)" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Vai trò" />
        <div className="flex gap-2">
          <input className={field + " w-full"} placeholder="Chi phí (ESTIMATED)" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} aria-label="Chi phí ước tính" />
          <input className={field + " w-full"} placeholder="Phút" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Số phút ước tính" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Năng lực (0–1)</span>
          {caps.map((c, i) => (
            <div key={i} className="flex gap-2">
              <select
                className={field + " w-full"}
                value={c.cap}
                onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, cap: e.target.value } : x)))}
                aria-label={`Tên năng lực ${i + 1}`}
              >
                <option value="">Chọn năng lực</option>
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
                  aria-label={`Mức năng lực ${i + 1}`}
                />
                <span className="w-8 text-right text-xs tabular-nums text-muted">{Math.round(Number(c.val) * 100)}%</span>
              </div>
              <button
                type="button"
                onClick={() => setCaps((cs) => (cs.length > 1 ? cs.filter((_, j) => j !== i) : cs))}
                className="rounded border border-line px-2 text-sm text-muted"
                aria-label="Xoá năng lực"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setCaps((cs) => [...cs, { cap: "", val: "0.7" }])} className="self-start text-xs text-b">
            + chọn thêm năng lực
          </button>
        </div>
        <button
          type="submit"
          disabled={!name.trim() || create.isPending}
          className="mt-1 rounded-lg bg-b px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {create.isPending ? "Đang thêm…" : "Thêm nguồn lực"}
        </button>
        {create.isError ? (
          <span className="text-sm text-bad">{create.error instanceof HttpError ? create.error.message : "Lỗi"}</span>
        ) : null}
        {create.isSuccess ? <span className="text-sm text-good">Đã thêm vào danh sách</span> : null}
      </form>
    </Card>
  );
}
