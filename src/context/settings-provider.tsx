'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { getSettings } from '@/app/actions/index';
import { useAuth } from '@/context/auth-provider';
import { ClinicSettings } from '@/lib/types';

interface SettingsContextValue {
    settings: ClinicSettings | null;
    isLoading: boolean;
    currency: string;
    formatCurrency: (amount: number) => string;
    refreshSettings: () => Promise<void>;
}

const defaultSettings: ClinicSettings = {
    clinicName: 'MediTrack Pro',
    clinicAddress: '123 Health St, Wellness City',
    clinicPhone: '+123456789',
    currency: 'USD',
    patientIdPrefix: 'MPC',
    sessionTimeout: 30, // 30 minutes default
    nextReceiptNumber: 1000,
    nextInvoiceNumber: 1000,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [settings, setSettings] = useState<ClinicSettings | null>(null);
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);

    const refreshSettings = useCallback(async () => {
        setIsSettingsLoading(true);
        try {
            const row = await getSettings('clinic');
            if (row?.value) {
                setSettings(row.value as ClinicSettings);
            } else {
                setSettings(defaultSettings);
            }
        } catch (error) {
            console.error("Failed to refresh settings:", error);
            setSettings(defaultSettings);
        } finally {
            setIsSettingsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            setSettings(null);
            setIsSettingsLoading(false);
            return;
        }

        refreshSettings();
    }, [user, refreshSettings]);

    const resolvedSettings = useMemo(() => settings || defaultSettings, [settings]);
    const currency = useMemo(() => resolvedSettings?.currency || 'USD', [resolvedSettings]);

    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }, [currency]);

    const value = useMemo(() => ({
        settings: resolvedSettings,
        isLoading: isAuthLoading || isSettingsLoading,
        currency,
        formatCurrency,
        refreshSettings,
    }), [resolvedSettings, isAuthLoading, isSettingsLoading, currency, formatCurrency, refreshSettings]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
