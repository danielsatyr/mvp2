import { describe, it, expect } from "vitest";
import { mapToGraphMinimal } from "@/features/decision-graph/services/mapToGraph";

describe("mapToGraphMinimal", () => {
  it("crea Start/occ/elig-visas y visas", () => {
    const profile = { userId:1, age:30, englishLevel:"Superior", workExperience_in:2, workExperience_out:5, education_qualification:"Bachelor", occupationId:123, occupation_name:"X" } as any;
    const occ = { occupationId:123, name:"X", skill_assessment_body:"ACS", Skill_Level_Required:1, visa_189:"Yes", visa_190:"No", visa_491:"Yes" } as any;
    const breakdown = { age:30, english:20 } as any;
    const { nodes, links } = mapToGraphMinimal(profile, occ, breakdown);
    expect(nodes.find(n=>n.key==="Start")).toBeTruthy();
    expect(nodes.find(n=>n.key==="occ")).toBeTruthy();
    expect(nodes.find(n=>n.key==="visa-189")).toBeTruthy();
    expect(nodes.find(n=>n.key==="visa-491")).toBeTruthy();
    expect(nodes.find(n=>n.key==="visa-190")).toBeFalsy();
    expect(links.length).toBeGreaterThan(2);
  });
});
