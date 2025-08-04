// pages/index.tsx
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  // Mientras se valida la sesión
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-semibold text-center mb-6">
          Plataforma de Migración
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {user
            ? 'Accede a tu formulario de perfil migratorio.'
            : 'Regístrate o inicia sesión para simular tus rutas de migración.'}
        </p>

        <div className="flex flex-col space-y-4">
          {user ? (
            // Usuario autenticado: solo botón al formulario
            <Link
              href="/form"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Abrir formulario
            </Link>
          ) : (
            // Usuario NO autenticado: enlaces a signup y login
            <>
              <Link
                href="/signup"
                className="w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Registrarse
              </Link>
              <Link
                href="/login"
                className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}