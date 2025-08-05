// pages/dashboard.tsx
import { GetServerSideProps } from 'next';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { PrismaClient, Profile } from '@prisma/client';
import Link from 'next/link';

const prisma = new PrismaClient();

interface DashboardProps {
  userName: string;
  profile: Profile;
}

export default function Dashboard({ userName, profile }: DashboardProps) {
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
          <li>Edad: {profile.age}</li>
          <li>Experiencia en AU: {profile.workExperience_in} años</li>
          <li>Experiencia fuera AU: {profile.workExperience_out} años</li>
          <li>Inglés: {profile.englishLevel}</li>
          {/* …otros campos… */}
        </ul>
      </section>

      {/* Gráfico radial */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl mb-4">Fortalezas y Debilidades</h3>
        <div className="h-64 flex items-center justify-center border-dashed border-2 border-gray-300">
          {/* Placeholder: aquí irá tu gráfico radial */}
          <p className="text-gray-500">[Gráfico radial]</p>
        </div>
      </section>

      {/* Diagrama dinámico */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl mb-4">Diagrama de decisiones</h3>
        <div className="h-96 flex items-center justify-center border-dashed border-2 border-gray-300">
          {/* Placeholder: aquí irá tu diagrama interactivo */}
          <p className="text-gray-500">[Diagrama dinámico]</p>
        </div>
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req } = ctx;
  const raw = req.headers.cookie || '';
  const { token } = cookie.parse(raw);

  // 1. Autenticación
  if (!token) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // 2. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { name: true, id: true },
  });
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // 3. Buscar perfil
  const profileRaw = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (!profileRaw) {
    // Si no hay perfil, redirigir a form
    return { redirect: { destination: '/form', permanent: false } };
  }

  // 4. Serializar fechas
  const profile = JSON.parse(JSON.stringify(profileRaw));

  return {
    props: {
      userName: user.name,
      profile,
    },
  };
};
