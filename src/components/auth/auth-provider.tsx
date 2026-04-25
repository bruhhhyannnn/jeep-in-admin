'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib';
import { useAuthStore } from '@/store';
import type { AdminProfile, UserRole } from '@/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setUserProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        reset();
        setLoading(false);
        return;
      }

      setUser(firebaseUser);

      try {
        // Get role from custom claims
        const tokenResult = await firebaseUser.getIdTokenResult();
        const role = tokenResult.claims.role as UserRole | undefined;

        if (!role || (role !== 'admin' && role !== 'super_admin')) {
          // Not an admin — sign out
          await auth.signOut();
          reset();
          setLoading(false);
          return;
        }

        // Fetch admin profile from Firestore
        const profileSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));

        if (profileSnap.exists()) {
          const profile = profileSnap.data() as AdminProfile;
          setUserProfile({ ...profile, role });
        }
      } catch (err) {
        console.error('[AuthProvider] Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setUserProfile, setLoading, reset]);

  return <>{children}</>;
}
