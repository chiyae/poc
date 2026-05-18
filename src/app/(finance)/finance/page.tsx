'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinanceRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/finance/dashboard');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-800 border-t-emerald-500" />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Loading Finance Dashboard...</p>
            </div>
        </div>
    );
}
