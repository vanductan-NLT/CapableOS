import { describe, expect, it } from "vitest";
import { checkGovernance, resolveGovernanceAction } from "./governance";

describe("checkGovernance", () => {
  // ── Deny cases ──────────────────────────────────────────────

  it('returns deny for "delete_data"', () => {
    const result = checkGovernance({ action: "delete_data" });
    expect(result.gate).toBe("deny");
    expect(result.reason).toContain("delete_data");
  });

  it('returns deny for "delete_user"', () => {
    const result = checkGovernance({ action: "delete_user" });
    expect(result.gate).toBe("deny");
    expect(result.reason).toContain("delete_user");
  });

  it('returns deny for "modify_permissions"', () => {
    const result = checkGovernance({ action: "modify_permissions" });
    expect(result.gate).toBe("deny");
    expect(result.reason).toContain("modify_permissions");
  });

  // ── Approval cases ──────────────────────────────────────────

  it('returns approval for "send:email"', () => {
    const result = checkGovernance({ action: "send:email" });
    expect(result.gate).toBe("approval");
    expect(result.reason).toContain("approval");
  });

  it('returns approval for "send_email"', () => {
    const result = checkGovernance({ action: "send_email" });
    expect(result.gate).toBe("approval");
  });

  it('returns approval for "external_communication"', () => {
    const result = checkGovernance({ action: "external_communication" });
    expect(result.gate).toBe("approval");
  });

  // ── Allow cases (default) ──────────────────────────────────

  it('returns allow for "summarize"', () => {
    const result = checkGovernance({ action: "summarize" });
    expect(result.gate).toBe("allow");
  });

  it("returns allow for unknown actions (default)", () => {
    const result = checkGovernance({ action: "some_random_action" });
    expect(result.gate).toBe("allow");
  });

  it('returns allow for "research"', () => {
    const result = checkGovernance({ action: "research" });
    expect(result.gate).toBe("allow");
  });

  it('returns allow for "translate"', () => {
    const result = checkGovernance({ action: "translate" });
    expect(result.gate).toBe("allow");
  });

  it('returns allow for "meeting"', () => {
    const result = checkGovernance({ action: "meeting" });
    expect(result.gate).toBe("allow");
  });
});

describe("resolveGovernanceAction", () => {
  it("maps email executor to send:email", () => {
    expect(resolveGovernanceAction("email")).toBe("send:email");
  });

  it("maps summarize executor to summarize", () => {
    expect(resolveGovernanceAction("summarize")).toBe("summarize");
  });

  it("maps research executor to research", () => {
    expect(resolveGovernanceAction("research")).toBe("research");
  });

  it("maps translate executor to translate", () => {
    expect(resolveGovernanceAction("translate")).toBe("translate");
  });

  it("maps meeting executor to meeting", () => {
    expect(resolveGovernanceAction("meeting")).toBe("meeting");
  });
});
