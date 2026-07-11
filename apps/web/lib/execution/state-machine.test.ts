import { describe, expect, it } from "vitest";
import {
  availableEvents,
  canTransition,
  InvalidTransitionError,
  isActive,
  isTerminal,
  transition,
} from "./state-machine";

describe("execution state machine", () => {
  // ── Allowed transitions ─────────────────────────────────────

  describe("allowed transitions", () => {
    it("pending → running via start", () => {
      expect(transition("pending", "start")).toBe("running");
    });

    it("pending → cancelled via cancel", () => {
      expect(transition("pending", "cancel")).toBe("cancelled");
    });

    it("running → succeeded via succeed", () => {
      expect(transition("running", "succeed")).toBe("succeeded");
    });

    it("running → failed via fail", () => {
      expect(transition("running", "fail")).toBe("failed");
    });

    it("running → cancelled via cancel", () => {
      expect(transition("running", "cancel")).toBe("cancelled");
    });
  });

  // ── Forbidden transitions ───────────────────────────────────

  describe("forbidden transitions", () => {
    it("succeeded → any throws (terminal)", () => {
      expect(() => transition("succeeded", "start")).toThrow(InvalidTransitionError);
      expect(() => transition("succeeded", "succeed")).toThrow(InvalidTransitionError);
      expect(() => transition("succeeded", "fail")).toThrow(InvalidTransitionError);
      expect(() => transition("succeeded", "cancel")).toThrow(InvalidTransitionError);
    });

    it("failed → any throws (terminal per attempt)", () => {
      expect(() => transition("failed", "start")).toThrow(InvalidTransitionError);
      expect(() => transition("failed", "succeed")).toThrow(InvalidTransitionError);
      expect(() => transition("failed", "fail")).toThrow(InvalidTransitionError);
      expect(() => transition("failed", "cancel")).toThrow(InvalidTransitionError);
    });

    it("cancelled → any throws (terminal)", () => {
      expect(() => transition("cancelled", "start")).toThrow(InvalidTransitionError);
      expect(() => transition("cancelled", "succeed")).toThrow(InvalidTransitionError);
      expect(() => transition("cancelled", "fail")).toThrow(InvalidTransitionError);
      expect(() => transition("cancelled", "cancel")).toThrow(InvalidTransitionError);
    });

    it("pending → succeeded throws (must go through running)", () => {
      expect(() => transition("pending", "succeed")).toThrow(InvalidTransitionError);
    });

    it("pending → failed throws (must go through running)", () => {
      expect(() => transition("pending", "fail")).toThrow(InvalidTransitionError);
    });

    it("running → pending throws (no reverse)", () => {
      expect(() => transition("running", "start")).toThrow(InvalidTransitionError);
    });
  });

  // ── Error message format ────────────────────────────────────

  describe("error messages", () => {
    it("includes current status and event in message", () => {
      try {
        transition("succeeded", "start");
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidTransitionError);
        const err = e as InvalidTransitionError;
        expect(err.from).toBe("succeeded");
        expect(err.event).toBe("start");
        expect(err.message).toContain("succeeded");
        expect(err.message).toContain("start");
      }
    });
  });

  // ── canTransition ───────────────────────────────────────────

  describe("canTransition", () => {
    it("returns true for valid transitions", () => {
      expect(canTransition("pending", "start")).toBe(true);
      expect(canTransition("running", "succeed")).toBe(true);
      expect(canTransition("running", "fail")).toBe(true);
      expect(canTransition("running", "cancel")).toBe(true);
      expect(canTransition("pending", "cancel")).toBe(true);
    });

    it("returns false for invalid transitions", () => {
      expect(canTransition("succeeded", "start")).toBe(false);
      expect(canTransition("failed", "start")).toBe(false);
      expect(canTransition("cancelled", "start")).toBe(false);
      expect(canTransition("pending", "succeed")).toBe(false);
      expect(canTransition("pending", "fail")).toBe(false);
    });
  });

  // ── availableEvents ─────────────────────────────────────────

  describe("availableEvents", () => {
    it("pending has start and cancel", () => {
      const events = availableEvents("pending");
      expect(events).toContain("start");
      expect(events).toContain("cancel");
      expect(events).toHaveLength(2);
    });

    it("running has succeed, fail, cancel", () => {
      const events = availableEvents("running");
      expect(events).toContain("succeed");
      expect(events).toContain("fail");
      expect(events).toContain("cancel");
      expect(events).toHaveLength(3);
    });

    it("terminal statuses have no available events", () => {
      expect(availableEvents("succeeded")).toHaveLength(0);
      expect(availableEvents("failed")).toHaveLength(0);
      expect(availableEvents("cancelled")).toHaveLength(0);
    });
  });

  // ── isTerminal ──────────────────────────────────────────────

  describe("isTerminal", () => {
    it("succeeded is terminal", () => {
      expect(isTerminal("succeeded")).toBe(true);
    });

    it("failed is terminal", () => {
      expect(isTerminal("failed")).toBe(true);
    });

    it("cancelled is terminal", () => {
      expect(isTerminal("cancelled")).toBe(true);
    });

    it("pending is not terminal", () => {
      expect(isTerminal("pending")).toBe(false);
    });

    it("running is not terminal", () => {
      expect(isTerminal("running")).toBe(false);
    });
  });

  // ── isActive ────────────────────────────────────────────────

  describe("isActive", () => {
    it("pending is active", () => {
      expect(isActive("pending")).toBe(true);
    });

    it("running is active", () => {
      expect(isActive("running")).toBe(true);
    });

    it("succeeded is not active", () => {
      expect(isActive("succeeded")).toBe(false);
    });

    it("failed is not active", () => {
      expect(isActive("failed")).toBe(false);
    });

    it("cancelled is not active", () => {
      expect(isActive("cancelled")).toBe(false);
    });
  });
});
