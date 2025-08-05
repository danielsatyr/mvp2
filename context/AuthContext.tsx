// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = { id: number; name: string; username: string };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // opcional: para forzar refetch
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {}
});

// context/AuthContext.tsx (sólo el extracto relevante)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/me');
      if (!res.ok) throw new Error('No autenticado');
      const { user } = await res.json();
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {fetchMe();}, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}