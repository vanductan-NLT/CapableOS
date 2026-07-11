import { describe, it, expect } from "vitest";
import {
  CAPABILITIES,
  CapabilitySchema,
  isCapability,
  assertValidCapability,
} from "./capabilities";
import type { RequiredCapability } from "./decision";

describe("capability taxonomy", () => {
  // T1 — accept mọi capability hợp lệ
  it("accepts every declared capability", () => {
    for (const cap of CAPABILITIES) {
      expect(isCapability(cap)).toBe(true);
      expect(() => assertValidCapability(cap)).not.toThrow();
    }
    expect(CapabilitySchema.safeParse("translation").success).toBe(true);
    expect(isCapability("analysis")).toBe(true);
  });

  // T2 — REJECT capability ngoài enum (gồm tên cũ đã đổi)
  it("rejects capabilities outside the enum", () => {
    expect(isCapability("cooking")).toBe(false);
    expect(isCapability("marketing")).toBe(false);
    // đã đổi data_analysis -> analysis: tên cũ PHẢI bị từ chối
    expect(isCapability("data_analysis")).toBe(false);
    expect(() => assertValidCapability("cooking")).toThrow();
    expect(CapabilitySchema.safeParse("data_analysis").success).toBe(false);
  });

  // T3 — khoá shape enum (chống drift ngầm)
  it("locks the enum shape", () => {
    const expected = [
      "summarization",
      "research",
      "email_drafting",
      "translation",
      "meeting_notes",
      "writing",
      "analysis",
      "coding",
      "design",
    ];
    expect([...CAPABILITIES]).toEqual(expected);
    expect(CAPABILITIES.length).toBe(9);
    expect(new Set(CAPABILITIES).size).toBe(CAPABILITIES.length); // unique
    for (const cap of CAPABILITIES) {
      expect(cap).toMatch(/^[a-z]+(_[a-z]+)*$/); // lowercase snake_case
    }
  });

  // T4 — contract dùng đúng union
  it("uses the shared union inside RequiredCapability", () => {
    const req: RequiredCapability = { cap: "translation", weight: 1 };
    expect(isCapability(req.cap)).toBe(true);
    const raw = [{ cap: "analysis" }, { cap: "cooking" }];
    const validated = raw.filter((r) => isCapability(r.cap));
    expect(validated).toHaveLength(1);
  });

  // T5 — Planner ↔ Pool chung 1 enum (chặn fit=0)
  it("keeps Planner and Pool on one enum (prevents fit=0)", () => {
    const poolCaps: Record<string, number> = { analysis: 0.9, writing: 0.7 };
    for (const key of Object.keys(poolCaps)) {
      expect(isCapability(key)).toBe(true);
    }
    const badPool: Record<string, number> = { data_analysis: 0.9 };
    expect(Object.keys(badPool).every(isCapability)).toBe(false);
  });
});
