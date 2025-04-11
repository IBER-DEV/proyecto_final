import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: 'employer' | 'worker') => Promise<void>;
  signOut: () => Promise<void>;
}

// Función auxiliar para obtener el perfil del usuario
const fetchUserProfile = async (userId: string) => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  return profile
    ? {
        id: userId,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        verified: profile.verified,
        created_at: profile.created_at,
      }
    : null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        if (profile) {
          set({ user: profile });
        }
      }

      // Suscripción a cambios de autenticación
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, loading: false });
          return;
        }

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            set({ user: profile, loading: false });
          }
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    try {
      set({ loading: true });
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      if (authData.user) {
        const profile = await fetchUserProfile(authData.user.id);
        if (profile) {
          set({ user: profile });
        }
      }
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password, fullName, role) => {
    try {
      set({ loading: true });
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ user_id: authData.user.id, full_name: fullName, role }]);

        if (profileError) throw profileError;

        set({
          user: {
            id: authData.user.id,
            email,
            full_name: fullName,
            role,
            verified: false,
            created_at: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Error signing up:', error);
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, loading: false });
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
