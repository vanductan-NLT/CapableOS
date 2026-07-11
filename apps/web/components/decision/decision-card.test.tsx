import { describe, expect, it } from "vitest";
import { formatMetric, getVerdictConfig } from "./decision-utils";

describe("DecisionCard helpers", () => {
  // ── getVerdictConfig ────────────────────────────────────────

  describe("getVerdictConfig", () => {
    it('verdict=ai → tone "a", label "AI"', () => {
      const config = getVerdictConfig("ai");
      expect(config.tone).toBe("a");
      expect(config.label).toBe("AI");
    });

    it('verdict=human → tone "b", label "Con người"', () => {
      const config = getVerdictConfig("human");
      expect(config.tone).toBe("b");
      expect(config.label).toBe("Con người");
    });

    it('verdict=hybrid → tone "gold", label "Kết hợp"', () => {
      const config = getVerdictConfig("hybrid");
      expect(config.tone).toBe("gold");
      expect(config.label).toBe("Kết hợp");
    });

    it('verdict=escalate → tone "bad", label "Chuyển cấp"', () => {
      const config = getVerdictConfig("escalate");
      expect(config.tone).toBe("bad");
      expect(config.label).toBe("Chuyển cấp");
    });
  });

  // ── formatMetric ────────────────────────────────────────────

  describe("formatMetric", () => {
    it("returns dash for null confidence", () => {
      expect(formatMetric(null)).toBe("—");
    });

    it("does NOT return '0%' for null (no fake zero)", () => {
      expect(formatMetric(null)).not.toBe("0%");
      expect(formatMetric(null)).not.toBe("0");
    });

    it("formats 0.85 as 85%", () => {
      expect(formatMetric(0.85)).toBe("85%");
    });

    it("formats 0 as 0%", () => {
      expect(formatMetric(0)).toBe("0%");
    });

    it("formats 1 as 100%", () => {
      expect(formatMetric(1)).toBe("100%");
    });

    it("formats 0.123 as 12% (rounds down)", () => {
      expect(formatMetric(0.123)).toBe("12%");
    });
  });
});
