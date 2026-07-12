import type { TaskStatus } from "@orchestra/contracts";
import type { Lang } from "@/lib/i18n";

type Tone = "muted" | "a" | "b" | "gold" | "good" | "bad";

const STATUS: Record<TaskStatus, { vi: string; en: string; tone: Tone }> = {
  created: { vi: "Mới tạo", en: "New", tone: "b" },
  routed: { vi: "Đã định tuyến", en: "Routed", tone: "a" },
  executing: { vi: "AI đang chạy", en: "AI running", tone: "a" },
  awaiting_approval: { vi: "Chờ duyệt", en: "Needs approval", tone: "gold" },
  awaiting_human: { vi: "Chờ người", en: "Awaiting person", tone: "gold" },
  review: { vi: "Chờ review", en: "In review", tone: "gold" },
  done: { vi: "Hoàn thành", en: "Done", tone: "good" },
  rejected: { vi: "Từ chối", en: "Rejected", tone: "bad" },
};

// Backward-compatible VI map (label + tone) — existing callers keep working.
export const STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  created: { label: STATUS.created.vi, tone: "b" },
  routed: { label: STATUS.routed.vi, tone: STATUS.routed.tone },
  executing: { label: STATUS.executing.vi, tone: STATUS.executing.tone },
  awaiting_approval: { label: STATUS.awaiting_approval.vi, tone: STATUS.awaiting_approval.tone },
  awaiting_human: { label: STATUS.awaiting_human.vi, tone: STATUS.awaiting_human.tone },
  review: { label: STATUS.review.vi, tone: STATUS.review.tone },
  done: { label: STATUS.done.vi, tone: STATUS.done.tone },
  rejected: { label: STATUS.rejected.vi, tone: STATUS.rejected.tone },
};

/** Language-aware status label. */
export function statusLabel(status: TaskStatus, lang: Lang = "vi"): string {
  return lang === "en" ? STATUS[status].en : STATUS[status].vi;
}

// Column order for the Kanban board (Playbook /board).
export const BOARD_COLUMNS: TaskStatus[] = [
  "created",
  "routed",
  "executing",
  "awaiting_approval",
  "awaiting_human",
  "review",
  "done",
  "rejected",
];
