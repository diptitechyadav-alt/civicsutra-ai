import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  token: string | null;
  users: User[];
  login: (credentials: { email?: string; password?: string; role?: UserRole }) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    ward?: string;
    preferred_language?: string;
  }) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: UserRole) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'usr-citizen-01',
    name: 'Aarav Sharma',
    email: 'citizen@civicsutra.org',
    role: 'CITIZEN',
    ward: 'Ward 14 (South Zone)',
    phone: '+91 98765 43210',
  },
  {
    id: 'usr-citizen-02',
    name: 'Priya Patel',
    email: 'priya@civicsutra.org',
    role: 'CITIZEN',
    ward: 'Ward 14 (South Zone)',
    phone: '+91 98765 11223',
  },
  {
    id: 'usr-admin-01',
    name: 'Dr. Rajesh Kumar',
    email: 'admin@civicsutra.org',
    role: 'ADMIN',
    department: 'Municipal Operations & Grievance Cell',
    phone: '+91 98111 22334',
  },
  {
    id: 'usr-field-01',
    name: 'Pooja Verma',
    email: 'field@civicsutra.org',
    role: 'FIELD_TEAM',
    ward: 'Ward 14',
    department: 'Roads & Infrastructure Maintenance Division',
    phone: '+91 98222 33445',
  },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('civicsutra_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('civicsutra_user');
    const savedToken = localStorage.getItem('civicsutra_token');
    if (savedUser && savedToken) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch verified users directory from backend
  useEffect(() => {
    api.getUsers()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server user directory:', err);
      });
  }, []);

  // Validate session token on startup
  useEffect(() => {
    const savedToken = localStorage.getItem('civicsutra_token');
    if (savedToken) {
      api.getMe()
        .then((profile) => {
          if (profile && profile.id) {
            setCurrentUser(profile);
            localStorage.setItem('civicsutra_user', JSON.stringify(profile));
          }
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        });
    }
  }, []);

  const login = async (credentials: { email?: string; password?: string; role?: UserRole }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      if (res.token) {
        localStorage.setItem('civicsutra_token', res.token);
        setToken(res.token);
      }
      if (res.user) {
        localStorage.setItem('civicsutra_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    ward?: string;
    preferred_language?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      if (res.token) {
        localStorage.setItem('civicsutra_token', res.token);
        setToken(res.token);
      }
      if (res.user) {
        localStorage.setItem('civicsutra_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('civicsutra_user');
    localStorage.removeItem('civicsutra_token');
  };

  const switchRole = async (newRole: UserRole) => {
    try {
      await login({ role: newRole });
    } catch {
      const targetUser = users.find((u) => u.role === newRole);
      if (targetUser) {
        setCurrentUser(targetUser);
        localStorage.setItem('civicsutra_user', JSON.stringify(targetUser));
      }
    }
  };

  const role: UserRole = currentUser ? currentUser.role : 'CITIZEN';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        token,
        users,
        login,
        register,
        logout,
        switchRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
