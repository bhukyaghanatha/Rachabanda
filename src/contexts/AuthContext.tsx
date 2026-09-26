/**
 * @file AuthContext.tsx
 * @description Global React Context and Provider for Supabase authentication state.
 */

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { UserProfile, UpdateUserProfileInput } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getCurrentSession,
  getUserProfile,
  signInWithEmail as apiSignInWithEmail,
  signUpWithEmail as apiSignUpWithEmail,
  signInWithGoogle as apiSignInWithGoogle,
  signOut as apiSignOut,
  onAuthStateChange,
} from '../services/authService';
import {
  updateUserProfile,
  deleteOwnAccount as apiDeleteOwnAccount,
} from '../services/userService';

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isConfigured: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isReporter: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  deleteAccount: () => Promise<{ success: boolean; error: Error | null }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (
    updates: UpdateUserProfileInput
  ) => Promise<{ data: UserProfile | null; error: Error | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Prevent repeated unnecessary profile fetches for same user
  const loadedUserIdRef = useRef<string | null>(null);

  const buildFallbackProfile = (authUser: User): UserProfile => {
    const meta = authUser.user_metadata || {};
    return {
      id: authUser.id,
      full_name: meta.full_name || meta.name || authUser.email?.split('@')[0] || 'రచ్చబండ యూజర్',
      role: 'reader',
      avatar_url: meta.avatar_url || meta.picture || null,
      district: null,
      mandal: null,
      created_at: authUser.created_at,
    };
  };

  const fetchProfileForUser = useCallback(async (targetUser: User | null, force = false) => {
    if (!targetUser) {
      setProfile(null);
      loadedUserIdRef.current = null;
      return;
    }

    if (!force && loadedUserIdRef.current === targetUser.id) {
      return;
    }

    try {
      const dbProfile = await getUserProfile(targetUser.id);
      if (dbProfile) {
        setProfile(dbProfile);
      } else {
        // Fallback to user metadata if DB record has not yet synced
        setProfile(buildFallbackProfile(targetUser));
      }
      loadedUserIdRef.current = targetUser.id;
    } catch {
      setProfile(buildFallbackProfile(targetUser));
      loadedUserIdRef.current = targetUser.id;
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const activeSession = await getCurrentSession();
        if (isMounted) {
          setSession(activeSession);
          const currentUser = activeSession?.user || null;
          setUser(currentUser);
          if (currentUser) {
            await fetchProfileForUser(currentUser);
          } else {
            setProfile(null);
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    // Listen to real-time auth changes
    const { data: listener } = onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      const newUser = newSession?.user || null;
      setUser(newUser);

      if (newUser) {
        await fetchProfileForUser(newUser);
      } else {
        setProfile(null);
        loadedUserIdRef.current = null;
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfileForUser]);

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      const result = await apiSignInWithEmail(email, password);
      if (!result.error && result.user) {
        setUser(result.user);
        setSession(result.session);
        await fetchProfileForUser(result.user, true);
      }
      setIsLoading(false);
      return { error: result.error };
    },
    [fetchProfileForUser]
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string, fullName: string) => {
      setIsLoading(true);
      const result = await apiSignUpWithEmail(email, password, fullName);
      if (!result.error && result.user) {
        setUser(result.user);
        setSession(result.session);
        await fetchProfileForUser(result.user, true);
      }
      setIsLoading(false);
      return { error: result.error };
    },
    [fetchProfileForUser]
  );

  const signInWithGoogle = useCallback(async () => {
    const result = await apiSignInWithGoogle();
    return result;
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    const result = await apiSignOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    loadedUserIdRef.current = null;
    setIsLoading(false);
    return result;
  }, []);

  const deleteAccount = useCallback(async (): Promise<{ success: boolean; error: Error | null }> => {
    setIsLoading(true);
    const result = await apiDeleteOwnAccount();
    if (result.success) {
      await apiSignOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      loadedUserIdRef.current = null;
    }
    setIsLoading(false);
    return result;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfileForUser(user, true);
    }
  }, [user, fetchProfileForUser]);

  const updateProfile = useCallback(
    async (updates: UpdateUserProfileInput) => {
      const res = await updateUserProfile(updates);
      if (!res.error && res.data) {
        setProfile(res.data);
      }
      return res;
    },
    []
  );

  // Derived role flags
  const role = profile?.role;
  const isAdmin = role === 'admin';
  const isEditor = role === 'admin' || role === 'editor';
  const isReporter =
    role === 'admin' ||
    role === 'editor' ||
    role === 'reporter' ||
    role === 'citizen_reporter';

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isConfigured: isSupabaseConfigured,
    isAuthenticated: Boolean(user),
    isAdmin,
    isEditor,
    isReporter,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    deleteAccount,
    refreshProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
