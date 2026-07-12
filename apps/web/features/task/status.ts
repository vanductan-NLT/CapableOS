import type { TaskStatus } from "@orchestra/contracts";

type Tone = "muted" | "a" | "b" | "gold" | "good" | "bad";
type Translate = (vi: string, en: string) => string;

export const STATUS_META: Record<TaskStatus, { label: { vi: string; en: string }; tone: Tone }> = {
  created: { label: { vi: "Chưa chọn nguồn lực", en: "No resource selected" }, tone: "b" },
  routed: { label: { vi: "Đã chọn nguồn lực", en: "Resource selected" }, tone: "a" },
  executing: { label: { vi: "Đang xử lý", en: "Processing" }, tone: "a" },
  awaiting_approval: { label: { vi: "Cần duyệt", en: "Needs approval" }, tone: "gold" },
  awaiting_human: { label: { vi: "Cần người làm", en: "Needs a person" }, tone: "gold" },
  review: { label: { vi: "Cần kiểm tra", en: "Needs review" }, tone: "gold" },
  done: { label: { vi: "Hoàn thành", en: "Done" }, tone: "good" },
  rejected: { label: { vi: "Từ chối", en: "Rejected" }, tone: "bad" },
};

/** Active-language label for a task status. */
export function statusLabel(status: TaskStatus, t: Translate): string {
  return t(STATUS_META[status].label.vi, STATUS_META[status].label.en);
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
