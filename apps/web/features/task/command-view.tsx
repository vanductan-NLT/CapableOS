"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { HttpError } from "@/lib/http";
import { useCreateTask, useTasks } from "./hooks";
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
  const create = useCreateTask();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate(
      { title: title.trim(), description: desc.trim() || undefined },
      { onSuccess: () => (setTitle(""), setDesc("")) },
    );
  }

  return (
    <Card>
      <h1 className="text-lg font-semibold">Giao một công việc</h1>
      <p className="mt-1 text-sm text-muted">
        Nhập bằng ngôn ngữ thường. Hệ thống sẽ định tuyến cho người, AI, hay cả hai.
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
            disabled={!title.trim() || create.isPending}
            className="rounded-lg bg-b px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {create.isPending ? "Đang tạo…" : "Tạo task"}
          </button>
          {create.isSuccess ? <span className="text-sm text-good">✓ Đã đưa lên Task Board</span> : null}
          {create.isError ? (
            <span className="text-sm text-bad">
              {create.error instanceof HttpError ? create.error.message : "Lỗi tạo task"}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-muted">
          Sau khi tạo, task ở trạng thái “Mới tạo”. Bước định tuyến người/AI do domain Decision (A) xử lý qua{" "}
          <code>POST /route</code>.
        </p>
      </form>
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
