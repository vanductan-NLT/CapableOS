import type { TaskStatus } from "@orchestra/contracts";

type Tone = "muted" | "a" | "b" | "gold" | "good" | "bad";

export const STATUS_META: Record<TaskStatus, { label: string; tone: Tone }> = {
  created: { label: "Mới tạo", tone: "b" },
  routed: { label: "Đã định tuyến", tone: "a" },
  executing: { label: "AI đang chạy", tone: "a" },
  awaiting_approval: { label: "Chờ duyệt", tone: "gold" },
  awaiting_human: { label: "Chờ người", tone: "gold" },
  review: { label: "Chờ review", tone: "gold" },
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
