import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUserId: vi.fn(),
  submitHumanResult: vi.fn(),
}));

vi.mock("../../../../../lib/auth", () => ({
  requireAuthenticatedUserId: mocks.requireAuthenticatedUserId,
}));

vi.mock("../../../../../lib/execution/human-service", () => ({
  submitHumanResult: mocks.submitHumanResult,
  HumanServiceError: class extends Error {
    code: string;
    constructor(code: string, msg: string) { super(msg); this.code = code; this.name = "HumanServiceError"; }
  },
}));

vi.mock("../../../../../lib/supabase/admin", () => ({
  supabaseAdmin: () => ({ rpc: vi.fn() }),
}));

describe("POST /api/execution/[id]/submit", () => {
  beforeEach(() => vi.resetAllMocks());

  const execId = "e1000000-0000-0000-0000-000000000001";

  function jsonRequest(body: unknown): Request {
    return new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("returns 200 with HumanSubmitResult on valid submit", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("human-alice");
    mocks.submitHumanResult.mockResolvedValue({
      execution_id: execId,
      task_id: "task-001",
      status: "succeeded",
      task_status: "done",
    });

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ output: "My result" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data.status).toBe("succeeded");
    expect(json.data.task_status).toBe("done");
  });

  it("returns 403 when user is not assignee", async () => {
    const { HumanServiceError } = await import("../../../../../lib/execution/human-service");
    mocks.requireAuthenticatedUserId.mockResolvedValue("wrong-user");
    mocks.submitHumanResult.mockRejectedValue(new HumanServiceError("forbidden", "Not assigned"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ output: "result" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(403);
  });

  it("returns 409 on conflict (different output)", async () => {
    const { HumanServiceError } = await import("../../../../../lib/execution/human-service");
    mocks.requireAuthenticatedUserId.mockResolvedValue("human-alice");
    mocks.submitHumanResult.mockRejectedValue(new HumanServiceError("conflict", "Different output"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ output: "different" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(409);
  });

  it("returns 404 when execution not found", async () => {
    const { HumanServiceError } = await import("../../../../../lib/execution/human-service");
    mocks.requireAuthenticatedUserId.mockResolvedValue("human-alice");
    mocks.submitHumanResult.mockRejectedValue(new HumanServiceError("not_found", "Not found"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ output: "result" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(404);
  });

  it("returns 400 when output is empty", async () => {
    mocks.requireAuthenticatedUserId.mockResolvedValue("human-alice");

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ output: "" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(400);
  });

  it("returns 401 when not authenticated", async () => {
    const { ApiFail } = await import("../../../../../lib/api");
    mocks.requireAuthenticatedUserId.mockRejectedValue(new ApiFail("unauthorized", "Unauthorized"));

    const { POST } = await import("./route");
    const res = await POST(jsonRequest({ output: "result" }), { params: Promise.resolve({ id: execId }) });

    expect(res.status).toBe(401);
  });
});
