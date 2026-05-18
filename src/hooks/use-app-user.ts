'use client';

import { useAuth, type AppUser } from '@/context/auth-provider';

export function useAppUser() {
  const { user, isLoading } = useAuth();

  const initials = (user?.displayName || user?.username || 'U').charAt(0).toUpperCase();
  const avatarUrl = user
    ? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%234f46e5"/><text x="50" y="50" font-size="48" fill="white" text-anchor="middle" dominant-baseline="central" font-family="sans-serif">${initials}</text></svg>`)}`
    : '/default-avatar.png';

  const appUser = {
    name: isLoading ? "Loading..." : user?.displayName || user?.username || "User",
    role: isLoading ? "..." : user?.role || "user",
    avatarUrl,
  };

  return {
    user: appUser,
    isLoading,
    authUser: user,
  };
}
