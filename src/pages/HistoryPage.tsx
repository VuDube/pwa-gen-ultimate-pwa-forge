import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, RefreshCw, Download } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useFileAnalyzer } from '@/hooks/use-file-analyzer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { JobState } from '@shared/types';
export function HistoryPage() {
  const { history, loadHistory, rerunJob, isLoading } = useFileAnalyzer();
  const navigate = useNavigate();
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  const handleRerun = async (jobId: string) => {
    toast.info('Re-running job...');
    const newJobId = await rerunJob(jobId);
    if (newJobId) {
      navigate('/');
    }
  };
  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-8">Project History</h1>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Stack</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && !history ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : history?.items && history.items.length > 0 ? (
                    history.items.map((job: JobState) => (
                      <motion.tr key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="font-medium">{typeof job.input === 'string' ? 'GitHub Repo' : job.input.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{job.id}</div>
                        </TableCell>
                        <TableCell><Badge variant={job.status === 'validated' || job.status === 'exported' ? 'default' : 'secondary'}>{job.status}</Badge></TableCell>
                        <TableCell>{new Date(job.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{job.analysis?.detectedStack || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon" className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Job Details: {job.id}</DialogTitle></DialogHeader>
                                <pre className="mt-2 w-full rounded-md bg-slate-950 p-4 overflow-auto max-h-96"><code className="text-white">{JSON.stringify(job, null, 2)}</code></pre>
                              </DialogContent>
                            </Dialog>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleRerun(job.id)}><RefreshCw className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">No history found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => loadHistory()} disabled={!history?.next || isLoading}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadHistory(history?.next)} disabled={!history?.next || isLoading}>
              Next
            </Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}