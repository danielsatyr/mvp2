// pages/dashboard.tsx
import { GetServerSideProps } from 'next';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { PrismaClient, Profile } from '@prisma/client';
import Link from 'next/link';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import DecisionDiagram from '@/components/DecisionDiagram';


const prisma = new PrismaClient();

interface DashboardProps {
  userName: string;
  profile: Profile;
  breakdown: Record<string, number>;
}

export default function Dashboard({ userName, profile, breakdown }: DashboardProps) {
 console.log('BREAKDOWN:', breakdown);
  // Transformar el breakdown a formato adecuado para RadarChart
  const data = Object.entries(breakdown).map(([subject, value]) => ({ subject, value }));

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {/* Cabecera */}
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Hola, {userName}</h1>
        <Link href="/form" className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
          Modificar perfil
        </Link>
      </header>

      {/* Score y detalles */}
      <section className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl">Tu puntuación: {profile.score} puntos</h2>
        <ul className="grid grid-cols-2 gap-4">
          <li><strong>Visado:</strong> {profile.visaSubclass || 'N/D'}</li>
          <li><strong>Ocupación ANZSCO:</strong> {profile.occupation}</li>
          <li><strong>Edad:</strong> {profile.age}</li>
          <li><strong>Experiencia AU:</strong> {profile.workExperience_in} años</li>
          <li><strong>Experiencia fuera AU:</strong> {profile.workExperience_out} años</li>
          <li><strong>Inglés:</strong> {profile.englishLevel}</li>
          <li><strong>Educación:</strong> {profile.education_qualification}</li>
          <li><strong>Requisito de estudio AU:</strong> {profile.study_requirement || 'No'}</li>
          <li><strong>Estudio regional AU:</strong> {profile.regional_study || 'No'}</li>
          <li><strong>Professional Year:</strong> {profile.professional_year || 'No'}</li>
          <li><strong>Idioma comunitario:</strong> {profile.natti || 'No'}</li>
          <li><strong>Partner skills:</strong> {profile.partner || 'No aplica'}</li>
          <li><strong>Nominación/Patrocinio:</strong> {profile.nomination_sponsorship || 'No'}</li>
        </ul>
      </section>

      {/* Gráfico radial */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl mb-4">Fortalezas y Debilidades</h3>
        <RadarChart
          cx="50%"
          cy="50%"
          outerRadius="80%"
          width={400}
          height={400}
          data={data}
        >
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis />
          <Radar name="Puntos" dataKey="value" fill="#8884d8" fillOpacity={0.6} />
        </RadarChart>
      </section>

      {/* Diagrama dinámico */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl mb-4">Diagrama de decisiones</h3>
        <div className="h-96 flex items-center justify-center border-dashed border-2 border-gray-300">
        <DecisionDiagram
  nodeDataArray={[
    { key: 'Start', text: 'Inicio' },
    { key: 'A',     text: 'Opción A' },
    { key: 'B',     text: 'Opción B' },
  ]}
  linkDataArray={[
    { from: 'Start', to: 'A' },
    { from: 'Start', to: 'B' },
  ]}
/>

          
        </div>
      </section>
    </div>
  );
}
<DecisionDiagram
  nodeDataArray={[
    { key: 'Start', text: 'Inicio' },
    { key: 'Option1', text: 'Opción 1' },
    // ...
  ]}
  linkDataArray={[
    { from: 'Start', to: 'Option1' },
    // ...
  ]}

  
/>
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req } = ctx;
  const raw = req.headers.cookie || '';
  const { token } = cookie.parse(raw);

  // Autenticación
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // Buscar usuario
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true, id: true },
  });
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // Buscar perfil
  const profileRaw = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (!profileRaw) {
    return { redirect: { destination: '/form', permanent: false } };
  }
  const profile = JSON.parse(JSON.stringify(profileRaw));

    // Obtener breakdown desde el endpoint dedicado
  // Construir URL absoluta usando el host de la petición
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const breakdownUrl = `${protocol}://${host}/api/profile/breakdown`;
const breakdownRes = await fetch(`${protocol}://${host}/api/profile/breakdown`, {
  headers: { cookie: raw },
});
  if (!breakdownRes.ok) {
    // En caso de error, loguear y devolver breakdown vacío
    console.error('Error fetching breakdown:', breakdownRes.status, await breakdownRes.text());
    const breakdownEmpty: Record<string, number> = {};
    return {
      props: { userName: user.name, profile, breakdown: breakdownEmpty }
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
  