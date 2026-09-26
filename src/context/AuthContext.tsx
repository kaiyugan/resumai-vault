import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAPI, registerAPI, fetchCurrentUserAPI } from '../services/apiClient';

export interface CandidateUser {
  id: string;
  email: string;
  full_name: string;
  preferred_resume_name?: string;
  avatar_url?: string;
  location?: string;
  linkedin_url?: string;
}

interface AuthContextType {
  user: CandidateUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, customName?: string) => Promise<boolean>;
  register: (email: string, fullName: string, password?: string) => Promise<boolean>;
  loginWithGoogleDemo: (customName?: string) => Promise<boolean>;
  updateUserProfile: (updates: Partial<CandidateUser>) => void;
  exportCandidateData: () => void;
  deleteAccount: () => void;
  logout: () => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CandidateUser | null>(() => {
    if (typeof sessionStorage !== 'undefined') {
      const savedUser = sessionStorage.getItem('candidate_user');
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('candidate_auth_token');
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (token && !user) {
      fetchCurrentUserAPI()
        .then((userData) => {
          setUser(userData);
          sessionStorage.setItem('candidate_user', JSON.stringify(userData));
        })
        .catch(() => logout());
    }
  }, [token]);

  const updateUserProfile = (updates: Partial<CandidateUser>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('candidate_user', JSON.stringify(updatedUser));
    }
  };

  const login = async (email: string, password?: string, customName?: string): Promise<boolean> => {
    try {
      const resp = await loginAPI(email, password);
      if (resp && resp.access_token) {
        setToken(resp.access_token);
        const u = {
          ...resp.user,
          preferred_resume_name: customName || resp.user.preferred_resume_name || resp.user.full_name
        };
        setUser(u);
        sessionStorage.setItem('candidate_auth_token', resp.access_token);
        sessionStorage.setItem('candidate_user', JSON.stringify(u));
        setIsLoginModalOpen(false);
        return true;
      }
    } catch (e) {
      console.warn('Login API fallback active:', e);
    }

    // Client fallback session
    const namePart = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
    const formattedName = customName || (namePart ? namePart.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Candidate User');
    const fallbackUser: CandidateUser = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email: email,
      full_name: formattedName,
      preferred_resume_name: formattedName,
      avatar_url: 'indigo'
    };
    const fallbackToken = 'demo_jwt_token_' + Date.now();
    setToken(fallbackToken);
    setUser(fallbackUser);
    sessionStorage.setItem('candidate_auth_token', fallbackToken);
    sessionStorage.setItem('candidate_user', JSON.stringify(fallbackUser));
    setIsLoginModalOpen(false);
    return true;
  };

  const register = async (email: string, fullName: string, password?: string): Promise<boolean> => {
    try {
      const resp = await registerAPI(email, fullName, password);
      if (resp && resp.access_token) {
        setToken(resp.access_token);
        const u = {
          ...resp.user,
          preferred_resume_name: fullName || resp.user.full_name
        };
        setUser(u);
        sessionStorage.setItem('candidate_auth_token', resp.access_token);
        sessionStorage.setItem('candidate_user', JSON.stringify(u));
        setIsLoginModalOpen(false);
        return true;
      }
    } catch (e) {
      console.warn('Register API fallback active:', e);
    }

    const fallbackUser: CandidateUser = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email: email,
      full_name: fullName || 'Candidate User',
      preferred_resume_name: fullName || 'Candidate User',
      avatar_url: 'indigo'
    };
    const fallbackToken = 'demo_jwt_token_' + Date.now();
    setToken(fallbackToken);
    setUser(fallbackUser);
    sessionStorage.setItem('candidate_auth_token', fallbackToken);
    sessionStorage.setItem('candidate_user', JSON.stringify(fallbackUser));
    setIsLoginModalOpen(false);
    return true;
  };

  const loginWithGoogleDemo = async (customName?: string): Promise<boolean> => {
    const demoEmail = customName ? `${customName.toLowerCase().replace(/\s+/g, '.')}@gmail.com` : `candidate.user@gmail.com`;
    const nameToUse = customName || 'Candidate User';
    return login(demoEmail, undefined, nameToUse);
  };

  const exportCandidateData = () => {
    if (!user) return;
    const backupData = {
      user_profile: user,
      export_timestamp: new Date().toISOString(),
      session_storage_dump: Object.keys(sessionStorage).reduce((acc, key) => {
        acc[key] = sessionStorage.getItem(key);
        return acc;
      }, {} as Record<string, any>)
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumai-vault-backup-${user.email}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAccount = () => {
    logout();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsProfileModalOpen(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('candidate_auth_token');
      sessionStorage.removeItem('candidate_user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        login,
        register,
        loginWithGoogleDemo,
        updateUserProfile,
        exportCandidateData,
        deleteAccount,
        logout,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isProfileModalOpen,
        setIsProfileModalOpen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
