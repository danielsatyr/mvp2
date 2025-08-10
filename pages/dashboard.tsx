// pages/dashboard.tsx
import { GetServerSideProps } from "next";
import * as cookie from "cookie";
import jwt from "jsonwebtoken";
import { PrismaClient, Profile } from "@prisma/client";
import Link from "next/link";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { useEffect, useState } from "react";
import DecisionDiagramMock from "@/components/DecisionDiagramMock";
import DecisionDiagram from "@/features/decision-graph/ui/DecisionDiagram";
import { useRouter } from "next/router";




const prisma = new PrismaClient();

interface DashboardProps {
  userName: string;
  profile: Profile;
  breakdown: Record<string, number>;
}

export default function Dashboard({
  userName,
  profile,
  breakdown,
}: DashboardProps) {

  const router = useRouter();
const [showMock, setShowMock] = useState<boolean>(() => {
  // Si entras al dashboard con ?demo=1 arranca mostrando el mock
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    return url.searchParams.get("demo") === "1";
  }
  return false;
});

  console.log("BREAKDOWN:", breakdown);

  // 1) Hooks: deben ir dentro del cuerpo del componente
  const [nodeDataArray, setNodeDataArray] = useState<any[]>([]);
  const [linkDataArray, setLinkDataArray] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);

  // 2) Transformar breakdown para el RadarChart
  const data = Object.entries(breakdown).map(([subject, value]) => ({
    subject,
    value,
  }));

  // 3) Cargar el diagrama desde /api/decision-tree pasando los puntos
  useEffect(() => {
  let abort = false;

  async function loadTree() {
    try {
      setLoadingTree(true);
      setTreeError(null);

      const res = await fetch(`/api/decision-tree?points=${encodeURIComponent(profile.score ?? 0)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

const payload = await res.json();
      console.log("UI payload recibido:", payload);

 const nodes = payload.nodeDataArray ?? payload.nodes ?? [];
const rootNode = nodes.find((n: any) => n.key === "Start");
      console.log("UI rootNode:", rootNode);




const fixedNodes = nodes.map((n: any) => {
  if (n.key === "Start") {
    // Si por alguna razón se perdió tooltipHtml, lo reponemos
    return {
      ...n,
      tooltipHtml:
        n.tooltipHtml ??
        `
        <div style="font-weight:600;margin-bottom:4px;">Resumen</div>
        <div>Este es tu puntaje total calculado con base en tu formulario.</div>
        <ul style="margin:6px 0 0 18px;padding:0;">
          <li>Edad, Inglés, Educación, Experiencia</li>
          <li>Bonos: NAATI, PY, Estudio Regional</li>
        </ul>
        `,
    };
  }
  return n;
});



      if (!abort) {
setNodeDataArray(fixedNodes);
console.log("UI fixed root:", fixedNodes.find((n:any)=>n.key==="Start"));

        setLinkDataArray(payload.linkDataArray ?? payload.links ?? []);
      }
    } catch (err: any) {
      if (!abort) setTreeError(err.message ?? "Error cargando diagrama");
    } finally {
      if (!abort) setLoadingTree(false);
    }
  }

  loadTree();
  return () => { abort = true; };
}, [profile.score]);


  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {/* Cabecera */}
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Hola, {userName}</h1>
        <Link
          href="/form"
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          Modificar perfil
        </Link>
      </header>

      {/* Score y detalles */}
      <section className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl">Tu puntuación: {profile.score} puntos</h2>
        <ul className="grid grid-cols-2 gap-4">
          <li><strong>Visado:</strong> {profile.visaSubclass || "N/D"}</li>
          <li><strong>Ocupación ANZSCO:</strong> {profile.occupation}</li>
          <li><strong>Edad:</strong> {profile.age}</li>
          <li><strong>Experiencia AU:</strong> {profile.workExperience_in} años</li>
          <li><strong>Experiencia fuera AU:</strong> {profile.workExperience_out} años</li>
          <li><strong>Inglés:</strong> {profile.englishLevel}</li>
          <li><strong>Educación:</strong> {profile.education_qualification}</li>
          <li><strong>Requisito de estudio AU:</strong> {profile.study_requirement || "No"}</li>
          <li><strong>Estudio regional AU:</strong> {profile.regional_study || "No"}</li>
          <li><strong>Professional Year:</strong> {profile.professional_year || "No"}</li>
          <li><strong>Idioma comunitario:</strong> {profile.natti || "No"}</li>
          <li><strong>Partner skills:</strong> {profile.partner || "No aplica"}</li>
          <li><strong>Nominación/Patrocinio:</strong> {profile.nomination_sponsorship || "No"}</li>
        </ul>
      </section>

      {/* Gráfico radial */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl mb-4">Fortalezas y Debilidades</h3>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" width={400} height={400} data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis />
          <Radar name="Puntos" dataKey="value" fill="#8884d8" fillOpacity={0.6} />
        </RadarChart>
      </section>

      {/* Diagrama dinámico */}
{/* Diagrama dinámico */}


<section className="bg-white p-6 rounded shadow">
  <h3 className="text-xl mb-4">Diagrama de decisiones</h3>
<div className="flex items-center justify-between mb-2">
  <div className="text-sm text-gray-600">
    {showMock ? "Vista: Demo (maqueta animada)" : "Vista: Diagrama real"}
  </div>
  <button
    type="button"
    onClick={() => setShowMock(v => !v)}
    className="px-3 py-1.5 rounded-md text-sm border shadow-sm bg-white hover:bg-gray-50"
    title="Alternar entre demo y diagrama real"
  >
    {showMock ? "Ver diagrama real" : "Ver demo"}
  </button>
</div>
  {/* 👇 Aquí pondrías la leyenda */}
  <div className="flex gap-4 text-sm text-gray-600 mb-2">
    <span className="inline-flex items-center gap-2">
      <span style={{width:12,height:12,background:"#22c55e",display:"inline-block",borderRadius:3}} />
      OK
    </span>
    <span className="inline-flex items-center gap-2">
      <span style={{width:12,height:12,background:"#f59e0b",display:"inline-block",borderRadius:3}} />
      Advertencia
    </span>
    <span className="inline-flex items-center gap-2">
      <span style={{width:12,height:12,background:"#ef4444",display:"inline-block",borderRadius:3}} />
      No cumple
    </span>
    <span className="inline-flex items-center gap-2">
      <span style={{width:12,height:12,background:"#1976d2",display:"inline-block",borderRadius:3}} />
      Info
    </span>
  </div>
    
{showMock ? (
  <div className="w-full">
    <DecisionDiagramMock
      nodeDataArray={nodeDataArray}   // ← los reales del endpoint
      linkDataArray={linkDataArray}
    />
  </div>
) : (
  <div className="h-96 flex items-center justify-center border-dashed border-2 border-gray-300 w-full">
    {loadingTree ? (
      <span className="text-gray-500">Cargando diagrama…</span>
    ) : treeError ? (
      <span className="text-red-600">No se pudo cargar el diagrama: {treeError}</span>
    ) : (
      <DecisionDiagram
        nodeDataArray={nodeDataArray}
        linkDataArray={linkDataArray}
      />
    )}
  </div>
)}

</section>

    </div>
  );
}




export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req } = ctx;
  const raw = req.headers.cookie || "";
  const { token } = cookie.parse(raw);

  // Autenticación
  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true, id: true },
  });
  if (!user) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // Buscar perfil
  const profileRaw = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (!profileRaw) {
    return { redirect: { destination: "/form", permanent: false } };
  }
  const profile = JSON.parse(JSON.stringify(profileRaw));

  // Obtener breakdown desde el endpoint dedicado
  // Construir URL absoluta usando el host de la petición
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  const breakdownUrl = `${protocol}://${host}/api/profile/breakdown`;
  const breakdownRes = await fetch(
    `${protocol}://${host}/api/profile/breakdown`,
    {
      headers: { cookie: raw },
    },
  );
  if (!breakdownRes.ok) {
    // En caso de error, loguear y devolver breakdown vacío
    console.error(
      "Error fetching breakdown:",
      breakdownRes.status,
      await breakdownRes.text(),
    );
    const breakdownEmpty: Record<string, number> = {};
    return {
      props: { userName: user.name, profile, breakdown: breakdownEmpty },
    };
  }
  const { breakdown } = await breakdownRes.json();

  return {
    props: {
      userName: user.name,
      profile,
      breakdown,
    },
  };
};
