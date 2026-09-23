import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserSettings } from '../types';
import {
  getCurrentUser,
  setCurrentUser,
  getUsers,
  saveUsers,
  getUserSettings,
  saveUserSettings,
  initializeStarterData,
  getRoutines,
} from '../services/storage';

interface AuthContextType {
  user: User | null;
  settings: UserSettings;
  isLoading: boolean;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  signup: (name: string, email: string, pass: string, securityQuestion: string, securityAnswer: string, categoryChoice?: string) => { success: boolean; error?: string };
  recoverPassword: (email: string, answer: string, newPass: string) => { success: boolean; error?: string };
  demoLogin: () => void;
  logout: () => void;
  updateProfile: (data: { name?: string; avatar?: string }) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  getSecurityQuestion: (email: string) => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-browser lightweight hashed simulation for user privacy & safety
function hashPassword(pass: string): string {
  let hash = 0;
  for (let i = 0; i < pass.length; i++) {
    const char = pass.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hash_${Math.abs(hash).toString(16)}`;
}

const PASS_MAP_KEY = 'minha_rotina_user_creds_v1';

function getCreds(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(PASS_MAP_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCred(userId: string, hashed: string) {
  const map = getCreds();
  map[userId] = hashed;
  localStorage.setItem(PASS_MAP_KEY, JSON.stringify(map));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    userId: '',
    theme: 'light',
    startOfWeek: 1,
    timeFormat: '24h',
    soundEnabled: true,
    notificationsEnabled: false,
    celebrationEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = getCurrentUser();
    if (saved) {
      setUser(saved);
      setSettings(getUserSettings(saved.id));
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, pass: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getUsers();
    const found = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!found) {
      return { success: false, error: 'E-mail não encontrado no sistema.' };
    }

    const creds = getCreds();
    const expectedHash = creds[found.id];
    if (expectedHash && expectedHash !== hashPassword(pass)) {
      return { success: false, error: 'Senha incorreta. Tente novamente.' };
    }

    setUser(found);
    setCurrentUser(found);
    setSettings(getUserSettings(found.id));
    return { success: true };
  };

  const signup = (
    name: string,
    email: string,
    pass: string,
    securityQuestion: string,
    securityAnswer: string,
    categoryChoice = 'tudo'
  ) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !pass || !name) {
      return { success: false, error: 'Preencha todos os campos obrigatórios.' };
    }
    if (pass.length < 4) {
      return { success: false, error: 'A senha deve ter pelo menos 4 caracteres.' };
    }

    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
      return { success: false, error: 'Já existe uma conta com este e-mail.' };
    }

    const newUser: User = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: name.trim(),
      email: normalizedEmail,
      avatar: '👤',
      securityQuestion,
      securityAnswer: securityAnswer.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    saveUsers([...users, newUser]);
    saveCred(newUser.id, hashPassword(pass));

    // Initialize starter routines based on onboarding choice
    initializeStarterData(newUser.id, categoryChoice);

    setUser(newUser);
    setCurrentUser(newUser);
    const initialSettings = getUserSettings(newUser.id);
    setSettings(initialSettings);

    return { success: true };
  };

  const getSecurityQuestion = (email: string): string | null => {
    const users = getUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    return found?.securityQuestion || 'Qual o nome do seu primeiro animal de estimação ou cidade natal?';
  };

  const recoverPassword = (email: string, answer: string, newPass: string) => {
    const users = getUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      return { success: false, error: 'E-mail não encontrado.' };
    }

    if (found.securityAnswer && found.securityAnswer !== answer.trim().toLowerCase()) {
      return { success: false, error: 'Resposta de segurança incorreta.' };
    }

    if (newPass.length < 4) {
      return { success: false, error: 'A nova senha deve ter pelo menos 4 caracteres.' };
    }

    saveCred(found.id, hashPassword(newPass));
    return { success: true };
  };

  const demoLogin = () => {
    const demoEmail = 'demonstracao@minharotina.app';
    const users = getUsers();
    let demoUser = users.find((u) => u.email === demoEmail);

    if (!demoUser) {
      demoUser = {
        id: 'usr_demo_vip',
        name: 'Alexandre Silva',
        email: demoEmail,
        avatar: '✨',
        securityQuestion: 'Qual sua cor favorita?',
        securityAnswer: 'azul',
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, demoUser]);
      saveCred(demoUser.id, hashPassword('1234'));
      initializeStarterData(demoUser.id, 'tudo');
    } else {
      // Ensure has routines if empty
      const existingRoutines = getRoutines(demoUser.id);
      if (existingRoutines.length === 0) {
        initializeStarterData(demoUser.id, 'tudo');
      }
    }

    setUser(demoUser);
    setCurrentUser(demoUser);
    setSettings(getUserSettings(demoUser.id));
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  const updateProfile = (data: { name?: string; avatar?: string }) => {
    if (!user) return;
    const updated: User = { ...user, ...data };
    const users = getUsers().map((u) => (u.id === user.id ? updated : u));
    saveUsers(users);
    setUser(updated);
    setCurrentUser(updated);
  };

  const updateSettings = (partial: Partial<UserSettings>) => {
    if (!user) return;
    const updated = { ...settings, ...partial, userId: user.id };
    saveUserSettings(updated);
    setSettings(updated);
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
        demoLogin,
        logout,
        updateProfile,
        updateSettings,
        getSecurityQuestion,
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
