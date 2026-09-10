'use client';

import { createContext, useContext } from 'react';

export interface ProfileContextValue {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'mentor' | 'mentee';
  avatar_url: string | null;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  profile,
  children,
}: {
  profile: ProfileContextValue;
  children: React.ReactNode;
}) {
  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue | null {
  return useContext(ProfileContext);
}
