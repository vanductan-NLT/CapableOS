"use client";

import { useState } from "react";
import type { Agent, AgentType } from "@orchestra/contracts";
import {
  AgentAvatar,
  AiIcon,
  AlertIcon,
  Button,
  Card,
  CheckIcon,
  CloseIcon,
  EmptyState,
  ErrorState,
  Field,
  HumanIcon,
  IconButton,
  Input,
  Meter,
  MinusIcon,
  PlusIcon,
  PoolIcon,
  SegmentedControl,
  Skeleton,
  TrendDownIcon,
  TrendFlatIcon,
  TrendUpIcon,
} from "@orchestra/ui";
import { HttpError } from "@/lib/http";
import type { Reputation } from "@/lib/reputation";
import { PageHeader } from "@/components/page-header";
import { useAgents } from "@/features/task/hooks";
import { useReputation } from "@/features/dashboard/hooks";
import { useCreateAgent, useUpdateAgent } from "./hooks";

export function PoolView() {
  const { data, isLoading, isError, error, refetch } = useAgents();
  const rep = useReputation();
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Capability Pool"
        title="Năng lực người & AI"
        lead="Người và AI agent, năng lực và độ tin cậy (trust) — nguồn ứng viên cho mọi quyết định định tuyến."
        icon={<PoolIcon size={20} />}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState message={error instanceof HttpError ? error.message : "Không tải được Pool"} onRetry={refetch} />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="Pool trống"
              hint="Thêm người hoặc AI agent ở form bên phải."
              icon={<PoolIcon size={22} />}
            />
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.map((a) => (
                <AgentRow key={a.id} agent={a} rep={rep.data?.[a.id]} />
              ))}
            </div>
          )}
        </div>
        <AddAgentForm />
      </div>
    </div>
  );
}

function TrustControl({ agent }: { agent: Agent }) {
  const update = useUpdateAgent();
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2" title={`trust ${agent.trust}/100`}>
        <Meter value={agent.trust} className="w-24" />
        <span className="w-7 text-right font-mono text-xs tabular-nums text-ink2">{agent.trust}</span>
      </div>
      <div className="flex gap-1">
        <IconButton
          size="sm"
          disabled={update.isPending || agent.trust <= 0}
          onClick={() => update.mutate({ id: agent.id, patch: { trust: Math.max(0, agent.trust - 1) } })}
          aria-label={`Giảm trust của ${agent.name}`}
        >
          <MinusIcon size={15} />
        </IconButton>
        <IconButton
          size="sm"
          disabled={update.isPending || agent.trust >= 100}
          onClick={() => update.mutate({ id: agent.id, patch: { trust: Math.min(100, agent.trust + 1) } })}
          aria-label={`Tăng trust của ${agent.name}`}
        >
          <PlusIcon size={15} />
        </IconButton>
      </div>
    </div>
  );
}

function ReputationLine({ rep }: { rep?: Reputation }) {
  if (!rep || rep.n === 0) {
    return <p className="mt-2 text-xs text-muted">Uy tín kiểm chứng: chưa có đánh giá</p>;
  }
  const trend =
    rep.trend === "up"
      ? { Icon: TrendUpIcon, cls: "text-good", label: "đang lên" }
      : rep.trend === "down"
        ? { Icon: TrendDownIcon, cls: "text-bad", label: "đang xuống" }
        : { Icon: TrendFlatIcon, cls: "text-muted", label: "ổn định" };
  return (
    <p
      className="mt-2 flex flex-wrap items-center gap-1.5 text-xs"
      title="Wilson lower-bound của tỉ lệ 'đạt' — phạt mẫu nhỏ"
    >
      <span className="text-muted">Uy tín kiểm chứng:</span>
      <span className="font-mono font-semibold text-ink">{Math.round(rep.wilson * 100)}%</span>
      <span className={`inline-flex items-center ${trend.cls}`} aria-label={`xu hướng ${trend.label}`}>
        <trend.Icon size={14} />
      </span>
      <span className="text-muted">
        ({rep.n} đánh giá · EWMA {Math.round(rep.ewma * 100)}%)
      </span>
    </p>
  );
}

function AgentRow({ agent, rep }: { agent: Agent; rep?: Reputation }) {
  const caps = Object.entries(agent.caps).sort((a, b) => b[1] - a[1]);
  return (
    <Card interactive className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <AgentAvatar type={agent.type} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink">{agent.name}</span>
                <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
                  {agent.type === "ai" ? "AI" : "Human"}
                </span>
              </div>
              {agent.role ? <span className="text-xs text-muted">{agent.role}</span> : null}
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {caps.map(([k, v]) => (
              <span
                key={k}
                className="inline-flex items-center gap-1 rounded-md bg-line/60 px-2 py-0.5 font-mono text-[10px] text-ink2"
              >
                {k} <span className="text-muted">{v.toFixed(2)}</span>
              </span>
            ))}
          </div>
          <ReputationLine rep={rep} />
        </div>
        <TrustControl agent={agent} />
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
      const val = Number(c.val);
      if (key && Number.isFinite(val) && val >= 0 && val <= 1) capMap[key] = val;
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

  return (
    <Card className="h-fit lg:sticky lg:top-20">
      <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Thêm vào Pool</h2>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <SegmentedControl
          ariaLabel="Loại"
          value={type}
          onChange={setType}
          options={[
            { value: "human", label: <span className="flex items-center gap-1.5"><HumanIcon size={15} /> Người</span> },
            { value: "ai", label: <span className="flex items-center gap-1.5"><AiIcon size={15} /> AI</span> },
          ]}
        />
        <Field label="Tên">
          <Input placeholder="VD: Minh Anh / Qwen-Summarizer" value={name} onChange={(e) => setName(e.target.value)} aria-label="Tên agent" />
        </Field>
        <Field label="Vai trò" optional>
          <Input placeholder="VD: Analyst" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Vai trò" />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Chi phí" hint="ESTIMATED">
            <Input placeholder="0" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} aria-label="Chi phí ước tính" />
          </Field>
          <Field label="Phút">
            <Input placeholder="0" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Số phút ước tính" />
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Năng lực <span className="font-normal text-muted">(0–1)</span></span>
          {caps.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="vd: analysis"
                value={c.cap}
                onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, cap: e.target.value } : x)))}
                aria-label={`Tên năng lực ${i + 1}`}
              />
              <Input
                className="w-20 flex-none"
                inputMode="decimal"
                value={c.val}
                onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, val: e.target.value } : x)))}
                aria-label={`Mức năng lực ${i + 1}`}
              />
              <IconButton
                variant="ghost"
                onClick={() => setCaps((cs) => (cs.length > 1 ? cs.filter((_, j) => j !== i) : cs))}
                aria-label="Xoá năng lực"
                className="flex-none text-muted"
              >
                <CloseIcon size={16} />
              </IconButton>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<PlusIcon size={15} />}
            onClick={() => setCaps((cs) => [...cs, { cap: "", val: "0.7" }])}
            className="self-start text-b"
          >
            Thêm năng lực
          </Button>
        </div>
        <Button type="submit" disabled={!name.trim() || create.isPending} className="mt-1">
          {create.isPending ? "Đang thêm…" : "Thêm agent"}
        </Button>
        {create.isError ? (
          <span className="flex items-center gap-1.5 text-sm text-bad">
            <AlertIcon size={16} /> {create.error instanceof HttpError ? create.error.message : "Lỗi"}
          </span>
        ) : null}
        {create.isSuccess ? (
          <span className="flex items-center gap-1.5 text-sm text-good">
            <CheckIcon size={16} /> Đã thêm vào Pool
          </span>
        ) : null}
      </form>
    </Card>
  );
}
