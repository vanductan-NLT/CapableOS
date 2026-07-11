import { describe, expect, it, vi } from "vitest";
import { executeTask } from "./execute";
import type { ExecutorRunInput, ExecutorOptions } from "./types";

// ── Mock generateText ───────────────────────────────────────

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

import { generateText } from "ai";

const mockGenerateText = vi.mocked(generateText);

// ── Fixtures ────────────────────────────────────────────────

const fakeModel = {} as ExecutorOptions["model"];

function makeOptions(overrides?: Partial<ExecutorOptions>): ExecutorOptions {
  return { model: fakeModel, timeoutMs: 5000, ...overrides };
}

function summarizeInput(): ExecutorRunInput {
  return {
    type: "summarize",
    input: {
      task_title: "Summarize report",
      content: "This is a long document about AI systems...",
    },
  };
}

function researchInput(): ExecutorRunInput {
  return {
    type: "research",
    input: {
      task_title: "Research topic",
      query: "What are the benefits of microservices?",
    },
  };
}

function emailInput(): ExecutorRunInput {
  return {
    type: "email",
    input: {
      task_title: "Write email",
      intent: "Follow up on meeting",
      tone: "formal",
    },
  };
}

function translateInput(): ExecutorRunInput {
  return {
    type: "translate",
    input: {
      task_title: "Translate text",
      content: "Hello world",
      target_language: "Vietnamese",
    },
  };
}

function meetingInput(): ExecutorRunInput {
  return {
    type: "meeting",
    input: {
      task_title: "Meeting notes",
      transcript: "Alice: We need to ship by Friday. Bob: Agreed.",
    },
  };
}

// ── Tests ───────────────────────────────────────────────────

describe("executeTask", () => {
  describe("successful execution", () => {
    it("summarize executor returns output + tokens + ms", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "This is a summary of the document.",
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
      } as never);

      const result = await executeTask(summarizeInput(), makeOptions());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.output).toBe("This is a summary of the document.");
        expect(result.data.tokens).toBe(150);
        expect(result.data.cost).toBeNull();
        expect(result.data.ms).toBeGreaterThanOrEqual(0);
      }
    });

    it("research executor returns output", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "Key findings about microservices...",
        usage: { promptTokens: 80, completionTokens: 120, totalTokens: 200 },
      } as never);

      const result = await executeTask(researchInput(), makeOptions());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.output).toBe("Key findings about microservices...");
        expect(result.data.tokens).toBe(200);
      }
    });

    it("email executor returns drafted email", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "Subject: Follow up\n\nDear team...",
        usage: { promptTokens: 60, completionTokens: 80, totalTokens: 140 },
      } as never);

      const result = await executeTask(emailInput(), makeOptions());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.output).toContain("Subject: Follow up");
      }
    });

    it("translate executor returns translated text", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "Xin chào thế giới",
        usage: { promptTokens: 30, completionTokens: 10, totalTokens: 40 },
      } as never);

      const result = await executeTask(translateInput(), makeOptions());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.output).toBe("Xin chào thế giới");
      }
    });

    it("meeting executor returns meeting summary", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "## Key Decisions\n- Ship by Friday",
        usage: { promptTokens: 50, completionTokens: 30, totalTokens: 80 },
      } as never);

      const result = await executeTask(meetingInput(), makeOptions());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.output).toContain("Key Decisions");
      }
    });

    it("handles null usage gracefully (tokens = null)", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "Some output",
        usage: undefined,
      } as never);

      const result = await executeTask(summarizeInput(), makeOptions());

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.tokens).toBeNull();
      }
    });
  });

  describe("input validation failures", () => {
    it("returns VALIDATION_ERROR when required field missing", async () => {
      const badInput: ExecutorRunInput = {
        type: "summarize",
        input: { task_title: "Test" }, // missing "content"
      };

      const result = await executeTask(badInput, makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("VALIDATION_ERROR");
        expect(result.error.retryable).toBe(false);
        expect(result.error.error_message).toContain("Input validation failed");
      }
    });

    it("returns VALIDATION_ERROR for empty task_title", async () => {
      const badInput: ExecutorRunInput = {
        type: "research",
        input: { task_title: "", query: "something" },
      };

      const result = await executeTask(badInput, makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("VALIDATION_ERROR");
        expect(result.error.retryable).toBe(false);
      }
    });
  });

  describe("empty output", () => {
    it("returns VALIDATION_ERROR when model returns empty text", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "",
        usage: { promptTokens: 10, completionTokens: 0, totalTokens: 10 },
      } as never);

      const result = await executeTask(summarizeInput(), makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("VALIDATION_ERROR");
        expect(result.error.retryable).toBe(false);
        expect(result.error.error_message).toContain("empty output");
      }
    });

    it("returns VALIDATION_ERROR when model returns whitespace-only text", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "   \n  ",
        usage: { promptTokens: 10, completionTokens: 1, totalTokens: 11 },
      } as never);

      const result = await executeTask(summarizeInput(), makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("VALIDATION_ERROR");
      }
    });
  });

  describe("provider errors", () => {
    it("classifies AbortError as TIMEOUT (retryable)", async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      mockGenerateText.mockRejectedValueOnce(abortError);

      const result = await executeTask(summarizeInput(), makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("TIMEOUT");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("classifies network error as NETWORK_ERROR (retryable)", async () => {
      mockGenerateText.mockRejectedValueOnce(new Error("fetch failed"));

      const result = await executeTask(researchInput(), makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("NETWORK_ERROR");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("classifies 429 rate limit as LLM_ERROR (retryable)", async () => {
      mockGenerateText.mockRejectedValueOnce(new Error("429 rate limit exceeded"));

      const result = await executeTask(emailInput(), makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("LLM_ERROR");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("classifies 500 server error as LLM_ERROR (retryable)", async () => {
      mockGenerateText.mockRejectedValueOnce(new Error("500 internal server error"));

      const result = await executeTask(translateInput(), makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("LLM_ERROR");
        expect(result.error.retryable).toBe(true);
      }
    });

    it("classifies unknown error as LLM_ERROR (retryable)", async () => {
      mockGenerateText.mockRejectedValueOnce(new Error("something unexpected"));

      const result = await executeTask(meetingInput(), makeOptions());

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.error_code).toBe("LLM_ERROR");
        expect(result.error.retryable).toBe(true);
      }
    });
  });

  describe("generateText call parameters", () => {
    it("passes system prompt and JSON user prompt", async () => {
      mockGenerateText.mockResolvedValueOnce({
        text: "output",
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      } as never);

      await executeTask(summarizeInput(), makeOptions());

      expect(mockGenerateText).toHaveBeenCalledWith(
        expect.objectContaining({
          model: fakeModel,
          system: expect.stringContaining("Summarize"),
          prompt: expect.stringContaining("task_title"),
          temperature: 0.3,
          abortSignal: expect.any(AbortSignal),
        }),
      );
    });
  });
});
