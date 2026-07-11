import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DecisionResponse } from "@orchestra/contracts";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUser: vi.fn(),
  routeTask: vi.fn(),
  createProductionRouteDecisionService: vi.fn(),
}));

vi.mock("../../../lib/auth", () => ({
  requireAuthenticatedUser: mocks.requireAuthenticatedUser,
}));

vi.mock("../../../lib/decision/production-service", () => ({
  createProductionRouteDecisionService: mocks.createProductionRouteDecisionService,
}));

describe("POST /api/route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("authenticates, validates, routes, and returns a decision", async () => {
    const decision = decisionResponse();
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    mocks.routeTask.mockResolvedValueOnce(decision);
    mocks.createProductionRouteDecisionService.mockReturnValueOnce({ routeTask: mocks.routeTask });
    const { POST } = await import("./route");

    const res = await POST(jsonRequest({ task_id: decision.task_id }), {});

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, data: decision });
    expect(mocks.requireAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.routeTask).toHaveBeenCalledWith(decision.task_id);
  });

  it("returns 400 for invalid bodies", async () => {
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    const { POST } = await import("./route");

    const res = await POST(jsonRequest({ task_id: "not-a-uuid" }), {});

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "validation_error" },
    });
    expect(mocks.routeTask).not.toHaveBeenCalled();
  });

  it("returns 401 before service-role work when unauthenticated", async () => {
    const { ApiFail } = await import("../../../lib/api");
    mocks.requireAuthenticatedUser.mockRejectedValueOnce(new ApiFail("unauthorized", "Unauthorized"));
    const { POST } = await import("./route");

    const res = await POST(jsonRequest({ task_id: decisionResponse().task_id }), {});

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "unauthorized", message: "Unauthorized" },
    });
    expect(mocks.createProductionRouteDecisionService).not.toHaveBeenCalled();
  });

  it("maps task conflicts to 409", async () => {
    const { RouteDecisionServiceError } = await import("../../../lib/decision/service");
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    mocks.routeTask.mockRejectedValueOnce(new RouteDecisionServiceError("conflict", "Task is not routable"));
    mocks.createProductionRouteDecisionService.mockReturnValueOnce({ routeTask: mocks.routeTask });
    const { POST } = await import("./route");

    const res = await POST(jsonRequest({ task_id: decisionResponse().task_id }), {});

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "conflict", message: "Task is not routable" },
    });
  });

  it("maps Qwen planner configuration errors to stable upstream errors", async () => {
    const { QwenPlannerConfigError } = await import("../../../lib/decision/planner-options");
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    mocks.createProductionRouteDecisionService.mockImplementationOnce(() => {
      throw new QwenPlannerConfigError();
    });
    const { POST } = await import("./route");

    const res = await POST(jsonRequest({ task_id: decisionResponse().task_id }), {});

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "upstream_error", message: "Planner provider is not available" },
    });
  });

  it("maps Qwen runtime failures to stable upstream errors", async () => {
    const { RouteDecisionServiceError } = await import("../../../lib/decision/service");
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    mocks.routeTask.mockRejectedValueOnce(
      new RouteDecisionServiceError("upstream_error", "raw qwen provider detail"),
    );
    mocks.createProductionRouteDecisionService.mockReturnValueOnce({ routeTask: mocks.routeTask });
    const { POST } = await import("./route");

    const res = await POST(jsonRequest({ task_id: decisionResponse().task_id }), {});

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      error: { code: "upstream_error", message: "Planner provider is not available" },
    });
  });

  it("returns business escalate as HTTP 200", async () => {
    const decision = { ...decisionResponse(), verdict: "escalate" as const, chosen: [] };
    mocks.requireAuthenticatedUser.mockResolvedValueOnce(undefined);
    mocks.routeTask.mockResolvedValueOnce(decision);
    mocks.createProductionRouteDecisionService.mockReturnValueOnce({ routeTask: mocks.routeTask });
    const { POST } = await import("./route");

    const res = await POST(jsonRequest({ task_id: decision.task_id }), {});

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      data: { verdict: "escalate" },
    });
  });
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/route", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

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
