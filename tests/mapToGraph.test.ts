import { describe, it, expect } from "vitest";
import { mapToGraphMinimal, mapToGraphWithEligibility } from "../features/decision-graph/services/mapToGraph";
import type {
  Breakdown,
  OccupationRow,
  UserProfile,
  DiagramNode,
  DiagramLink,
} from "../features/decision-graph/types";

describe("mapToGraphMinimal", () => {
  it("crea Start/occ/elig-visas y visas", () => {
    const profile: UserProfile = {
      userId: 1,
      age: 30,
      englishLevel: "Superior",
      workExperience_in: 2,
      workExperience_out: 5,
      education_qualification: "Bachelor",
      occupationId: 123,
      occupation_name: "X",
    };
    const occ: OccupationRow = {
      occupationId: 123,
      name: "X",
      skill_assessment_body: "ACS",
      Skill_Level_Required: 1,
      visa_189: "Yes",
      visa_190: "No",
      visa_491: "Yes",
    };
    const breakdown: Breakdown = { age: 30, english: 20 };
    const { nodes, links } = mapToGraphMinimal(profile, occ, breakdown);

    expect(nodes.find((n) => n.key === "Start")).toBeTruthy();
    expect(nodes.find((n) => n.key === "occ")).toBeTruthy();
    expect(nodes.find((n) => n.key === "visa-189")).toBeTruthy();
    expect(nodes.find((n) => n.key === "visa-491")).toBeTruthy();
    expect(nodes.find((n) => n.key === "visa-190")).toBeFalsy();
    expect(links.length).toBeGreaterThan(2);
  });
  it("marca visas según puntaje", () => {
    const profile = { userId:1, age:30, englishLevel:"Superior", workExperience_in:2, workExperience_out:5, education_qualification:"Bachelor", occupation_id:123, occupation_name:"X" } as any;
    const occ = { occupation_id:123, name:"X", skill_assessment_body:"ACS", Skill_Level_Required:1, visa_189:"Yes", visa_190:"Yes", visa_491:"Yes" } as any;
    const high = { age:30, english:20, other:20 } as any; // 70 pts
    const low = { age:20 } as any; // 20 pts
    const gHigh = mapToGraphMinimal(profile, occ, high);
    const gLow = mapToGraphMinimal(profile, occ, low);
    expect(gHigh.nodes.find(n=>n.key==="visa-189")?.status).toBe("ok");
    expect(gLow.nodes.find(n=>n.key==="visa-189")?.status).toBe("fail");
  });
});

describe("mapToGraphWithEligibility", () => {
  it("resume reglas y determina estado ok/fail", () => {
    const base: { nodes: DiagramNode[]; links: DiagramLink[] } = {
      nodes: [

        { key: "Start", text: "Start", status: "info" },
        { key: "elig-visas", text: "Visas", status: "info" },
        { key: "visa-190", text: "190", status: "info" },
      ],
      links: [
        { from: "Start", to: "elig-visas" },
        { from: "elig-visas", to: "visa-190" },
      ],
    };

    const baseEmpty: { nodes: DiagramNode[]; links: DiagramLink[] } = { nodes: [], links: [] };
    const g = mapToGraphWithEligibility(baseEmpty, {
      profile: {} as UserProfile,
    })!;

    const pathways = [
      { pathwayId:"general", title:"General", prefix:"Gen", rules:[{ field:"study_in_state", op:"==", value:true }], meta:{} }
    ];
    const okProfile = { study_in_state: true } as unknown as UserProfile;
    const failProfile = { study_in_state: false } as unknown as UserProfile;
    const gOk = mapToGraphWithEligibility(base, {
      profile: okProfile,
      selectedVisa: "190",
      states: ["VIC"],
      selectedState: "VIC",
      pathways,
    })!;
    const gFail = mapToGraphWithEligibility(base, {
      profile: failProfile,
      selectedVisa: "190",
      states: ["VIC"],
      selectedState: "VIC",
      pathways,
    })!;
    const pwNode = gOk.nodes.find(n=>n.key === "pw:190:VIC:general");

    const key = "summary:pw:190:VIC:general";
    expect(pwNode?.text).toBe("Gen");

    expect(g.nodes.length).toBe(0);
    expect(gOk.nodes.find((n) => n.key === key)?.status).toBe("ok");
    expect(gFail.nodes.find((n) => n.key === key)?.status).toBe("fail");
  });
});