'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getCurrentUser, logout as logoutAction } from '@/app/auth-actions';

export interface AppUser {
    id: string;
    username: string;
    displayName: string;
    role: string;
    locationId: string;
}

interface AuthContextValue {
    user: AppUser | null;
    isLoading: boolean;
    login: (user: AppUser) => void;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const userRef = React.useRef<AppUser | null>(null);

    // Keep the ref in sync with state
    React.useEffect(() => {
        userRef.current = user;
    }, [user]);

    const refreshUser = useCallback(async (force = false) => {
        // Simple client-side cache: if we have a user and aren't forcing, don't refetch
        if (!force && userRef.current) {
            setIsLoading(false);
            return;
        }

        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []); // No dependencies - uses ref for user check

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const loginHandler = useCallback((loggedInUser: AppUser) => {
        setUser(loggedInUser);
    }, []);

    const logoutHandler = useCallback(async () => {
        await logoutAction();
        setUser(null);
    }, []);

    const value = React.useMemo(() => ({
        user, isLoading, login: loginHandler, logout: logoutHandler, refreshUser
    }), [user, isLoading, loginHandler, logoutHandler, refreshUser]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
