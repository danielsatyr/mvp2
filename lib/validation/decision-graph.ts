// lib/validation/decision-graph.ts
import { z } from "zod";

export const ProfileInputSchema = z.object({
  occupationCode: z.string().min(4).max(6),
  age: z.number().int().min(18).max(55),
  englishLevel: z.enum(["Competent", "Proficient", "Superior"]),
  yearsExperience: z.number().int().min(0).max(40),
  statePreference: z.string().optional(), // e.g. "NSW"
});

export type ProfileInput = z.infer<typeof ProfileInputSchema>;