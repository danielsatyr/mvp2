// pages/dashboard.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import type { GetServerSideProps } from "next";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

// Import del hook; OJO con el tipo `Profile`: lo aliaso para no mezclarlo con el de SSR/UI
import {
  useDecisionGraph,
  type Profile as GraphProfile,
} from "@/features/decision-graph/hooks/useDecisionGraph";

// Demo / diagrama real
import DecisionDiagramMock from "@/components/DecisionDiagramMock";
const DecisionDiagram = dynamic(() => import("@/components/DecisionDiagram"), {
  ssr: false,
});

// -------------------------
// Tipos locales para el SSR/UI (no usar los del hook aquí)
type UiProfile = {
  userId?: number;
  age?: number;
  englishLevel?: string;
  workExperience_in?: number;
  workExperience_out?: number;
  education_qualification?: string;
  study_requirement?: string | null;
  regional_study?: string | null;
  professional_year?: string | null;
  natti?: string | null;
  partner?: string | null;
  nomination_sponsorship?: string | null;
  visaSubclass?: "189" | "190" | "491" | null;
  occupation?: { name: string; anzscoCode: string } | null;
  occupationId?: string | number | null; // puede ser numérico
  anzscoCode?: string | null; // preferimos este si existe
  skillAssessmentBody?: string | null;
};

interface DashboardProps {
  userName: string;
  profile: UiProfile | null;
  breakdown: Record<string, number>;
}
// -------------------------

export default function Dashboard({
  userName,
  profile,
  breakdown,
}: DashboardProps) {
  // Alternar demo/real por query ?demo=1
  const [showMock, setShowMock] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      return url.searchParams.get("demo") === "1";
    }
    return false;
  });

  // Total de puntos (suma de breakdown)
  const totalPoints = Object.values(breakdown ?? {}).reduce(
    (acc, n) => acc + (n || 0),
    0
  );

  // Extractor seguro de ANZSCO (evita `.match` sobre `never`)
  const extractAnzsco = (v: unknown): string | undefined => {
    if (typeof v === "string") {
      return v.match(/\b\d{6}\b/)?.[0];
    }
    if (typeof v === "number") {
      return String(v).match(/\b\d{6}\b/)?.[0];
    }
    return undefined;
  };

  // Preferimos profile.anzscoCode o el de la relación occupation
  const extractedAnzsco: string | undefined =
    (typeof profile?.anzscoCode === "string" && profile.anzscoCode.trim()) ||
    (profile?.occupation?.anzscoCode
      ? String(profile.occupation.anzscoCode)
      : undefined) ||
    extractAnzsco(profile?.occupationId) ||
    undefined;

    const validEnglish = ["Competent", "Proficient", "Superior"] as const;

  // Perfil para el hook (tipado del hook, sin forzar el SSR a ese tipo)
  const profileForHook: GraphProfile = {
    anzscoCode: extractedAnzsco,
    englishLevel: validEnglish.includes(profile?.englishLevel as any)
  ? (profile?.englishLevel as GraphProfile["englishLevel"])
  : undefined,
    points: totalPoints,
    userId: profile?.userId,
    age: profile?.age,
    // Si tu GraphProfile no define esto, no pasa nada: el hook lo ignorará si no lo usa
    skillAssessmentBody: profile?.skillAssessmentBody ?? null,
  };

  // UI runtime (selección de visa/estado/pathway)
  const [ui, setUi] = useState<{
    selectedVisa?: "189" | "190" | "491";
    selectedState?: string;
    selectedPathwayId?: string;
  }>(() => {
    const vs =
      (profile?.visaSubclass as "189" | "190" | "491" | undefined) || undefined;
    return {
      selectedVisa: vs === "190" || vs === "491" ? vs : undefined,
      selectedState: undefined,
      selectedPathwayId: undefined,
    };
  });

  // Hook: datos → grafo
  const { graph, visas, states, pathways, loading: isLoading, error } =
    useDecisionGraph(profileForHook, ui);

  const nodes = graph?.nodes ?? [];
  const links = graph?.links ?? [];

  const refresh = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  // Selección de visa por defecto (prefiere 190 si está)
  useEffect(() => {
    if (!ui.selectedVisa && Array.isArray(visas) && visas.length) {
      setUi((u) => ({
        ...u,
        selectedVisa: (visas.includes("190") ? "190" : visas[0]) as
          | "189"
          | "190"
          | "491",
      }));
    }
  }, [visas, ui.selectedVisa]);
  useEffect(() => {
  if (!ui.selectedState && Array.isArray(states) && states.length) {
    const first = typeof states[0] === "object" && states[0] !== null && "state" in (states[0] as any)
      ? String((states[0] as any).state)
      : String(states[0]);
    setUi((u) => ({ ...u, selectedState: first }));
  }
}, [states, ui.selectedState]);

  // Datos para el radar
  const radarData = Object.entries(breakdown ?? {}).map(
    ([subject, value]) => ({
      subject,
      value,
    })
  );

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {/* Cabecera */}
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Hola, {userName}</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={refresh}
            className="px-3 py-2 rounded bg-white border hover:bg-gray-50"
            title="Refrescar datos del diagrama"
          >
            Refresh
          </button>
          <Link
            href="/form"
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Modificar perfil
          </Link>
        </div>
      </header>

      {/* Score y detalles */}
      <section className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl">Tu puntuación: {totalPoints} puntos</h2>
        <ul className="grid grid-cols-2 gap-4">
          <li>
            <strong>Visado:</strong> {profile?.visaSubclass || "N/D"}
          </li>
          <li>
            <strong>Ocupación Anzsco:</strong>{" "}
            {profile?.occupation
              ? `${profile.occupation.name} (${profile.occupation.anzscoCode})`
              : extractedAnzsco || "N/D"}
          </li>
          <li>
            <strong>Edad:</strong> {profile?.age ?? "N/D"}
          </li>
          <li>
            <strong>Experiencia AU:</strong>{" "}
            {profile?.workExperience_in ?? 0} años
          </li>
          <li>
            <strong>Experiencia fuera AU:</strong>{" "}
            {profile?.workExperience_out ?? 0} años
          </li>
          <li>
            <strong>Inglés:</strong> {profile?.englishLevel || "N/D"}
          </li>
          <li>
            <strong>Educación:</strong>{" "}
            {profile?.education_qualification || "N/D"}
          </li>
          <li>
            <strong>Requisito de estudio AU:</strong>{" "}
            {profile?.study_requirement || "No"}
          </li>
          <li>
            <strong>Estudio regional AU:</strong>{" "}
            {profile?.regional_study || "No"}
          </li>
          <li>
            <strong>Professional Year:</strong>{" "}
            {profile?.professional_year || "No"}
          </li>
          <li>
            <strong>Idioma comunitario:</strong> {profile?.natti || "No"}
          </li>
          <li>
            <strong>Partner skills:</strong> {profile?.partner || "No aplica"}
          </li>
          <li>
            <strong>Nominación/Patrocinio:</strong>{" "}
            {profile?.nomination_sponsorship || "No"}
          </li>
        </ul>
      </section>

      {/* Gráfico radial */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl mb-4">Fortalezas y Debilidades</h3>
        <div className="w-full overflow-x-auto">
          <RadarChart
            cx="50%"
            cy="50%"
            outerRadius="80%"
            width={400}
            height={400}
            data={radarData}
          >
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis />
            <Radar name="Puntos" dataKey="value" fill="#8884d8" fillOpacity={0.6} />
          </RadarChart>
        </div>
      </section>

      {/* Rutas válidas */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl mb-4">Rutas válidas</h3>
        <ul className="list-disc pl-6">
          {nodes
            .filter((n) => n.key.startsWith("summary:") && n.status === "ok")
            .map((n) => {
              const pw = nodes.find((x) => x.key === n.parent);
              const st = pw ? nodes.find((x) => x.key === pw.parent) : undefined;
              const visa = st ? nodes.find((x) => x.key === st.parent) : undefined;
              return (
                <li key={n.key}>
                  {visa?.text || visa?.key} / {st?.text} / {pw?.text}
                </li>
              );
            })}
        </ul>
      </section>

      {/* Diagrama dinámico */}
      <section className="bg-white p-6 rounded shadow">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl">Diagrama de decisiones</h3>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {showMock ? "Vista: Demo (maqueta animada)" : "Vista: Diagrama real"}
            </div>
            <button
              type="button"
              onClick={() => setShowMock((v) => !v)}
              className="px-3 py-1.5 rounded-md text-sm border shadow-sm bg-white hover:bg-gray-50"
              title="Alternar entre demo y diagrama real"
            >
              {showMock ? "Ver diagrama real" : "Ver demo"}
            </button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 text-sm text-gray-600 mb-3">
          <span className="inline-flex items-center gap-2">
            <span
              style={{
                width: 12,
                height: 12,
                background: "#22c55e",
                display: "inline-block",
                borderRadius: 3,
              }}
            />
            OK
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              style={{
                width: 12,
                height: 12,
                background: "#f59e0b",
                display: "inline-block",
                borderRadius: 3,
              }}
            />
            Advertencia
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              style={{
                width: 12,
                height: 12,
                background: "#ef4444",
                display: "inline-block",
                borderRadius: 3,
              }}
            />
            No cumple
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              style={{
                width: 12,
                height: 12,
                background: "#1976d2",
                display: "inline-block",
                borderRadius: 3,
              }}
            />
            Info
          </span>
        </div>

        {/* Panel de depuración (útil mientras iteramos) */}
        <div className="text-xs font-mono bg-gray-50 p-2 rounded mb-3">
          <div>loading: {String(isLoading)}</div>
          <div>error: {error ? String((error as any)?.message || error) : "null"}</div>
          <div>anzscoCode: {String(profileForHook.anzscoCode)}</div>
          <div>
            selectedVisa: {String(ui.selectedVisa)} | selectedState:{" "}
            {String(ui.selectedState)} | selectedPathwayId:{" "}
            {String(ui.selectedPathwayId)}
          </div>
          <div>visas: {JSON.stringify(visas)}</div>
          <div>states: {JSON.stringify(states)}</div>
          <div>pathways: {JSON.stringify(pathways?.map((p) => p.pathwayId))}</div>
          <div>
            graph: nodes={nodes.length} links={links.length}
          </div>
        </div>

        {/* Render del diagrama */}
        {showMock ? (
          <div className="w-full">
            <DecisionDiagramMock
              nodeDataArray={nodes as any}
              linkDataArray={links as any}
            />
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center border-dashed border-2 border-gray-300 w-full">
            {isLoading ? (
              <span className="text-gray-500">Cargando diagrama…</span>
            ) : nodes.length && links.length ? (
              <DecisionDiagram
                nodeDataArray={nodes as any}
                linkDataArray={links as any}
              />
            ) : error ? (
              <span className="text-red-600">No se pudo cargar el diagrama.</span>
            ) : (
              <span className="text-gray-500">Sin datos para mostrar todavía…</span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// Utilidad SSR
const toBoolSSR = (v: any) =>
  v === true || v === "Yes" || v === "yes" || v === "1" || v === "true";

// -------------------------
// Server-side: auth + carga de perfil + breakdown
export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.token;
    if (!token)
      return { redirect: { destination: "/login", permanent: false } };

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    const userId = payload?.userId;
    if (!userId)
      return { redirect: { destination: "/login", permanent: false } };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const dbProfile = await prisma.profile.findUnique({
      where: { userId },
      include: { occupation: true },
    });

    const uiProfile: UiProfile | null = dbProfile
      ? (JSON.parse(JSON.stringify(dbProfile)) as UiProfile)
      : null;

    // --- Breakdown (reglas simples y estables)
    type PayloadProfile = {
      visaSubclass: "189" | "190" | "491";
      age: number;
      englishLevel: "Competent" | "Proficient" | "Superior" | string;
      workExperience_out: number;
      workExperience_in: number;
      education_qualification:
        | "doctorate"
        | "bachelor"
        | "diploma"
        | "assessed"
        | "none"
        | string;
      australianStudy: boolean;
      regionalStudy: boolean;
      professionalYear: boolean;
      communityLanguage: boolean;
      partnerSkill:
        | "meets_all"
        | "competent_english"
        | "single_or_au_partner"
        | string
        | "";
      nominationType: "state" | "family" | "none" | string | "";
    };

    const payloadProfile: PayloadProfile | null = dbProfile
      ? {
          visaSubclass:
            ((dbProfile as any).visaSubclass as "189" | "190" | "491") || "189",
          age: Number((dbProfile as any).age ?? 0),
          englishLevel:
            ((dbProfile as any).englishLevel as any) || "Competent",
          workExperience_out: Number(
            (dbProfile as any).workExperience_out ?? 0
          ),
          workExperience_in: Number(
            (dbProfile as any).workExperience_in ?? 0
          ),
          education_qualification:
            ((dbProfile as any).education_qualification as any) || "none",
          australianStudy: toBoolSSR((dbProfile as any).study_requirement),
          communityLanguage: toBoolSSR((dbProfile as any).natti),
          regionalStudy: toBoolSSR((dbProfile as any).regional_study),
          professionalYear: toBoolSSR((dbProfile as any).professional_year),
          partnerSkill: (dbProfile as any).partner || "",
          nominationType: (dbProfile as any).nomination_sponsorship || "",
        }
      : null;

    const b: Record<string, number> = {
      visa: 0,
      age: 0,
      english: 0,
      workOutside: 0,
      workInside: 0,
      education: 0,
      specialist: 0, // reservado si lo usas
      australianStudy: 0,
      communityLanguage: 0,
      regionalStudy: 0,
      professionalYear: 0,
      partner: 0,
      nomination: 0,
    };

    if (payloadProfile) {
      // Visa bonus (simple): 190=+5, 491=+15
      b.visa =
        payloadProfile.visaSubclass === "190"
          ? 5
          : payloadProfile.visaSubclass === "491"
          ? 15
          : 0;

      // Edad (rango típico)
      const age = payloadProfile.age;
      b.age =
        age >= 25 && age <= 32
          ? 30
          : age >= 33 && age <= 39
          ? 25
          : age >= 18 && age <= 24
          ? 25
          : age >= 40 && age <= 44
          ? 15
          : 0;

      // Inglés
      b.english =
        payloadProfile.englishLevel === "Superior"
          ? 20
          : payloadProfile.englishLevel === "Proficient"
          ? 10
          : 0;

      // Experiencia fuera AU (5/10/15)
      const out = payloadProfile.workExperience_out || 0;
      b.workOutside = out >= 8 ? 15 : out >= 5 ? 10 : out >= 3 ? 5 : 0;

      // Experiencia en AU (5/10/15/20)
      const inn = payloadProfile.workExperience_in || 0;
      b.workInside =
        inn >= 8 ? 20 : inn >= 5 ? 15 : inn >= 3 ? 10 : inn >= 1 ? 5 : 0;

      // Educación
      const edu = payloadProfile.education_qualification;
      b.education =
        edu === "doctorate"
          ? 20
          : edu === "bachelor"
          ? 15
          : edu === "diploma" || edu === "assessed"
          ? 10
          : 0;

      // Extras
      b.australianStudy = payloadProfile.australianStudy ? 5 : 0;
      b.regionalStudy = payloadProfile.regionalStudy ? 5 : 0;
      b.professionalYear = payloadProfile.professionalYear ? 5 : 0;
      b.communityLanguage = payloadProfile.communityLanguage ? 5 : 0;

      // Partner
      b.partner =
        payloadProfile.partnerSkill === "meets_all"
          ? 10
          : payloadProfile.partnerSkill === "competent_english"
          ? 5
          : payloadProfile.partnerSkill === "single_or_au_partner"
          ? 10
          : 0;

      // Nominación/Patrocinio (según tu texto: 15)
      b.nomination =
        payloadProfile.nominationType === "state" ||
        payloadProfile.nominationType === "family"
          ? 15
          : 0;
    }

    return {
      props: {
        userName: user?.name || "Usuario",
        profile: uiProfile,
        breakdown: b,
      },
    };
  } catch (err) {
    // Si algo falla (token inválido, etc.), redirige a login
    return { redirect: { destination: "/login", permanent: false } };
  }
};
