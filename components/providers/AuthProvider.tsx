'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile, getUserProfile, UserProfile } from '@/lib/firestore';
import { isLocalDevMode } from '@/lib/runtime';

const localUser = {
  uid: 'local-dev-user',
  email: 'local@clipforge.dev',
  displayName: 'Local Creator',
  photoURL: null,
  getIdToken: async () => 'local-dev-token',
} as User;

const localProfile = {
  uid: localUser.uid,
  email: localUser.email,
  displayName: localUser.displayName,
  createdAt: new Date(),
} as unknown as UserProfile;

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(isLocalDevMode ? localUser : null);
  const [profile, setProfile] = useState<UserProfile | null>(isLocalDevMode ? localProfile : null);
  const [loading, setLoading] = useState(!isLocalDevMode);

  const loadProfile = async (firebaseUser: User) => {
    let p = await getUserProfile(firebaseUser.uid);
    if (!p) {
      await createUserProfile(firebaseUser.uid, {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
      });
      p = await getUserProfile(firebaseUser.uid);
    }
    setProfile(p);
  };

  useEffect(() => {
    if (isLocalDevMode) return;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    if (isLocalDevMode) return;
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (isLocalDevMode) return;
    if (user) await loadProfile(user);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut: handleSignOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
