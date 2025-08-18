import { describe, it, expect, vi as jest } from 'vitest';

jest.mock('@/lib/prisma', () => ({
  prisma: { occupation: { findUnique: jest.fn() } },
}));

import handler from '@/pages/api/occupations/[id]';
import { prisma } from '@/lib/prisma';

function createMockRes() {
  const res: any = {};
  res.status = jest.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation((data: any) => {
    res.body = data;
    return res;
  });
  return res;
}

describe('GET /api/occupations/[id]', () => {
  it('returns 404 if occupation not found', async () => {
    (prisma.occupation as any).findUnique = jest.fn().mockResolvedValueOnce(null);
    const req: any = { query: { id: '1' } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('returns occupation data when found', async () => {
    (prisma.occupation as any).findUnique = jest.fn().mockResolvedValueOnce({
      id: 1,
      occupationId: 1,
      name: 'Developer',
      anzscoCode: '1234',
      skillAssessmentBody: 'ABC',
      mltsslFlag: true,
      stsolFlag: false,
      rolFlag: false,
      subclass190: true,
      subclass189Pt: false,
      subclass186: false,
      subclass491St: false,
      subclass491F: false,
      subclass494: false,
      subclass482: false,
      subclass407: false,
      subclass485: false,
      skillLevelRequired: null,
    });
    const req: any = { query: { id: '1' } };
    const res = createMockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toMatchObject({ id: 1, name: 'Developer' });
  });
});