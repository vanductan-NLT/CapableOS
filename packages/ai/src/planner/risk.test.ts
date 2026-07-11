import { describe, expect, it } from "vitest";
import { fallbackExtract } from "./fallback";
import { classifyRisk } from "./risk";

describe("classifyRisk", () => {
  it.each([
    ["Tóm tắt báo cáo nội bộ", "low"],
    ["Gửi email cho đối tác", "high"],
    ["Xóa dữ liệu khách hàng cũ", "high"],
    ["Ký hợp đồng pháp lý", "high"],
    ["Send customer update email", "high"],
  ] as const)("classifies %s as %s", (title, risk) => {
    expect(classifyRisk({ title })).toBe(risk);
  });
});

describe("fallbackExtract", () => {
  it.each([
    ["Tóm tắt báo cáo", ["summarization"]],
    ["Research và viết blog", ["research", "writing"]],
    ["Dịch biên bản cuộc họp", ["translation", "meeting_notes"]],
    ["Thiết kế UI dashboard", ["design"]],
    ["Implement code phân tích dữ liệu", ["analysis", "coding"]],
  ] as const)("extracts capabilities for %s", (title, caps) => {
    expect(fallbackExtract({ title }).map((item) => item.cap)).toEqual(caps);
  });

  it("returns no required capabilities when no enum capability matches", () => {
    expect(fallbackExtract({ title: "Chuẩn bị onboarding" })).toEqual([]);
  });
});
