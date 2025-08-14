export const ENGLISH_ORDER = ["Competent", "Proficient", "Superior"] as const;
export type EnglishLevel = typeof ENGLISH_ORDER[number];

export function cmpEnglish(a?: string, b?: string) {
  if (!a || !b) return 0;
  const ia = ENGLISH_ORDER.indexOf(a as EnglishLevel);
  const ib = ENGLISH_ORDER.indexOf(b as EnglishLevel);
  if (ia < 0 || ib < 0) return 0;
  return Math.sign(ia - ib); // <=0 cumple a>=b si resultado <=0
}

export function statusFromRule(
  profile: any,
  rule: { field: string; op: string; value: any }
): "ok" | "warn" | "fail" {
  switch (rule.field) {
    case "english":
      if (!profile?.englishLevel || !rule.value) return "warn";
      // perfil debe ser >= requerido → ia >= ib → cmp <= 0
      return cmpEnglish(profile.englishLevel, rule.value) <= 0 ? "ok" : "fail";

    case "study_in_state":
    case "experience_state_required":
    case "experience_overseas_required":
    case "job_offer":
    case "family_sponsorship":
    case "sector_critical":
    case "financial_capacity":
      if (typeof rule.value !== "boolean") return "warn";
      // asumimos profile tiene flags booleanos homónimos; si no, warn
      if (profile?.[rule.field] === undefined) return "warn";
      return profile[rule.field] === rule.value ? "ok" : "fail";

    case "state_min_points":
      if (typeof rule.value !== "number") return "warn";
      if (typeof profile?.points !== "number") return "warn";
      return profile.points >= rule.value ? "ok" : "fail";

    case "study_in_state_level":
      // mismo criterio de orden si defines un ORDER para AQF; por ahora informativo
      return "warn";

    // Campos informativos
    case "residency_requirement":
    case "offshore_condition":
    case "financial_capacity_value":
    case "family_sponsorship_state":
    case "other_requirement":
      return "warn";

    default:
      return "warn";
  }
}
