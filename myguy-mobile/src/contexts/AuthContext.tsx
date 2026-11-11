import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signin as apiSignin, signup as apiSignup, updatePresence, type ApiAuthUser } from '../lib/api';

const USER_STORAGE_KEY = 'user';
const TOKEN_STORAGE_KEY = 'authToken';

type User = ApiAuthUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (data: Record<string, unknown>) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function isUser(value: unknown): value is User {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'id' in value && typeof value.id === 'string' &&
    'email' in value && typeof value.email === 'string' &&
    'username' in value && typeof value.username === 'string'
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const syncPresence = async (isOnline: boolean) => {
      try {
        await updatePresence(isOnline);
      } catch (error) {
        console.error('Could not update MyGuy online status:', error);
      }
    };

    if (AppState.currentState === 'active') void syncPresence(true);
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void syncPresence(true);
    }, 30000);
    const subscription = AppState.addEventListener('change', (state) => {
      void syncPresence(state === 'active');
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [user?.id]);

  const loadUser = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      const userJson = await AsyncStorage.getItem('user');
      if (userJson && token) {
        const storedUser: unknown = JSON.parse(userJson);
        if (isUser(storedUser)) {
          setUser(storedUser);
        } else {
          await AsyncStorage.multiRemove([USER_STORAGE_KEY, TOKEN_STORAGE_KEY]);
        }
      } else {
        await AsyncStorage.multiRemove([USER_STORAGE_KEY, TOKEN_STORAGE_KEY]);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      const response = await apiSignin(identifier, password);
      const userData = response.user;
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Sign in failed');
    }
  };

  const signUp = async (data: Record<string, unknown>) => {
    try {
      const response = await apiSignup(data);
      const userData = response.user;
      await AsyncStorage.setItem(TOKEN_STORAGE_KEY, response.token);
      setUser(userData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Signup error:', error);
      throw new Error(error instanceof Error ? error.message : 'Signup failed');
    }
  };

  const signOut = async () => {
    try {
      await updatePresence(false);
    } catch (error) {
      console.error('Could not mark account offline during sign out:', error);
    }
    await AsyncStorage.multiRemove([USER_STORAGE_KEY, TOKEN_STORAGE_KEY]);
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, updateUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
