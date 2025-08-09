// app/api/decision-graph/route.ts
import { NextResponse } from "next/server";
import { ProfileInputSchema } from "@/lib/validation/decision-graph";
import { buildDecisionGraph } from "@/features/decision-graph/services/buildDecisionGraph";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = ProfileInputSchema.parse(json);
    const dto = await buildDecisionGraph(parsed);
    return NextResponse.json(dto);
  } catch (err: any) {
    const msg = err?.message ?? "Invalid request";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}