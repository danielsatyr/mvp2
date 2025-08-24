import { describe, it, expect } from "vitest";
import { visaStatus } from "../features/decision-graph/services/mapToGraph";

describe("visaStatus thresholds", () => {
  it("returns warn at 55 total points for visa 190", () => {
    expect(visaStatus("190", 50)).toBe("warn");
  });

  it("returns ok at 65 total points for visa 190", () => {
    expect(visaStatus("190", 60)).toBe("ok");
  });

  it("returns warn at 55 total points for visa 491", () => {
    expect(visaStatus("491", 40)).toBe("warn");
  });

  it("returns ok at 65 total points for visa 491", () => {
    expect(visaStatus("491", 50)).toBe("ok");
  });
});
    