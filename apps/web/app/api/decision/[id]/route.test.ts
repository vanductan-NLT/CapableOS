import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecisionResponse } from "@orchestra/contracts";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  getDecisionById: vi.fn(),
  createDecisionRepository: vi.fn(),
  supabaseAdmin: vi.fn(),
}));

vi.mock("../../../../lib/auth", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));

vi.mock("../../../../lib/decision/repository", () => ({
  createDecisionRepository: mocks.createDecisionRepository,
}));

vi.mock("../../../../lib/supabase/admin", () => ({
  supabaseAdmin: mocks.supabaseAdmin,
}));

describe("GET /api/decision/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("authenticates and returns a decision", async () => {
    const decision = decisionResponse();
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    mocks.getDecisionById.mockResolvedValueOnce(decision);
    mocks.createDecisionRepository.mockReturnValueOnce({ getDecisionById: mocks.getDecisionById });
    const { GET } = await import("./route");

    const res = await GET(new Request(`http://localhost/api/decision/${decision.id}`), {
      params: Promise.resolve({ id: decision.id }),
    });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, data: decision });
    expect(mocks.getDecisionById).toHaveBeenCalledWith(decision.id);
  });

  it("returns 400 for invalid ids", async () => {
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    const { GET } = await import("./route");

    const res = await GET(new Request("http://localhost/api/decision/nope"), {
      params: Promise.resolve({ id: "nope" }),
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });
    expect(mocks.getDecisionById).not.toHaveBeenCalled();
  });

  it("returns 401 before repository access when unauthenticated", async () => {
    const { ApiFail } = await import("../../../../lib/api");
    mocks.requireAuthenticatedUser.mockRejectedValueOnce(new ApiFail("unauthorized", "Unauthorized"));
    const { GET } = await import("./route");

    const res = await GET(new Request(`http://localhost/api/decision/${decisionResponse().id}`), {
      params: Promise.resolve({ id: decisionResponse().id }),
    });

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    expect(mocks.createDecisionRepository).not.toHaveBeenCalled();
  });

  it("returns 404 when decision is missing", async () => {
    const decision = decisionResponse();
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    mocks.getDecisionById.mockResolvedValueOnce(null);
    mocks.createDecisionRepository.mockReturnValueOnce({ getDecisionById: mocks.getDecisionById });
    const { GET } = await import("./route");

    const res = await GET(new Request(`http://localhost/api/decision/${decision.id}`), {
      params: Promise.resolve({ id: decision.id }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "not_found", message: `Decision ${decision.id} was not found` },
    });
  });

  it("does not call route service or engine", async () => {
    const decision = decisionResponse();
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    mocks.getDecisionById.mockResolvedValueOnce(decision);
    mocks.createDecisionRepository.mockReturnValueOnce({ getDecisionById: mocks.getDecisionById });
    const { GET } = await import("./route");

    await GET(new Request(`http://localhost/api/decision/${decision.id}`), {
      params: Promise.resolve({ id: decision.id }),
    });

    expect(mocks.getDecisionById).toHaveBeenCalledOnce();
  });
});

function decisionResponse(): DecisionResponse {
  return {
    id: "0ef906bb-5107-480b-b612-1c38bd7a2b36",
    task_id: "9a06c23e-1c6e-4b2a-9a61-51b8f8f7ff30",
    required: [{ cap: "summarization", weight: 1 }],
    risk: "low",
    candidates: [],
    verdict: "ai",
    chosen: ["ai-summarize"],
    confidence: null,
    ambiguity: null,
    reason: {
      code: "TOP_CANDIDATE_AI_LOW_RISK",
      selected_candidate_ids: ["ai-summarize"],
      ambiguity: null,
    },
    reasoning: "The top candidate was an AI agent and the task was low risk.",
    governance: null,
    cost_est: 0.3,
    minutes_est: 1,
    estimated: true,
    created_at: "2026-07-12T00:00:00.000Z",
  };
}
