// features/decision-graph/types.ts
export type VisaCode = "189" | "190" | "491";

export interface UserProfile {
  userId: number;
  age: number;
  englishLevel: "Competent" | "Proficient" | "Superior";
  workExperience_in: number;
  workExperience_out: number;
  education_qualification: string;
  australianStudy?: boolean;
  regionalStudy?: boolean;
  communityLanguage?: boolean;
  professionalYear?: boolean;
  partnerSkill?: "" | "competentEnglish" | "skill+english" | "singleOrCitizenPR";
  nominationType?: "" | "state" | "family";
  occupationId: number;
  occupation_name: string;
}

export interface OccupationRow {
  occupationId: number;
  name: string;
  anzscoCode?: string;
  skill_assessment_body: string;
  Skill_Level_Required: 1 | 2 | 3 | 4 | 5;
  // H..P de visas (simplificado):
  visa_189: "Yes" | "No";
  visa_190: "Yes" | "No";
  visa_491: "Yes" | "No";
}

export interface SkillLevelRule {
  skillLevel: 1|2|3|4|5;
  minAQF: "Bachelor" | "Diploma" | "Certificate" | "None" | string;
}
export type SkillLevelsTable = SkillLevelRule[];

export interface EligibilityPathwayRule {
  requirement: string;        // ej. "Study in state", "Job offer", "Regional"
  test(profile: UserProfile): boolean;
  hint?: string;              // tooltip / detalle
}

export interface StatePathway {
  pathwayId: string;          // ej. "graduate", "work"
  title: string;              // "Graduate", "Work in State"
  rules: EligibilityPathwayRule[];
}

export interface StateEligibility {
  state: string;              // "WA", "NSW", "VIC" ...
  pathways: StatePathway[];
}

export interface EligibilityFactors {
  occupationId: number;
  visa: VisaCode;             // 190 o 491
  states: StateEligibility[];
}

export interface Breakdown {  // como tu endpoint
  [k: string]: number;        // age, english, workInside, ...
}

export interface DecisionUIState {
  selectedVisa?: VisaCode;    // "190" | "491"
  selectedState?: string;     // "WA"
  selectedPathwayId?: string; // "graduate"
}

export interface DiagramNode {
  key: string;
  text: string;
  isTreeExpanded?: boolean;
  tooltip?: string;
  tooltipHtml?: string;
  status?: "ok" | "warn" | "fail" | "info";
}
export interface DiagramLink { from: string; to: string; label?: string; key?: string; }