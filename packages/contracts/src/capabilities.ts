import { z } from "zod";

/**
 * NGUỒN SỰ THẬT DUY NHẤT cho danh sách capability của Orchestra (Feature 0).
 *
 * Cả Planner output (`required_capabilities[]`) và Pool data (`agents.caps`) đều
 * PHẢI dùng đúng enum này. Nếu hai bên không chung một danh sách cố định →
 * Scoring không match được → `fit` luôn = 0. Không ai được tự bịa capability mới.
 *
 * Căn cứ: 5 AI executor MVP (mục 02/09) + FR-2/FR-3/FR-13 + ví dụ Prompt (mục 16).
 * Quy ước tên: lowercase snake_case, danh từ ngành nghề, không dấu, duy nhất.
 *
 * Lưu ý naming: dùng `analysis` (khớp ví dụ Planner/Router mục 16), KHÔNG `data_analysis`.
 */
export const CAPABILITIES = [
  "summarization", // executor "Summarize PDF"
  "research", // executor "Research"
  "email_drafting", // executor "Write Email"
  "translation", // executor "Translate"
  "meeting_notes", // executor "Meeting Summary"
  "writing", // ví dụ Planner mục 16; hybrid draft (FR-7)
  "analysis", // ví dụ Planner/Router mục 16 ("phân tích")
  "coding", // năng lực người trong Pool (FR-3/13)
  "design", // năng lực người trong Pool (FR-3/13)
] as const;

/** Union literal của mọi capability hợp lệ. */
export type Capability = (typeof CAPABILITIES)[number];

/**
 * Zod enum sinh trực tiếp từ CAPABILITIES — một schema, một nguồn.
 * Dùng cho `generateObject` (structured output, mục 16) và mọi validate runtime.
 */
export const CapabilitySchema = z.enum(CAPABILITIES);

/** Type guard: true nếu `x` là một capability hợp lệ. */
export function isCapability(x: unknown): x is Capability {
  return CapabilitySchema.safeParse(x).success;
}

/**
 * Ép kiểu ở ranh giới I/O. Trả về `Capability` nếu hợp lệ, ném lỗi nếu ngoài enum.
 * Nguồn ép kiểu DÙNG CHUNG cho: Planner output, Pool write, GET /capabilities.
 */
export function assertValidCapability(x: unknown): Capability {
  return CapabilitySchema.parse(x);
}

/** Ép kiểu cho một mảng capability (ví dụ danh sách keys của `agents.caps`). */
export function assertValidCapabilities(xs: unknown): Capability[] {
  return z.array(CapabilitySchema).parse(xs);
}
