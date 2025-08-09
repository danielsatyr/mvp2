// components/NavBar.tsx
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";

export default function NavBar() {
  const { user, loading, refresh } = useAuth(); // 🔥 extraemos refresh
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    // 🔥 refetch del estado de auth
    await refresh();
    router.push("/login");
  };

  return (
    <nav className="w-full bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          MigraciónApp
        </Link>

        <div className="flex space-x-4 items-center">
          {loading ? (
            <span>Cargando…</span>
          ) : user ? (
            <>
              <Link
                href="/form"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Formulario
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Registrarse
              </Link>
              <Link
                href="/login"
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Entrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
