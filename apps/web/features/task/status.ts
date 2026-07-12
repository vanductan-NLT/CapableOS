import type { TaskStatus } from "@orchestra/contracts";

type Tone = "muted" | "a" | "b" | "gold" | "good" | "bad";

export const STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  created: { label: "Chưa chọn nguồn lực", tone: "b" },
  routed: { label: "Đã chọn nguồn lực", tone: "a" },
  executing: { label: "Đang xử lý", tone: "a" },
  awaiting_approval: { label: "Cần duyệt", tone: "gold" },
  awaiting_human: { label: "Cần người làm", tone: "gold" },
  review: { label: "Cần kiểm tra", tone: "gold" },
  done: { label: "Hoàn thành", tone: "good" },
  rejected: { label: "Từ chối", tone: "bad" },
};

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
