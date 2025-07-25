import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, AuthState, UserProfile } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const refreshProfile = async () => {
    if (authState.user) {
      await loadUserProfile(authState.user.id);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = mapSupabaseUser(session.user);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        loadUserProfile(user.id);
      } else {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        setUserProfile(null);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const user = mapSupabaseUser(session.user);
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          loadUserProfile(user.id);
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: supabaseUser.user_metadata?.firstName || 'User',
    lastName: supabaseUser.user_metadata?.lastName || '',
    createdAt: new Date(supabaseUser.created_at),
  });

  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signup = async (email: string, password: string, firstName: string, lastName: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          firstName,
          lastName,
        },
      },
    });

    if (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }

    // Don't automatically sign in - wait for email confirmation
    setAuthState(prev => ({ ...prev, isLoading: false }));
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, logout, userProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};