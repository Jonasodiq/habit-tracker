import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  getStoredUser,
  isLoggedIn,
  User,
} from '@/src/services/authService';

// --- Typer ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  loggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

// --- Skapa context ---
const AuthContext = createContext<AuthContextType | null>(null);

// --- Provider ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  // Kör vid app-start — ladda in sparad användare
  useEffect(() => {
    async function loadUser() {
      try {
        const [storedUser, loggedInStatus] = await Promise.all([
          getStoredUser(),
          isLoggedIn(),
        ]);
        setUser(storedUser);
        setLoggedIn(loggedInStatus);
      } catch {
        setUser(null);
        setLoggedIn(false);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  async function login(email: string, password: string) {
    const result = await authLogin(email, password);
    setUser(result.user ?? null);
    setLoggedIn(true);
  }

  async function logout() {
    await authLogout();
    setUser(null);
    setLoggedIn(false);
  }

  async function register(email: string, password: string, name: string) {
    const result = await authRegister(email, password, name);
    setUser(result.user ?? null);
    setLoggedIn(true);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loggedIn, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook ---
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth måste användas inom AuthProvider');
  return ctx;
}