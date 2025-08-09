// types/occupation.ts

export interface VisaFlags {
  code: string;
  enabled: boolean;
}

export interface StateFactor {
  state: string;
  pathway: string | null;
  requisito: string;
  valor: string;
}

export interface EligibilityResponse {
  occupationId: number;
  name: string;
  skillLevelRequired: string;
  skillAssessmentBody: string;
  visas: VisaFlags[];
  stateFactors: StateFactor[];
}

export type OccupationDetailResponse = {
  id: number;
  occupationId: string;
  name: string;
  anzscoCode: string;
  skillAssessmentBody: string;
  skillLevelRequired: string | null;
  lists: {
    mltssl: boolean;
    stsol: boolean;
    rol: boolean;
  };
  eligibleSubclasses: string[];
};
