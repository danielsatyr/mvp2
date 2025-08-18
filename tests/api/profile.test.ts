import handler from "../../pages/api/profile";
import { describe, it, expect } from "vitest";

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

describe("GET /api/profile", () => {
  it("requiere autenticación", async () => {
    const req: any = { method: "GET", headers: {} };
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Unauthorized" });
  });
});
