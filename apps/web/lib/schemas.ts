import { z } from "zod";
import { CapabilitySchema, type TaskStatus } from "@orchestra/contracts";

export const TASK_STATUSES = [
  "created",
  "routed",
  "executing",
  "awaiting_approval",
  "awaiting_human",
  "review",
  "done",
  "rejected",
] as const satisfies readonly TaskStatus[];

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: "Cần nhập tiêu đề công việc" })
    .trim()
    .min(1, "Tiêu đề không được để trống")
    .max(200),
  description: z.string().trim().max(4000).optional(),
});

export const patchTaskSchema = z
  .object({
    status: z.enum(TASK_STATUSES).optional(),
    assignee_id: z.string().min(1).nullable().optional(),
    result: z.string().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, "Cần ít nhất một trường để cập nhật");

export const feedbackSchema = z.object({
  task_id: z.string({ required_error: "Thiếu task_id" }).uuid("task_id phải là UUID"),
  rating: z.enum(["pass", "fail"], { required_error: "Thiếu rating (pass|fail)" }),
  note: z.string().trim().max(2000).optional(),
});

export const routeRequestSchema = z.object({
  task_id: z.string({ required_error: "Thiếu task_id" }).uuid("task_id phải là UUID"),
});

export const decisionIdSchema = z.string().uuid("decision id phải là UUID");

// Feature 0: Pool caps PHẢI dùng đúng taxonomy chung (CapabilitySchema), không tự bịa cap mới.
const capsSchema = z.record(CapabilitySchema, z.number().min(0).max(1));

export const newAgentSchema = z.object({
  id: z.string().trim().min(1).optional(),
  type: z.enum(["human", "ai"], { required_error: "Cần chọn loại: human | ai" }),
  name: z.string({ required_error: "Cần nhập tên" }).trim().min(1, "Tên không được để trống"),
  role: z.string().trim().optional(),
  trust: z.number().int().min(0).max(100).optional(),
  cost: z.number().nonnegative().optional(),
  minutes: z.number().int().nonnegative().optional(),
  caps: capsSchema.optional(),
});

export const patchAgentSchema = z
  .object({
    type: z.enum(["human", "ai"]).optional(),
    name: z.string().trim().min(1).optional(),
    role: z.string().trim().nullable().optional(),
    trust: z.number().int().min(0).max(100).optional(),
    cost: z.number().nonnegative().nullable().optional(),
    minutes: z.number().int().nonnegative().nullable().optional(),
    caps: capsSchema.optional(),
  })
  .refine((o) => Object.keys(o).length > 0, "Cần ít nhất một trường để cập nhật");

// ── Execution schemas (Feature 4.4) ────────────────────────

export const executeSchema = z.object({
  decision_id: z.string({ required_error: "Thiếu decision_id" }).uuid("decision_id phải là UUID"),
  input: z.unknown().optional(),
});

export const submitResultSchema = z.object({
  output: z
    .string({ required_error: "Thiếu output" })
    .trim()
    .min(1, "Output không được để trống")
    .max(50_000),
});

export const reviewSchema = z.object({
  outcome: z.enum(["approve", "reject"], { required_error: "Thiếu outcome (approve|reject)" }),
  note: z.string().trim().max(2000).optional(),
});

export const executionIdSchema = z.string().uuid("execution id phải là UUID");

