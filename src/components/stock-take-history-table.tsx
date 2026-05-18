'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { StockTakeSession } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getStockTakeSessionsByLocation, getStockTakeSessions } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';

interface StockTakeHistoryTableProps {
    /** If provided, filters sessions by location. Otherwise shows all sessions. */
    locationId?: string;
    /** Page title */
    title: string;
    /** Page description */
    description: string;
    /** Card title */
    cardTitle: string;
    /** Card description */
    cardDescription: string;
    /** The link prefix for resume/view actions, e.g. "/bulk-store" or "/dispensary" */
    linkPrefix: string;
    /** Whether to show the location column */
    showLocationColumn?: boolean;
}

export default function StockTakeHistoryTable({
    locationId,
    title,
    description,
    cardTitle,
    cardDescription,
    linkPrefix,
    showLocationColumn = false,
}: StockTakeHistoryTableProps) {
    const router = useRouter();

    const { data: sessionsData, isLoading } = useQuery<{ sessions: StockTakeSession[]; totalCount: number }>(
        () => (locationId
            ? getStockTakeSessionsByLocation(locationId)
            : getStockTakeSessions()) as any,
        [locationId]
    );

    const sessions = sessionsData?.sessions || [];

    const sortedSessions = React.useMemo(() => {
        return sessions?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
    }, [sessions]);

    const colCount = showLocationColumn ? 5 : 4;

    return (
        <div className="space-y-6">
            <header className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" /><span className="sr-only">Back</span>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                        <p className="text-muted-foreground">{description}</p>
                    </div>
                </div>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>{cardTitle}</CardTitle>
                    <CardDescription>{cardDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Session ID</TableHead>
                                <TableHead>Date</TableHead>
                                {showLocationColumn && <TableHead>Location</TableHead>}
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}><TableCell colSpan={colCount}><Skeleton className='h-8 w-full' /></TableCell></TableRow>
                            ))}
                            {!isLoading && sortedSessions.length === 0 ? (
                                <TableRow><TableCell colSpan={colCount} className="h-24 text-center">No sessions found.</TableCell></TableRow>
                            ) : (
                                sortedSessions?.map((session) => (
                                    <TableRow key={session.id}>
                                        <TableCell className="font-mono">{session.id}</TableCell>
                                        <TableCell>{format(new Date(session.date), 'dd/MM/yyyy, h:mm a')}</TableCell>
                                        {showLocationColumn && <TableCell>{session.locationId}</TableCell>}
                                        <TableCell><Badge variant={session.status === 'Completed' ? 'default' : 'secondary'}>{session.status}</Badge></TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" onClick={() => router.push(`${linkPrefix}/stock-taking?session=${session.id}`)}>
                                                {session.status === 'Ongoing' ? 'Resume' : 'View'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
