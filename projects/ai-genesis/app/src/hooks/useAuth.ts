import { create } from 'zustand';
import { supabase, signInWithApple, signOut, getCurrentUser } from '../services/supabase';
import { initRevenueCat, checkSubscriptionStatus, updateSubscriptionStatus } from '../services/revenuecat';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (identityToken: string, fullName?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        initRevenueCat(user.id);
        const status = await checkSubscriptionStatus();
        if (status !== user.subscriptionStatus) {
          await updateSubscriptionStatus(user.id, status);
          set({ user: { ...user, subscriptionStatus: status } });
        } else {
          set({ user });
        }
      }
    } catch (error) {
      console.error('認証初期化エラー:', error);
    } finally {
      set({ isInitialized: true });
    }
  },

  signIn: async (identityToken, fullName) => {
    set({ isLoading: true });
    try {
      await signInWithApple(identityToken, fullName);
      const user = await getCurrentUser();
      if (user) {
        initRevenueCat(user.id);
        set({ user });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await signOut();
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshSubscription: async () => {
    const { user } = get();
    if (!user) return;
    const status = await checkSubscriptionStatus();
    if (status !== user.subscriptionStatus) {
      await updateSubscriptionStatus(user.id, status);
      set({ user: { ...user, subscriptionStatus: status } });
    }
  },
}));

// Supabaseのセッション変更を監視
supabase.auth.onAuthStateChange(async (event) => {
  if (event === 'SIGNED_OUT') {
    useAuth.setState({ user: null });
  }
});
