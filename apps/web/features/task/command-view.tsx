"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ErrorState, Icon } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { usePipeline, type PipelineResponse } from "./hooks";
import { DecisionArtifact } from "./decision-artifact";
import { CommandComposer } from "./command-composer";

interface Turn {
  id: string;
  title: string;
  status: "pending" | "done" | "error";
  result?: PipelineResponse;
  errorMsg?: string;
}

const EXAMPLES = [
  "Tóm tắt báo cáo thị trường quý 4 và nêu 3 quyết định cần chốt",
  "Soạn phản hồi cho khách hàng đang bức xúc vì giao hàng trễ",
  "Dịch tài liệu kỹ thuật sang tiếng Anh, cần người kiểm tra thuật ngữ",
  "Phân tích doanh số tháng này, đề xuất ai nên xử lý từng việc",
];

export function CommandView() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const pipeline = usePipeline();
  const streamRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  function submit(text?: string) {
    const title = (text ?? input).trim();
    if (!title || pipeline.isPending) return;
    const id = crypto.randomUUID();
    setTurns((t) => [...t, { id, title, status: "pending" }]);
    setInput("");
    pipeline.mutate(
      { title },
      {
        onSuccess: (result) =>
          setTurns((t) => t.map((x) => (x.id === id ? { ...x, status: "done", result } : x))),
        onError: (e) =>
          setTurns((t) =>
            t.map((x) =>
              x.id === id
                ? { ...x, status: "error", errorMsg: e instanceof HttpError ? e.message : "Lỗi xử lý" }
                : x,
            ),
          ),
      },
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)]">
      <div className="flex min-w-0 flex-1 flex-col">
        <div ref={streamRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-6">
            {turns.length === 0 ? (
              <Welcome onPick={submit} />
            ) : (
              <div className="flex flex-col gap-8">
                {turns.map((turn) => (
                  <TurnView key={turn.id} turn={turn} />
                ))}
              </div>
            )}
          </div>
        </div>
        <CommandComposer value={input} onChange={setInput} onSubmit={() => submit()} pending={pipeline.isPending} />
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (t: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
        <div className="human-strip h-1.5" aria-hidden />
        <div className="grid gap-4 p-5 text-left sm:grid-cols-[1.2fr_0.8fr]">
          <div>
            <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--grad-hero)] text-white shadow-[var(--elev-1)]" aria-hidden>
              <Icon name="users" size={23} />
            </span>
            <h2 className="text-xl font-semibold text-ink">Giao việc, hệ thống tự đề xuất người hay AI</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Viết việc như cách bạn giao cho trưởng nhóm. Orchestra trả lời: ai nên làm, có cần AI không, mức rủi
              ro, chi phí/thời gian ước tính và bước kiểm soát trước khi giao.
            </p>
          </div>
          <div className="grid content-start gap-2 text-sm">
            <Signal label="Tốc độ" value="phút" tone="bg-b" />
            <Signal label="Kiểm soát" value="duyệt khi rủi ro" tone="bg-gold" />
            <Signal label="Đo lường" value="cost · quality · SLA" tone="bg-a" />
          </div>
        </div>
      </div>
      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onPick(ex)}
            className="rounded-2xl border border-line bg-card p-4 text-left text-sm font-semibold text-ink2 shadow-[var(--elev-1)] transition-colors hover:border-blue hover:bg-blue-soft [touch-action:manipulation]"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

function Signal({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper/70 p-3">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${tone}`} aria-hidden />
        <span className="font-medium text-ink">{label}</span>
      </div>
      <p className="mt-1 text-xs text-muted">{value}</p>
    </div>
  );
}

function TurnView({ turn }: { turn: Turn }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-b px-4 py-2.5 text-sm text-white">{turn.title}</div>
      </div>
      <div className="flex gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-soft text-blue"
          aria-hidden
        >
          <Icon name="sparkles" size={16} />
        </span>
        <div className="min-w-0 flex-1 space-y-3" aria-live="polite">
          {turn.status === "pending" && <Thinking />}
          {turn.status === "error" && <ErrorState message={turn.errorMsg ?? "Lỗi xử lý"} />}
          {turn.status === "done" && turn.result && <AssistantResult result={turn.result} />}
        </div>
      </div>
    </div>
  );
}

function AssistantResult({ result }: { result: PipelineResponse }) {
  if (result.error_stage && !result.decision) {
    return <ErrorState message={result.error_message ?? "Không định tuyến được việc này."} />;
  }
  if (!result.decision) {
    return <p className="text-sm text-ink2">Đã tạo task.</p>;
  }
  return (
    <div className="space-y-3">
      <ProcessTrace result={result} />
      <DecisionArtifact decision={result.decision} execution={result.execution} />
    </div>
  );
}

function ProcessTrace({ result }: { result: PipelineResponse }) {
  const decision = result.decision;
  if (!decision) return null;

  const confidence = decision.confidence ?? decision.reason.top_fit;
  const selected = decision.candidates.filter((c) => decision.chosen.includes(c.id)).map((c) => c.name);
  const steps = [
    {
      label: "Tạo việc",
      detail: `POST /api/tasks/pipeline · task ${shortId(result.task.id)}`,
      done: true,
    },
    {
      label: "Lập yêu cầu năng lực",
      detail: decision.required.length
        ? decision.required.map((r) => `${capabilityCopy(r.cap)} ${Math.round(r.weight * 100)}%`).join(" · ")
        : "Chưa đủ dữ liệu năng lực",
      done: true,
    },
    {
      label: "So sánh nguồn lực",
      detail: `${decision.candidates.length} người/AI · fit = 70% năng lực + 30% uy tín`,
      done: true,
    },
    {
      label: "Chọn phương án",
      detail: `${selected.join(", ") || "Chưa chọn"} · ${confidence != null ? `${Math.round(confidence * 100)}%` : "chưa đủ dữ liệu"} · rủi ro ${decision.risk === "high" ? "cao" : "thấp"}`,
      done: true,
    },
    {
      label: "Thực thi",
      detail: executionTrace(result),
      done: Boolean(result.execution && result.execution.kind !== "existing"),
    },
  ];

  return (
    <div className="rounded-xl border border-line bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon name="settings" size={16} />
        <p className="text-sm font-semibold text-ink">Quá trình AI xử lý</p>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-5">
        {steps.map((step) => (
          <div key={step.label} className="rounded-lg border border-line bg-paper/60 p-2.5">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${step.done ? "bg-b" : "bg-gold"}`} aria-hidden />
              <p className="text-xs font-semibold text-ink">{step.label}</p>
            </div>
            <p className="mt-1 text-[11px] leading-4 text-muted">{step.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function capabilityCopy(cap: string) {
  const labels: Record<string, string> = {
    summarization: "tóm tắt",
    research: "nghiên cứu",
    email_drafting: "soạn email",
    translation: "dịch thuật",
    meeting_notes: "ghi chú họp",
    writing: "viết",
    analysis: "phân tích",
    coding: "lập trình",
    design: "thiết kế",
  };
  return labels[cap] ?? cap;
}

function executionTrace(result: PipelineResponse) {
  const execution = result.execution;
  if (!execution) return "Chưa gọi executor; đang chờ người bấm chạy hoặc cần người xử lý.";
  if (execution.kind === "ai_success") {
    return `Executor AI đã chạy · ${execution.tokens ?? 0} tokens · ${execution.ms ?? 0}ms`;
  }
  if (execution.kind === "human_pending") return "Đã tạo execution cho người xử lý.";
  if (execution.kind === "denied") return `Governance chặn: ${execution.reason}`;
  if (execution.kind === "escalate") return "Chuyển quản lý xem trước khi làm.";
  if (execution.kind === "ai_failed") return `AI lỗi ${execution.error_code}`;
  return "Execution đã tồn tại, không chạy lặp.";
}

function Thinking() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 py-1 text-sm text-muted"
      aria-label="Đang xử lý"
    >
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </span>
    </motion.div>
  );
}
