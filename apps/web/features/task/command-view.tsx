"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { usePipeline, useTasks, type PipelineResponse } from "./hooks";
import { STATUS_META } from "./status";

export function CommandView() {
  return (
    <div className="grid gap-6 md:grid-cols-[1fr_320px]">
      <CommandInput />
      <RecentTasks />
    </div>
  );
}

function CommandInput() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [lastResult, setLastResult] = useState<PipelineResponse | null>(null);
  const pipeline = usePipeline();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLastResult(null);
    pipeline.mutate(
      { title: title.trim(), description: desc.trim() || undefined },
      {
        onSuccess: (data) => {
          setLastResult(data);
          setTitle("");
          setDesc("");
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h1 className="text-lg font-semibold">Giao một công việc</h1>
        <p className="mt-1 text-sm text-muted">
          Nhập bằng ngôn ngữ thường. Hệ thống sẽ tự động định tuyến và thực thi AI nếu phù hợp.
        </p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Việc cần làm</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tóm tắt báo cáo thị trường quý 4 (30 trang)"
              className="rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-b"
              aria-label="Tiêu đề công việc"
              maxLength={200}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">
              Mô tả <span className="text-muted">(tuỳ chọn)</span>
            </span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Bối cảnh, yêu cầu, ràng buộc…"
              rows={3}
              className="resize-y rounded-lg border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-b"
              aria-label="Mô tả công việc"
              maxLength={4000}
            />
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!title.trim() || pipeline.isPending}
              className="rounded-lg bg-b px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
            >
              {pipeline.isPending ? "Đang xử lý…" : "Giao việc"}
            </button>
            {pipeline.isError ? (
              <span className="text-sm text-bad">
                {pipeline.error instanceof HttpError ? pipeline.error.message : "Lỗi tạo task"}
              </span>
            ) : null}
          </div>
        </form>
      </Card>

      {/* Pipeline progress indicator */}
      {pipeline.isPending && (
        <Card className="animate-pulse">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-b border-t-transparent" />
            <span className="text-sm text-muted">Đang phân tích → định tuyến → thực thi…</span>
          </div>
        </Card>
      )}

      {/* Pipeline result */}
      {lastResult && <PipelineResult result={lastResult} />}
    </div>
  );
}

function PipelineResult({ result }: { result: PipelineResponse }) {
  const { decision, execution, error_stage, error_message } = result;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Kết quả định tuyến</h2>
        {decision && (
          <Badge tone={decision.verdict === "ai" ? "a" : decision.verdict === "human" ? "b" : "muted"}>
            {decision.verdict.toUpperCase()}
          </Badge>
        )}
      </div>

      {decision && (
        <div className="space-y-2">
          <p className="text-sm text-ink2">{decision.reasoning}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            <span>Confidence: <strong>{((decision.confidence ?? 0) * 100).toFixed(0)}%</strong></span>
            <span>Risk: <strong>{decision.risk}</strong></span>
            {decision.chosen.length > 0 && (
              <span>Giao cho: <strong>{decision.chosen.join(", ")}</strong></span>
            )}
          </div>
        </div>
      )}

      {/* AI execution result */}
      {execution?.kind === "ai_success" && (
        <div className="rounded-lg border border-good/30 bg-good/5 p-3">
          <p className="text-xs font-medium uppercase text-good">✓ AI đã thực thi xong</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{execution.output}</p>
          <p className="mt-2 font-mono text-[11px] text-muted">
            {execution.tokens != null && `${execution.tokens} tokens`}
            {execution.ms != null && ` · ${execution.ms}ms`}
          </p>
        </div>
      )}

      {/* Human pending */}
      {execution?.kind === "human_pending" && (
        <div className="rounded-lg border border-line bg-paper p-3">
          <p className="text-sm text-ink2">
            🧑 Đã giao cho người: <strong>{execution.assignee_id}</strong>. Đang chờ hoàn thành.
          </p>
        </div>
      )}

      {/* Escalate */}
      {decision?.verdict === "escalate" && (
        <div className="rounded-lg border border-bad/30 bg-bad/5 p-3">
          <p className="text-sm text-bad">
            ⚠️ Không tìm thấy ứng viên phù hợp. Cần người quản lý xem xét.
          </p>
        </div>
      )}

      {/* Governance denied */}
      {execution?.kind === "denied" && (
        <div className="rounded-lg border border-bad/30 bg-bad/5 p-3">
          <p className="text-sm text-bad">🚫 Bị chặn bởi governance: {execution.reason}</p>
        </div>
      )}

      {/* Error at some stage */}
      {error_stage && (
        <div className="rounded-lg border border-bad/20 bg-bad/5 p-3">
          <p className="text-xs font-medium uppercase text-bad">Lỗi ở bước: {error_stage}</p>
          <p className="mt-1 text-sm text-bad/80">{error_message}</p>
        </div>
      )}
    </Card>
  );
}

function RecentTasks() {
  const { data, isLoading, isError, error, refetch } = useTasks();
  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Gần đây</h2>
        <Link href="/board" className="text-xs text-b hover:underline">
          Xem Board →
        </Link>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error instanceof HttpError ? error.message : "Không tải được"} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Chưa có task nào" hint="Tạo task đầu tiên ở ô bên trái." />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.slice(0, 6).map((t) => (
            <li key={t.id} className="rounded-lg border border-line px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2 text-sm">{t.title}</span>
                <Badge tone={STATUS_META[t.status].tone}>{STATUS_META[t.status].label}</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
