import { describe, it, expect } from "vitest";
import { statusFromRule } from "../features/decision-graph/utils/scoringHelpers";

describe("statusFromRule english comparison", () => {
  const rule = { field: "english", op: "==", value: "Proficient" } as const;

  it("returns fail when profile level is lower than required", () => {
    const profile = { englishLevel: "Competent" };
    expect(statusFromRule(profile, rule)).toBe("fail");
  });

  it("returns ok when profile level equals required", () => {
    const profile = { englishLevel: "Proficient" };
    expect(statusFromRule(profile, rule)).toBe("ok");
  });

  it("returns ok when profile level is higher than required", () => {
    const profile = { englishLevel: "Superior" };
    expect(statusFromRule(profile, rule)).toBe("ok");
  });
});

describe("statusFromRule experience years", () => {
  const fields = ["experience_state_years", "experience_overseas_years"] as const;

  for (const field of fields) {
    describe(field, () => {
      it("returns ok when profile meets or exceeds required years", () => {
        const profile = { [field]: 3 } as any;
        const rule = { field, op: ">=", value: 2 };
        expect(statusFromRule(profile, rule)).toBe("ok");
      });

      it("returns fail when profile lacks required years", () => {
        const profile = { [field]: 1 } as any;
        const rule = { field, op: ">=", value: 2 };
        expect(statusFromRule(profile, rule)).toBe("fail");
      });

      it("returns warn when profile is missing data", () => {
        const profile = {} as any;
        const rule = { field, op: ">=", value: 2 };
        expect(statusFromRule(profile, rule)).toBe("warn");
      });
    });
  }
});