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
  EmptyPoolArt,
  EmptyState,
  ErrorState,
  Field,
  HumanIcon,
  IconButton,
  Input,
  Meter,
  MinusIcon,
  PlusIcon,
  SegmentedControl,
  Skeleton,
  TrendDownIcon,
  TrendFlatIcon,
  TrendUpIcon,
} from "@orchestra/ui";
import { HttpError } from "@/lib/http";
import type { Reputation } from "@/lib/reputation";
import { PageHeader } from "@/components/page-header";
import { useT } from "@/lib/i18n";
import { useAgents } from "@/features/task/hooks";
import { useReputation } from "@/features/dashboard/hooks";
import { useCreateAgent, useUpdateAgent } from "./hooks";

export function PoolView() {
  const t = useT();
  const { data, isLoading, isError, error, refetch } = useAgents();
  const rep = useReputation();
  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <PageHeader
        eyebrow={t("Năng lực", "Capability")}
        title={t("Đội ngũ người & AI", "People & AI team")}
        lead={t("Người và AI, cùng năng lực và độ tin cậy.", "People and AI, with capabilities and trust.")}
        accent="brand"
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : isError ? (
            <ErrorState
              message={error instanceof HttpError ? error.message : t("Không tải được Pool", "Couldn't load the Pool")}
              onRetry={refetch}
            />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title={t("Pool trống", "Pool is empty")}
              hint={t(
                "Thêm người hoặc AI agent ở form bên phải.",
                "Add a person or AI agent using the form on the right.",
              )}
              illustration={<EmptyPoolArt />}
            />
          ) : (
            <div className="flex flex-col gap-4">
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
  const t = useT();
  const update = useUpdateAgent();
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2" title={t(`Độ tin cậy ${agent.trust}/100`, `Trust ${agent.trust}/100`)}>
        <Meter value={agent.trust} className="w-24" />
        <span className="w-7 text-right font-mono text-xs tabular-nums text-ink2">{agent.trust}</span>
      </div>
      <div className="flex gap-1">
        <IconButton
          size="sm"
          disabled={update.isPending || agent.trust <= 0}
          onClick={() => update.mutate({ id: agent.id, patch: { trust: Math.max(0, agent.trust - 1) } })}
          aria-label={t(`Giảm độ tin cậy của ${agent.name}`, `Decrease trust for ${agent.name}`)}
        >
          <MinusIcon size={15} />
        </IconButton>
        <IconButton
          size="sm"
          disabled={update.isPending || agent.trust >= 100}
          onClick={() => update.mutate({ id: agent.id, patch: { trust: Math.min(100, agent.trust + 1) } })}
          aria-label={t(`Tăng độ tin cậy của ${agent.name}`, `Increase trust for ${agent.name}`)}
        >
          <PlusIcon size={15} />
        </IconButton>
      </div>
    </div>
  );
}

function ReputationLine({ rep }: { rep?: Reputation }) {
  const t = useT();
  if (!rep || rep.n === 0) {
    return (
      <p className="mt-3 text-xs text-muted">
        {t("Uy tín kiểm chứng: chưa có đánh giá", "Verified reputation: no ratings yet")}
      </p>
    );
  }
  const trend =
    rep.trend === "up"
      ? { Icon: TrendUpIcon, cls: "text-good", label: t("đang lên", "trending up") }
      : rep.trend === "down"
        ? { Icon: TrendDownIcon, cls: "text-bad", label: t("đang xuống", "trending down") }
        : { Icon: TrendFlatIcon, cls: "text-muted", label: t("ổn định", "steady") };
  return (
    <p
      className="mt-3 flex flex-wrap items-center gap-1.5 text-xs"
      title={t(
        "Uy tín kiểm chứng: cận dưới Wilson của tỉ lệ 'đạt', làm mượt theo EWMA — phạt mẫu nhỏ",
        "Verified reputation: Wilson lower bound of the 'pass' rate, EWMA-smoothed — penalizes small samples",
      )}
    >
      <span className="text-muted">{t("Uy tín kiểm chứng:", "Verified reputation:")}</span>
      <span className="font-mono font-semibold text-ink">{Math.round(rep.wilson * 100)}%</span>
      <span className={`inline-flex items-center ${trend.cls}`} aria-label={t(`xu hướng ${trend.label}`, `trend ${trend.label}`)}>
        <trend.Icon size={14} />
      </span>
      <span className="text-muted">
        · {rep.n} {t("đánh giá", "ratings")}
      </span>
    </p>
  );
}

function AgentRow({ agent, rep }: { agent: Agent; rep?: Reputation }) {
  const t = useT();
  const caps = Object.entries(agent.caps).sort((a, b) => b[1] - a[1]);
  return (
    <Card className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <AgentAvatar type={agent.type} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink">{agent.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
                {agent.type === "ai" ? t("AI", "AI") : t("Người", "Human")}
              </span>
            </div>
            {agent.role ? <span className="text-sm text-muted">{agent.role}</span> : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {caps.map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-2.5 py-1 font-mono text-[10px] text-ink2"
            >
              {k} <span className="text-muted">{v.toFixed(2)}</span>
            </span>
          ))}
        </div>
        <ReputationLine rep={rep} />
      </div>
      <TrustControl agent={agent} />
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
      <h2 className="font-mono text-eyebrow font-medium uppercase tracking-[0.14em] text-muted">
        {t("Thêm vào Pool", "Add to Pool")}
      </h2>
      <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
        <SegmentedControl
          ariaLabel={t("Loại", "Type")}
          value={type}
          onChange={setType}
          options={[
            {
              value: "human",
              label: (
                <span className="flex items-center gap-1.5">
                  <HumanIcon size={15} /> {t("Người", "Human")}
                </span>
              ),
            },
            {
              value: "ai",
              label: (
                <span className="flex items-center gap-1.5">
                  <AiIcon size={15} /> {t("AI", "AI")}
                </span>
              ),
            },
          ]}
        />
        <Field label={t("Tên", "Name")}>
          <Input
            placeholder={t("VD: Minh Anh / Qwen-Summarizer", "e.g. Minh Anh / Qwen-Summarizer")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label={t("Tên agent", "Agent name")}
          />
        </Field>
        <Field label={t("Vai trò", "Role")} optional={t("(tuỳ chọn)", "(optional)")}>
          <Input
            placeholder={t("VD: Analyst", "e.g. Analyst")}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label={t("Vai trò", "Role")}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("Chi phí", "Cost")} hint={t("ƯỚC TÍNH", "ESTIMATED")}>
            <Input
              placeholder="0"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              aria-label={t("Chi phí ước tính", "Estimated cost")}
            />
          </Field>
          <Field label={t("Phút", "Minutes")}>
            <Input
              placeholder="0"
              inputMode="numeric"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              aria-label={t("Số phút ước tính", "Estimated minutes")}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">
            {t("Năng lực", "Capabilities")} <span className="font-normal text-muted">(0–1)</span>
          </span>
          {caps.map((c, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder={t("vd: analysis", "e.g. analysis")}
                value={c.cap}
                onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, cap: e.target.value } : x)))}
                aria-label={t(`Tên năng lực ${i + 1}`, `Capability name ${i + 1}`)}
              />
              <Input
                className="w-20 flex-none"
                inputMode="decimal"
                value={c.val}
                onChange={(e) => setCaps((cs) => cs.map((x, j) => (j === i ? { ...x, val: e.target.value } : x)))}
                aria-label={t(`Mức năng lực ${i + 1}`, `Capability level ${i + 1}`)}
              />
              <IconButton
                variant="ghost"
                onClick={() => setCaps((cs) => (cs.length > 1 ? cs.filter((_, j) => j !== i) : cs))}
                aria-label={t("Xoá năng lực", "Remove capability")}
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
            className="self-start text-brand-deep"
          >
            {t("Thêm năng lực", "Add capability")}
          </Button>
        </div>
        <Button type="submit" disabled={!name.trim() || create.isPending} className="mt-1">
          {create.isPending ? t("Đang thêm…", "Adding…") : t("Thêm agent", "Add agent")}
        </Button>
        {create.isError ? (
          <span className="flex items-center gap-1.5 text-sm text-bad">
            <AlertIcon size={16} /> {create.error instanceof HttpError ? create.error.message : t("Lỗi", "Error")}
          </span>
        ) : null}
        {create.isSuccess ? (
          <span className="flex items-center gap-1.5 text-sm text-good">
            <CheckIcon size={16} /> {t("Đã thêm vào Pool", "Added to the Pool")}
          </span>
        ) : null}
      </form>
    </Card>
  );
}
