// pages/form.tsx
import { useRouter } from 'next/router';
import ProfileForm from '../components/ProfileForm';
import * as cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FormPageProps {
  user: { id: number; name: string; username: string };
}

export default function FormPage({ user }: FormPageProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 p-6 border rounded-md shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl">Bienvenido, {user.name}</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>
      <p className="mb-6">Completa tu formulario de perfil migratorio:</p>
      <ProfileForm />
    </div>
  );
}
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { req } = ctx;
  const raw = req.headers.cookie || '';
  const { token } = cookie.parse(raw);

  if (!token) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }

  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }

  // Aquí usa la instancia 'prisma' que hemos creado arriba
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, username: true },
  });

  if (!user) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }

  return {
    props: { user },
  };
};