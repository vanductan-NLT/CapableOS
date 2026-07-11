"use client";

import { useState } from "react";
import type { Agent, AgentType } from "@orchestra/contracts";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { HttpError } from "@/lib/http";
import type { Reputation } from "@/lib/reputation";
import { useAgents } from "@/features/task/hooks";
import { useReputation } from "@/features/dashboard/hooks";
import { useCreateAgent, useUpdateAgent } from "./hooks";

export function PoolView() {
  const { data, isLoading, isError, error, refetch } = useAgents();
  const rep = useReputation();
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <h1 className="mb-1 text-lg font-semibold">Capability Pool</h1>
        <p className="mb-4 text-sm text-muted">Người + AI agent, năng lực và độ tin cậy (trust).</p>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState message={error instanceof HttpError ? error.message : "Không tải được Pool"} onRetry={refetch} />
        ) : !data || data.length === 0 ? (
          <EmptyState title="Pool trống" hint="Thêm người hoặc AI agent ở form bên phải." />
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
  const update = useUpdateAgent();
  const caps = Object.entries(agent.caps).sort((a, b) => b[1] - a[1]);
  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={agent.type === "ai" ? "a" : "b"}>{agent.type === "ai" ? "🤖 AI" : "🧑 Human"}</Badge>
            <span className="font-medium">{agent.name}</span>
            {agent.role ? <span className="text-xs text-muted">· {agent.role}</span> : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {caps.map(([k, v]) => (
              <span key={k} className="rounded bg-line/60 px-1.5 py-0.5 font-mono text-[10px] text-ink2">
                {k} {v.toFixed(2)}
              </span>
            ))}
          </div>
          <ReputationLine rep={rep} />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <TrustBar value={agent.trust} />
          <div className="flex gap-1">
            <button
              type="button"
              disabled={update.isPending || agent.trust >= 100}
              onClick={() => update.mutate({ id: agent.id, patch: { trust: Math.min(100, agent.trust + 1) } })}
              className="rounded border border-line px-1.5 text-xs disabled:opacity-40"
              aria-label={`Tăng trust của ${agent.name}`}
            >
              +
            </button>
            <button
              type="button"
              disabled={update.isPending || agent.trust <= 0}
              onClick={() => update.mutate({ id: agent.id, patch: { trust: Math.max(0, agent.trust - 1) } })}
              className="rounded border border-line px-1.5 text-xs disabled:opacity-40"
              aria-label={`Giảm trust của ${agent.name}`}
            >
              −
            </button>
          </div>
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
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Thêm vào Pool</h2>
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
              {t === "human" ? "🧑 Người" : "🤖 AI"}
            </button>
          ))}
        </div>
        <input className={field} placeholder="Tên" value={name} onChange={(e) => setName(e.target.value)} aria-label="Tên agent" />
        <input className={field} placeholder="Vai trò (tuỳ chọn)" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Vai trò" />
        <div className="flex gap-2">
          <input className={field + " w-full"} placeholder="Chi phí (ESTIMATED)" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} aria-label="Chi phí ước tính" />
          <input className={field + " w-full"} placeholder="Phút" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Số phút ước tính" />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Năng lực (0–1)</span>
          {caps.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={field + " w-full"}
                placeholder="vd: analysis"
                value={c.cap}
                onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, cap: e.target.value } : x)))}
                aria-label={`Tên năng lực ${i + 1}`}
              />
              <input
                className={field + " w-20"}
                inputMode="decimal"
                value={c.val}
                onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, val: e.target.value } : x)))}
                aria-label={`Mức năng lực ${i + 1}`}
              />
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
            + thêm năng lực
          </button>
        </div>
        <button
          type="submit"
          disabled={!name.trim() || create.isPending}
          className="mt-1 rounded-lg bg-b px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {create.isPending ? "Đang thêm…" : "Thêm agent"}
        </button>
        {create.isError ? (
          <span className="text-sm text-bad">{create.error instanceof HttpError ? create.error.message : "Lỗi"}</span>
        ) : null}
        {create.isSuccess ? <span className="text-sm text-good">✓ Đã thêm vào Pool</span> : null}
      </form>
    </Card>
  );
}
