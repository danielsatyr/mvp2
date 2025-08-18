import { describe, it, expect, vi } from "vitest";

vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      occupation = {
        findMany: vi.fn().mockResolvedValue([
          {
            occupationId: 1,
            name: "Dev",
            Skill_Level_Required: 1,
            skill_assessment_body: "ACS",
            visa_189: "Yes",
            visa_190: "No",
            visa_491: "Yes",
            anzscoCode: "1234",
          },
        ]),
      };
    },
  };
});

import handler from "../../pages/api/occupations";

function createRes() {
  const res: any = {};
  res.statusCode = 0;
  res.body = null;
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  res.setHeader = () => res;
  res.end = () => res;
  return res;
}

describe("GET /api/occupations", () => {
  it("devuelve ocupaciones mapeadas", async () => {
    const req: any = { method: "GET" };
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      {
        occupationId: 1,
        name: "Dev",
        Skill_Level_Required: 1,
        skill_assessment_body: "ACS",
        visa_189: "Yes",
        visa_190: "No",
        visa_491: "Yes",
        anzscoCode: "1234",
      },
    ]);
  });
});