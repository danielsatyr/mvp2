// pages/dashboard.tsx
import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import type { GetServerSideProps } from "next";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { useEffect } from "react";


import { useDecisionGraph } from "@/features/decision-graph/hooks/useDecisionGraph";
// Ajusta esta ruta si tu mock está en otra carpeta:
import DecisionDiagramMock from "@/components/DecisionDiagramMock";

// Cargamos el diagrama real sin SSR para evitar problemas con GoJS
const DecisionDiagram = dynamic(() => import("@/components/DecisionDiagram"), {
  ssr: false,
});

interface DashboardProps {
  userName: string;
  profile: any; // si prefieres, tipa este objeto con tu interfaz real
  breakdown: Record<string, number>;
}

export default function Dashboard({
  userName,
  profile,
  breakdown,
}: DashboardProps) {
  // Permite alternar entre demo y diagrama real vía ?demo=1
  const [showMock, setShowMock] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      return url.searchParams.get("demo") === "1";
    }
    return false;
  });

  
  // --- NUEVO: perfil y UI para el hook ---
  // Sumatoria segura de breakdown para que el nodo Start muestre el total
  const totalPoints =
    Object.values(breakdown ?? {}).reduce((acc, n) => acc + (n || 0), 0);
  
// ⬇️ intenta extraer un ANZSCO de 6 dígitos del campo occupation (si viene "261313 – Industrial Engineer", lo toma)
const extractedAnzsco: string | undefined =
  (typeof profile?.anzscoCode === "string" && profile.anzscoCode.trim()) ||
    (typeof profile?.occupationId === "string" && profile.occupationId.match(/\b\d{6}\b/)?.[0]) ||
  undefined;



  // Mapeamos occupation -> anzscoCode (ajusta si tu campo se llama distinto)
  const profileForHook = {
   // anzscoCode: profile?.occupation || fallbackAnzsco,
   //  anzscoCode: "261313", // <- forzado para probar
   // anzscoCode: extractedAnzsco ?? fallbackAnzsco,
    anzscoCode: extractedAnzsco,               // ← aquí llega el anzscoCode “vivo” desde lo que guardó el form
    englishLevel: profile?.englishLevel || undefined,
    points: totalPoints,
    userId: profile?.userId,
    age: profile?.age,
  };



  // Visa inicial solo si es estatal (190/491); para 189 no hace falta cascada
  const [ui, setUi] = useState<{
    selectedVisa?: "189" | "190" | "491";
    selectedState?: string;
    selectedPathwayId?: string;
  }>(() => {
    const vs = (profile?.visaSubclass as "189" | "190" | "491" | undefined) || undefined;
    return {
      selectedVisa: vs === "190" || vs === "491" ? vs : undefined,
      selectedState: undefined,
      selectedPathwayId: undefined,
    };
  });



  // Hook que orquesta datos → grafo (Start + visas + cascada estados/pathways)
  const {
    graph,
    visas,
    states,
    pathways,
    loading: isLoading,
    error,
  } = useDecisionGraph(profileForHook, ui);

  // Exponemos nodos/links como antes los esperaba el render
  const nodes = graph?.nodes ?? [];
  const links = graph?.links ?? [];

  // Refresh "seguro" para no romper: recarga suave
  const refresh = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

// Cuando lleguen visas, selecciona una por defecto (preferir 190)
useEffect(() => {
  if (!ui.selectedVisa && Array.isArray(visas) && visas.length) {
    setUi(u => ({
      ...u,
      selectedVisa: (visas.includes("190") ? "190" : visas[0]) as "189" | "190" | "491",
    }));
  }
}, [visas, ui.selectedVisa, setUi]);
  


  // Datos para el gráfico radial (desde el breakdown que recibes por props)
  const radarData = Object.entries(breakdown ?? {}).map(([subject, value]) => ({
    subject,
    value,
  }));

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {/* Cabecera */}
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Hola, {userName}</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => refresh()}
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
          <li><strong>Visado:</strong> {profile?.visaSubclass || "N/D"}</li>
          <li><strong>Ocupación ANZSCO:</strong> {profile?.occupation}</li>
          <li><strong>Edad:</strong> {profile?.age}</li>
          <li><strong>Experiencia AU:</strong> {profile?.workExperience_in} años</li>
          <li><strong>Experiencia fuera AU:</strong> {profile?.workExperience_out} años</li>
          <li><strong>Inglés:</strong> {profile?.englishLevel}</li>
          <li><strong>Educación:</strong> {profile?.education_qualification}</li>
          <li><strong>Requisito de estudio AU:</strong> {profile?.study_requirement || "No"}</li>
          <li><strong>Estudio regional AU:</strong> {profile?.regional_study || "No"}</li>
          <li><strong>Professional Year:</strong> {profile?.professional_year || "No"}</li>
          <li><strong>Idioma comunitario:</strong> {profile?.natti || "No"}</li>
          <li><strong>Partner skills:</strong> {profile?.partner || "No aplica"}</li>
          <li><strong>Nominación/Patrocinio:</strong> {profile?.nomination_sponsorship || "No"}</li>
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
            <span style={{ width: 12, height: 12, background: "#22c55e", display: "inline-block", borderRadius: 3 }} />
            OK
          </span>
          <span className="inline-flex items-center gap-2">
            <span style={{ width: 12, height: 12, background: "#f59e0b", display: "inline-block", borderRadius: 3 }} />
            Advertencia
          </span>
          <span className="inline-flex items-center gap-2">
            <span style={{ width: 12, height: 12, background: "#ef4444", display: "inline-block", borderRadius: 3 }} />
            No cumple
          </span>
          <span className="inline-flex items-center gap-2">
            <span style={{ width: 12, height: 12, background: "#1976d2", display: "inline-block", borderRadius: 3 }} />
            Info
          </span>
        </div>

    <div className="text-xs font-mono bg-gray-50 p-2 rounded mb-3">
      <div>loading: {String(isLoading)}</div>
      <div>error: {error ? String((error as any)?.message || error) : "null"}</div>
      <div>anzscoCode: {String(profileForHook.anzscoCode)}</div>
      <div>selectedVisa: {String(ui.selectedVisa)} | selectedState: {String(ui.selectedState)} | selectedPathwayId: {String(ui.selectedPathwayId)}</div>
      <div>visas: {JSON.stringify(visas)}</div>
      <div>states: {JSON.stringify(states)}</div>
      <div>pathways: {JSON.stringify(pathways?.map(p => p.pathwayId))}</div>
      <div>graph: nodes={nodes.length} links={links.length}</div>
    </div>


        {/* Render del diagrama */}
        {showMock ? (
          <div className="w-full">
            <DecisionDiagramMock
              nodeDataArray={nodes as any}   // usamos los nodos/enlaces del hook
              linkDataArray={links as any}
            />
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center border-dashed border-2 border-gray-300 w-full">
              {isLoading ? (
                <span className="text-gray-500">Cargando diagrama…</span>
              ) : nodes.length && links.length ? (
                <DecisionDiagram nodeDataArray={nodes as any} linkDataArray={links as any} />
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

const toBoolSSR = (v: any) => v === true || v === "Yes" || v === "yes" || v === "1";

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.token;
    if (!token) return { redirect: { destination: "/login", permanent: false } };

    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userId = payload?.userId;
    if (!userId) return { redirect: { destination: "/login", permanent: false } };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const dbProfile = await prisma.profile.findUnique({ where: { userId } });

    // Perfil plano para UI
    const uiProfile = dbProfile
      ? {
          ...JSON.parse(JSON.stringify(dbProfile)),
          // opcional: adapta nombres si tu UI los espera en snake_case/camelCase
        }
      : null;

    // Calcula breakdown aquí mismo (mismos tramos que en la API)
    const payloadProfile = dbProfile
      ? {
          visaSubclass: (dbProfile as any).visaSubclass ?? "189",
          age: Number((dbProfile as any).age ?? 0),
          englishLevel: (dbProfile as any).englishLevel ?? "Competent",
          workExperience_out: Number((dbProfile as any).workExperience_out ?? 0),
          workExperience_in: Number((dbProfile as any).workExperience_in ?? 0),
          education_qualification: (dbProfile as any).education_qualification ?? "",
          specialistQualification: (dbProfile as any).specialistQualification ?? "",
          australianStudy: toBoolSSR((dbProfile as any).study_requirement),
          communityLanguage: toBoolSSR((dbProfile as any).natti),
          regionalStudy: toBoolSSR((dbProfile as any).regional_study),
          professionalYear: toBoolSSR((dbProfile as any).professional_year),
          partnerSkill: (dbProfile as any).partner ?? "",
          nominationType: (dbProfile as any).nomination_sponsorship ?? "",
        }
      : null;


      
    // compute breakdown inline
    const b: any = {
      visa: 0, age: 0, english: 0, workOutside: 0, workInside: 0,
      education: 0, specialist: 0, australianStudy: 0, communityLanguage: 0,
      regionalStudy: 0, professionalYear: 0, partner: 0, nomination: 0,
    };
    if (payloadProfile) {
      if (payloadProfile.visaSubclass === "491") b.visa = 15;
      if (payloadProfile.visaSubclass === "190") b.visa = 5;
      if (payloadProfile.age < 25) b.age = 25;
      else if (payloadProfile.age < 33) b.age = 30;
      else if (payloadProfile.age < 40) b.age = 25;
      else if (payloadProfile.age < 45) b.age = 15;
      if (payloadProfile.englishLevel === "Proficient") b.english = 10;
      else if (payloadProfile.englishLevel === "Superior") b.english = 20;
      if (payloadProfile.workExperience_out >= 8) b.workOutside = 15;
      else if (payloadProfile.workExperience_out >= 5) b.workOutside = 10;
      else if (payloadProfile.workExperience_out >= 3) b.workOutside = 5;
      if (payloadProfile.workExperience_in >= 8) b.workInside = 20;
      else if (payloadProfile.workExperience_in >= 5) b.workInside = 15;
      else if (payloadProfile.workExperience_in >= 3) b.workInside = 10;
      else if (payloadProfile.workExperience_in >= 1) b.workInside = 5;
      const edu = (payloadProfile.education_qualification || "").toLowerCase();
      if (edu.includes("phd") || edu.includes("doctor")) b.education = 20;
      else if (edu.includes("master")) b.education = 15;
      else if (edu.includes("bachelor") || edu.includes("degree")) b.education = 15;
      if (payloadProfile.australianStudy) b.australianStudy = 5;
      if (payloadProfile.communityLanguage) b.communityLanguage = 5;
      if (payloadProfile.regionalStudy) b.regionalStudy = 5;
      if (payloadProfile.professionalYear) b.professionalYear = 5;
      switch (payloadProfile.partnerSkill) {
        case "skill+english": b.partner = 10; break;
        case "competentEnglish": b.partner = 5; break;
        case "singleOrCitizenPR": b.partner = 10; break;
      }
      switch (payloadProfile.nominationType) {
        case "state": b.nomination = 15; break;
        case "family": b.nomination = 15; break;
      }
    }
    return {
      props: {
        userName: user?.name ?? null,
        profile: uiProfile,
        breakdown: b,
      },
    };
  } catch (e) {
    console.error(e);
    return { redirect: { destination: "/login", permanent: false } };
  }
};
