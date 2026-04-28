import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from 'firebase/auth';
import type { AdminProfile, UserRole } from '@/types';

interface AuthUserProfile extends AdminProfile {
  role: UserRole;
}

interface AuthState {
  user: User | null;
  userProfile: AuthUserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setUserProfile: (profile: AuthUserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      userProfile: null,
      loading: true,

      setUser(user) {
        set({ user });
      },

      setUserProfile(userProfile) {
        set({ userProfile });
      },

      setLoading(loading) {
        set({ loading });
      },

      reset() {
        set({ user: null, userProfile: null, loading: false });
      },
    }),
    {
      name: 'jeep-in-auth',
      // Only persist the profile — never persist the full User object (contains tokens)
      partialize: (state) => ({ userProfile: state.userProfile }),
    }
  )
);
