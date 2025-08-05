// pages/form.tsx
import { GetServerSideProps } from 'next';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { PrismaClient, Profile as ProfileModel } from '@prisma/client';
import ProfileForm from '../components/ProfileForm';

const prisma = new PrismaClient();

interface FormPageProps {
  user: { id: number; name: string; username: string };
  profile: ProfileModel | null;
}

export default function FormPage({ user, profile }: FormPageProps) {
  return (
    <div className="max-w-2xl mx-auto mt-16 p-6 border rounded-md shadow-sm">
      <h1 className="text-2xl mb-4">Bienvenido, {user.name}</h1>
      <p className="mb-6">
        {profile ? 'Modifica tu perfil migratorio:' : 'Completa tu perfil migratorio:'}
      </p>
      <ProfileForm userId={user.id} initialProfile={profile} />
    </div>
  );
}

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

  // Obtener usuario
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, username: true },
  });
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }

  // Obtener perfil (puede ser null)
  const profileRaw = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

 // Convertir a JSON serializable (descarta Date)
  const profile = profileRaw
    ? JSON.parse(JSON.stringify(profileRaw))
    : null;

  return {
    props: { user, profile },
  };
};
