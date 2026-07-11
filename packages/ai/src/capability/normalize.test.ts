import { describe, expect, it } from "vitest";
import { CapabilityNormalizationError, normalizeCapabilities } from "./normalize";

describe("normalizeCapabilities", () => {
  it("normalizes a single valid capability", () => {
    expect(normalizeCapabilities([{ cap: "analysis", weight: 1 }])).toEqual([
      { cap: "analysis", weight: 1 },
    ]);
  });

  it("normalizes multiple capabilities whose total is not 1", () => {
    const result = normalizeCapabilities([
      { cap: "analysis", weight: 0.6 },
      { cap: "summarization", weight: 0.5 },
    ]);

    expect(result[0].weight).toBeCloseTo(0.6 / 1.1);
    expect(result[1].weight).toBeCloseTo(0.5 / 1.1);
    expect(result.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1);
  });

  it("merges duplicate capabilities and preserves first-seen order", () => {
    const result = normalizeCapabilities([
      { cap: "analysis", weight: 0.6 },
      { cap: "summarization", weight: 0.5 },
      { cap: "analysis", weight: 0.2 },
    ]);

    expect(result.map((item) => item.cap)).toEqual(["analysis", "summarization"]);
    expect(result[0].weight).toBeCloseTo(0.8 / 1.3);
    expect(result[1].weight).toBeCloseTo(0.5 / 1.3);
  });

  it("drops capabilities with zero weight", () => {
    expect(
      normalizeCapabilities([
        { cap: "analysis", weight: 0 },
        { cap: "summarization", weight: 0.5 },
      ]),
    ).toEqual([{ cap: "summarization", weight: 1 }]);
  });

  it("rejects invalid capabilities", () => {
    expect(() =>
      normalizeCapabilities([{ cap: "cooking" as "analysis", weight: 1 }]),
    ).toThrowError(new CapabilityNormalizationError("Invalid capability at index 0: cooking"));
  });

  it("rejects negative weights", () => {
    expect(() => normalizeCapabilities([{ cap: "analysis", weight: -0.1 }])).toThrowError(
      new CapabilityNormalizationError(
        "Invalid weight at index 0: weight must be finite and between 0 and 1",
      ),
    );
  });

  it("rejects weights greater than 1", () => {
    expect(() => normalizeCapabilities([{ cap: "analysis", weight: 1.1 }])).toThrowError(
      new CapabilityNormalizationError(
        "Invalid weight at index 0: weight must be finite and between 0 and 1",
      ),
    );
  });

  it("rejects NaN and Infinity weights", () => {
    expect(() => normalizeCapabilities([{ cap: "analysis", weight: Number.NaN }])).toThrowError(
      new CapabilityNormalizationError(
        "Invalid weight at index 0: weight must be finite and between 0 and 1",
      ),
    );
    expect(() => normalizeCapabilities([{ cap: "analysis", weight: Number.POSITIVE_INFINITY }])).toThrowError(
      new CapabilityNormalizationError(
        "Invalid weight at index 0: weight must be finite and between 0 and 1",
      ),
    );
  });

  it("rejects empty input", () => {
    expect(() => normalizeCapabilities([])).toThrowError(
      new CapabilityNormalizationError("Required capabilities must not be empty"),
    );
  });

  it("does not mutate the input", () => {
    const input = [
      { cap: "analysis", weight: 0.6 },
      { cap: "summarization", weight: 0.5 },
      { cap: "analysis", weight: 0.2 },
    ] as const;

    const snapshot = structuredClone(input);

    normalizeCapabilities([...input]);

    expect(input).toEqual(snapshot);
  });

  it("rejects arrays whose weights become empty after zero filtering", () => {
    expect(() =>
      normalizeCapabilities([
        { cap: "analysis", weight: 0 },
        { cap: "summarization", weight: 0 },
      ]),
    ).toThrowError(
      new CapabilityNormalizationError(
        "Required capabilities must contain at least one positive weight",
      ),
    );
  });
});
