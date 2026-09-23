import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import { supabase } from '../services/supabase';
import {
  fetchUserSettings,
  updateDbUserSettings,
  insertStarterRoutinesForUser,
} from '../services/supabaseDb';

interface AuthContextType {
  user: User | null;
  settings: UserSettings;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    pass: string,
    categoryChoice?: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  recoverPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>(() => {
    let initialTheme: 'light' | 'dark' | 'system' = 'light';
    try {
      const stored = localStorage.getItem('minha_rotina_theme');
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        initialTheme = stored;
      }
    } catch {}
    return {
      userId: '',
      theme: initialTheme,
      startOfWeek: 1,
      timeFormat: '24h',
      soundEnabled: true,
      notificationsEnabled: false,
      celebrationEnabled: true,
    };
  });
  const [isLoading, setIsLoading] = useState(true);

  // Apply dark mode class to documentElement whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem('minha_rotina_theme', settings.theme);
    } catch {}
  }, [settings.theme]);

  // Initialize and listen to Supabase Auth State
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.warn('Supabase getSession error:', error.message);

        if (session?.user && isMounted) {
          const authUser = session.user;
          const userObj: User = {
            id: authUser.id,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
            email: authUser.email || '',
            avatar: authUser.user_metadata?.avatar || 'user',
            createdAt: authUser.created_at,
          };
          setUser(userObj);

          const dbSettings = await fetchUserSettings(authUser.id);
          if (isMounted) setSettings(dbSettings);
        } else if (isMounted) {
          setUser(null);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    // Listen to changes in auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const authUser = session.user;
        const userObj: User = {
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
          email: authUser.email || '',
          avatar: authUser.user_metadata?.avatar || 'user',
          createdAt: authUser.created_at,
        };
        setUser(userObj);

        // Fetch settings from DB
        const dbSettings = await fetchUserSettings(authUser.id);
        setSettings(dbSettings);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail || !pass) {
        return { success: false, error: 'Informe e-mail e senha.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: pass,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'E-mail ou senha incorretos.' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userObj: User = {
          id: data.user.id,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuário',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar || 'user',
          createdAt: data.user.created_at,
        };
        setUser(userObj);
        const dbSettings = await fetchUserSettings(data.user.id);
        setSettings(dbSettings);
        return { success: true };
      }

      return { success: false, error: 'Não foi possível autenticar o usuário.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao conectar com o serviço de autenticação.' };
    }
  };

  const signup = async (
    name: string,
    email: string,
    pass: string,
    categoryChoice = 'tudo'
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      if (!normalizedEmail || !pass || !trimmedName) {
        return { success: false, error: 'Preencha todos os campos obrigatórios.' };
      }
      if (pass.length < 6) {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: pass,
        options: {
          data: {
            name: trimmedName,
            avatar: 'user',
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { success: false, error: 'Este e-mail já está cadastrado. Faça login ou recupere a senha.' };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        const userObj: User = {
          id: data.user.id,
          name: trimmedName,
          email: normalizedEmail,
          avatar: 'user',
          createdAt: data.user.created_at,
        };
        setUser(userObj);

        // Create default settings row in Supabase
        const initialSettings = await fetchUserSettings(data.user.id);
        setSettings(initialSettings);

        // Seed initial routines for the user
        try {
          await insertStarterRoutinesForUser(data.user.id, categoryChoice);
        } catch (starterErr) {
          console.warn('Could not insert starter routines:', starterErr);
        }

        return {
          success: true,
          message: data.session
            ? 'Conta criada com sucesso!'
            : 'Conta criada! Verifique seu e-mail para confirmação se necessário.',
        };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao criar conta.' };
    }
  };

  const recoverPassword = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!normalizedEmail) {
        return { success: false, error: 'Informe seu e-mail para recuperação.' };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: 'Link de redefinição de senha enviado para o seu e-mail!',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Falha ao solicitar redefinição de senha.' };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during signout:', err);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: { name?: string; avatar?: string }): Promise<void> => {
    if (!user) return;
    try {
      const updatedMeta: Record<string, any> = {};
      if (data.name !== undefined) updatedMeta.name = data.name;
      if (data.avatar !== undefined) updatedMeta.avatar = data.avatar;

      const { error } = await supabase.auth.updateUser({
        data: updatedMeta,
      });

      if (error) console.error('Error updating user profile in Supabase:', error.message);

      setUser((prev) => (prev ? { ...prev, ...data } : null));
    } catch (err) {
      console.error('Exception updating profile:', err);
    }
  };

  const updateSettings = async (partial: Partial<UserSettings>): Promise<void> => {
    const updated = { ...settings, ...partial, userId: user?.id || '' };
    setSettings(updated);
    if (partial.theme) {
      try {
        localStorage.setItem('minha_rotina_theme', partial.theme);
      } catch {}
    }
    if (user?.id) {
      await updateDbUserSettings(user.id, partial);
    }
  };

  const toggleTheme = async (): Promise<void> => {
    const nextTheme: 'light' | 'dark' = settings.theme === 'dark' ? 'light' : 'dark';
    await updateSettings({ theme: nextTheme });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        isLoading,
        login,
        signup,
        recoverPassword,
        logout,
        updateProfile,
        updateSettings,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
