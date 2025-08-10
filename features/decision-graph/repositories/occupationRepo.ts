// features/decision-graph/repositories/occupationRepo.ts

export type Occupation = {
  code: string;          // e.g., "2613"
  name: string;          // e.g., "Software and Applications Programmers"
  anzsco?: string;
  statesEligible?: string[]; // mock para ejemplo
};

export interface OccupationRepo {
  getByCode(code: string): Promise<Occupation | null>;
}

// Implementación mock (temporal). Luego la cambiamos a Prisma.
class InMemoryOccupationRepo implements OccupationRepo {
  private data: Record<string, Occupation> = {
    "2613": {
      code: "2613",
      name: "Software and Applications Programmers",
      statesEligible: ["NSW", "VIC", "QLD"],
    },
    "2339": {
      code: "2339",
      name: "Other Engineering Professionals",
      statesEligible: ["SA", "WA"],
    },
  };

  async getByCode(code: string): Promise<Occupation | null> {
    return this.data[code] ?? null;
  }
}

// Export default como la implementación por defecto (mock por ahora)
export const occupationRepo: OccupationRepo = new InMemoryOccupationRepo();