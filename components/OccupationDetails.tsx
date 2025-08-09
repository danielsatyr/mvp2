// components/OccupationDetails.tsx
// Muestra datos de `Occupation` (columnas: name, skillLevelRequired, skillAssessmentBody) devueltos por `/api/occupations/[id]`
import React from "react";

export function OccupationDetails({
  name,
  skillLevelRequired,
  skillAssessmentBody,
}: {
  name: string;
  skillLevelRequired: string;
  skillAssessmentBody: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 mb-4">
      <h2 className="text-xl font-semibold mb-2">{name}</h2>
      <p>
        <strong>Skill Level Required:</strong> {skillLevelRequired}
      </p>
      <p>
        <strong>Assessment Body:</strong> {skillAssessmentBody}
      </p>
    </div>
  );
}
