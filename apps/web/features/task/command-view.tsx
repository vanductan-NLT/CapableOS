"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertIcon,
  ArrowRightIcon,
  Badge,
  Button,
  Card,
  CheckIcon,
  CommandIcon,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Skeleton,
  Textarea,
} from "@orchestra/ui";
import { HttpError } from "@/lib/http";
import { PageHeader } from "@/components/page-header";
import { useCreateTask, useTasks } from "./hooks";
import { STATUS_META } from "./status";

export function CommandView() {
  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        eyebrow="Command"
        title="Giao một công việc"
        lead="Nhập bằng ngôn ngữ thường. Hệ thống định tuyến cho người, AI, hay cả hai — rồi thực thi và đo lường."
        icon={<CommandIcon size={20} />}
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <CommandInput />
        <RecentTasks />
      </div>
    </div>
  );
}

function CommandInput() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const create = useCreateTask();

  function submit() {
    if (!title.trim() || create.isPending) return;
    create.mutate(
      { title: title.trim(), description: desc.trim() || undefined },
      { onSuccess: () => (setTitle(""), setDesc("")) },
    );
  }

  // ⌘/Ctrl + Enter to submit from any field (power-user affordance).
  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        onKeyDown={onKeyDown}
        className="flex flex-col gap-4"
      >
        <Field label="Việc cần làm">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Tóm tắt báo cáo thị trường quý 4 (30 trang)"
            aria-label="Tiêu đề công việc"
            maxLength={200}
            autoFocus
          />
        </Field>
        <Field label="Mô tả" optional>
          <Textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Bối cảnh, yêu cầu, ràng buộc…"
            rows={4}
            aria-label="Mô tả công việc"
            maxLength={4000}
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!title.trim() || create.isPending} rightIcon={<ArrowRightIcon size={16} />}>
            {create.isPending ? "Đang tạo…" : "Tạo task"}
          </Button>
          <kbd className="hidden rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[10px] text-muted sm:inline">
            ⌘ + Enter
          </kbd>
          {create.isSuccess ? (
            <span className="flex items-center gap-1.5 text-sm text-good">
              <CheckIcon size={16} /> Đã đưa lên Task Board
            </span>
          ) : null}
          {create.isError ? (
            <span className="flex items-center gap-1.5 text-sm text-bad">
              <AlertIcon size={16} /> {create.error instanceof HttpError ? create.error.message : "Lỗi tạo task"}
            </span>
          ) : null}
        </div>
      </form>
      <p className="border-t border-line pt-3 text-xs text-muted">
        Sau khi tạo, task ở trạng thái <span className="font-medium text-ink2">“Mới tạo”</span>. Bước định tuyến người/AI
        do domain Decision (A) xử lý qua <code className="rounded bg-line/60 px-1.5 py-0.5 font-mono text-[11px]">POST /route</code>.
      </p>
    </Card>
  );
}

function RecentTasks() {
  const { data, isLoading, isError, error, refetch } = useTasks();
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">Gần đây</h2>
        <Link
          href="/board"
          className="flex items-center gap-1 text-xs font-medium text-b transition-colors hover:text-b-deep"
        >
          Xem Board <ArrowRightIcon size={13} />
        </Link>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[52px] w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error instanceof HttpError ? error.message : "Không tải được"} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Chưa có task nào" hint="Tạo task đầu tiên ở ô bên trái." />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.slice(0, 6).map((t) => (
            <li
              key={t.id}
              className="flex items-start justify-between gap-2 rounded-xl border border-line px-3 py-2.5 transition-colors hover:border-b-line hover:bg-b-soft/40"
            >
              <span className="line-clamp-2 text-sm text-ink2">{t.title}</span>
              <Badge tone={STATUS_META[t.status].tone} dot>
                {STATUS_META[t.status].label}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
