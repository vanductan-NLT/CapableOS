import { CAPABILITIES, isCapability, type Risk } from "@orchestra/contracts";
import { MockLanguageModelV2 } from "ai/test";
import { describe, expect, it } from "vitest";
import { plan } from "./plan";

const usage = {
  inputTokens: 10,
  outputTokens: 10,
  totalTokens: 20,
};

describe("plan", () => {
  it("uses the expected Feature 0 capability taxonomy", () => {
    expect(CAPABILITIES).toHaveLength(9);
  });

  it.each([
    {
      title: "Tóm tắt 30 trang báo cáo thị trường quý 4",
      output: {
        required: [
          { cap: "summarization", weight: 0.7 },
          { cap: "analysis", weight: 0.3 },
        ],
        missing: [],
        rationale: "Cần tóm tắt và phân tích báo cáo.",
      },
      risk: "low",
    },
    {
      title: "Dịch hợp đồng sang tiếng Anh rồi gửi đối tác",
      output: {
        required: [{ cap: "translation", weight: 1 }],
        missing: [],
        rationale: "Cần dịch nội dung hợp đồng.",
      },
      risk: "high",
    },
    {
      title: "Xoá toàn bộ dữ liệu khách hàng cũ",
      output: {
        required: [{ cap: "analysis", weight: 1 }],
        missing: ["data deletion operation"],
        rationale: "Cần xác định phạm vi dữ liệu.",
      },
      risk: "high",
    },
    {
      title: "Nghiên cứu và viết blog về AI",
      output: {
        required: [
          { cap: "research", weight: 0.5 },
          { cap: "writing", weight: 0.5 },
        ],
        missing: [],
        rationale: "Cần nghiên cứu và viết bài.",
      },
      risk: "low",
    },
    {
      title: "Viết biên bản cuộc họp nội bộ tuần này",
      output: {
        required: [{ cap: "meeting_notes", weight: 1 }],
        missing: [],
        rationale: "Cần tạo biên bản họp.",
      },
      risk: "low",
    },
  ] satisfies Array<{
    title: string;
    output: PlannerModelOutput;
    risk: Risk;
  }>)("returns enum capabilities and $risk risk for $title", async ({ title, output, risk }) => {
    const result = await plan({ title }, { model: modelWithObject(output) });

    expect(result).toMatchSnapshot();
    expect(result.risk).toBe(risk);
    expect(result.required.every((item) => isCapability(item.cap))).toBe(true);
  });

  it("does not throw on timeout and returns fallback with high risk", async () => {
    const result = await plan(
      { title: "Nghiên cứu và viết blog về AI" },
      { model: hangingModel(), timeoutMs: 10 },
    );

    expect(result.risk).toBe("high");
    expect(result.required.map((item) => item.cap)).toEqual(["research", "writing"]);
  });

  it("does not throw on invalid model capability and falls back to enum capabilities", async () => {
    const result = await plan(
      { title: "Viết blog về AI" },
      {
        model: modelWithObject({
          required: [{ cap: "cooking", weight: 1 }],
          missing: [],
          rationale: "Capability không hợp lệ.",
        }),
      },
    );

    expect(result.risk).toBe("high");
    expect(result.required.every((item) => isCapability(item.cap))).toBe(true);
    expect(result.required.map((item) => item.cap)).toEqual(["writing"]);
  });

  it("logs LLM rationale and missing fields without exposing them publicly", async () => {
    const logs: unknown[] = [];
    const result = await plan(
      { title: "Dịch tài liệu" },
      {
        model: modelWithObject({
          required: [{ cap: "translation", weight: 1 }],
          missing: ["rare dialect"],
          rationale: "Cần dịch tài liệu.",
        }),
        log: (event) => logs.push(event),
      },
    );

    expect(result).toEqual({
      required: [{ cap: "translation", weight: 1 }],
      risk: "low",
    });
    expect(logs).toEqual([
      {
        source: "llm",
        missing: ["rare dialect"],
        rationale: "Cần dịch tài liệu.",
      },
    ]);
  });

  it("returns unresolved high-risk output when LLM fails and fallback finds no capability", async () => {
    const result = await plan(
      { title: "Chuẩn bị onboarding" },
      { model: hangingModel(), timeoutMs: 10 },
    );

    expect(result).toEqual({
      required: [],
      risk: "high",
    });
  });

  it("merges duplicate capabilities from the LLM output and preserves first-seen order", async () => {
    const result = await plan(
      { title: "Phân tích và tóm tắt" },
      {
        model: modelWithObject({
          required: [
            { cap: "analysis", weight: 0.6 },
            { cap: "summarization", weight: 0.5 },
            { cap: "analysis", weight: 0.2 },
          ],
          missing: [],
          rationale: "Cần phân tích và tóm tắt.",
        }),
      },
    );

    expect(result.required.map((item) => item.cap)).toEqual(["analysis", "summarization"]);
    expect(result.required[0].weight).toBeCloseTo(0.8 / 1.3);
    expect(result.required[1].weight).toBeCloseTo(0.5 / 1.3);
    expect(result.required.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1);
  });
});

interface PlannerModelOutput {
  required: Array<{
    cap: string;
    weight: number;
  }>;
  missing: string[];
  rationale: string;
}

function modelWithObject(output: PlannerModelOutput): MockLanguageModelV2 {
  return new MockLanguageModelV2({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(output) }],
      finishReason: "stop",
      usage,
      warnings: [],
    }),
  });
}

function hangingModel(): MockLanguageModelV2 {
  return new MockLanguageModelV2({
    doGenerate: async ({ abortSignal }) =>
      new Promise<never>((_, reject) => {
        abortSignal?.addEventListener("abort", () => {
          reject(new Error("aborted"));
        });
      }),
  });
}

expect.addSnapshotSerializer({
  serialize: (value) => JSON.stringify(value, null, 2),
  test: (value) =>
    typeof value === "object" &&
    value !== null &&
    "required" in value &&
    "risk" in value,
});
