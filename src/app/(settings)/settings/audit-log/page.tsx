
'use client';

import { PaginationControls } from '@/components/pagination-controls';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Log } from '@/lib/types';
import { getLogs } from '@/app/actions/index';
import { useQuery } from '@/hooks/use-query';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AuditLogPage() {
  const router = useRouter();

  const [page, setPage] = React.useState(1);
  const pageSize = 50;

  const { data, isLoading, error } = useQuery<{ logs: Log[]; totalCount: number }>(
    () => getLogs({ limit: pageSize, offset: (page - 1) * pageSize }) as any,
    [page]
  );
  
  const logs = data?.logs ?? [];
  const totalCount = data?.totalCount ?? 0;
  const [selectedLog, setSelectedLog] = React.useState<Log | null>(null);

  // Sort logs by timestamp desc (server doesn't guarantee order)
  const sortedLogs = React.useMemo(() => {
    if (!logs) return [];
    return [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [logs]);

  if (error) {
    return (
      <div className="w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold text-destructive">Permission Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view the audit log.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full space-y-6">
        <header className="space-y-1.5">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
              <p className="text-muted-foreground">
                A chronological record of significant actions taken within the application.
              </p>
            </div>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Recent Actions</CardTitle>
            <CardDescription>
              Displaying the most recent activities first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-10 py-0 text-xs text-left">Timestamp</TableHead>
                  <TableHead className="h-10 py-0 text-xs text-left">User</TableHead>
                  <TableHead className="h-10 py-0 text-xs text-left">Action</TableHead>
                  <TableHead className="h-10 py-0 text-xs text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && sortedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs py-1.5 px-3">
                      {format(new Date(log.timestamp), 'dd/MM/yy, hh:mm:ss a')}
                    </TableCell>
                    <TableCell className="py-1.5 px-3">{log.userDisplayName}</TableCell>
                    <TableCell className="py-1.5 px-3 font-medium text-sm">{log.action}</TableCell>
                    <TableCell className="text-right py-1.5 px-3">
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => setSelectedLog(log)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && sortedLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No audit log entries found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <PaginationControls
              page={page}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={(isOpen) => !isOpen && setSelectedLog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Details</DialogTitle>
              <DialogDescription>
                Detailed information for action: <span className="font-semibold">{selectedLog.action}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
              <pre>
                <code>
                  {JSON.stringify(selectedLog.details, null, 2)}
                </code>
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
