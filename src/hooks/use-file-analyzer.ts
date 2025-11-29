import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import type { AnalysisResult, JobState, PWAOptions, GeneratedFiles, ValidationResult, HistoryResponse, ExportResult } from '@shared/types';
export function useFileAnalyzer() {
  const [job, setJob] = useState<JobState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };
  const pollJobStatus = useCallback((jobId: string) => {
    stopPolling(); // Ensure no multiple pollers
    pollingInterval.current = setInterval(async () => {
      try {
        const updatedJob = await api<JobState>(`/api/job/${jobId}`);
        setJob(updatedJob);
        if (['complete', 'generated', 'validated', 'exported', 'error'].includes(updatedJob.status)) {
          stopPolling();
          setIsLoading(false);
          if (updatedJob.status === 'error') setError(updatedJob.error || 'Job failed');
          if (updatedJob.status === 'exported') setExportResult(updatedJob.export || null);
        }
      } catch (err) {
        setError('Failed to poll job status.');
        stopPolling();
        setIsLoading(false);
      }
    }, 2000);
  }, []);
  const analyze = useCallback(async (input: File | string, token?: string | null) => {
    setIsLoading(true);
    setError(null);
    setJob(null);
    stopPolling();
    try {
      let response: { jobId: string };
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (typeof input === 'string') {
        headers['Content-Type'] = 'application/json';
        response = await api<{ jobId: string }>('/api/analyze', { method: 'POST', headers, body: JSON.stringify({ githubUrl: input }) });
      } else {
        const formData = new FormData();
        formData.append('file', input);
        const res = await fetch('/api/analyze', { method: 'POST', headers, body: formData });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Analysis failed');
        response = json.data;
      }
      if (response.jobId) {
        setJob({ id: response.jobId, status: 'pending' } as JobState);
        pollJobStatus(response.jobId);
      } else {
        throw new Error('Analysis did not return a job ID.');
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      setIsLoading(false);
      throw e;
    }
  }, [pollJobStatus]);
  const generate = useCallback(async (jobId: string, options: PWAOptions) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api<{ jobId: string }>('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId, options }) });
      if (response.jobId) pollJobStatus(response.jobId);
      else throw new Error('Generate request did not return a job ID.');
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      setIsLoading(false);
      throw e;
    }
  }, [pollJobStatus]);
  const validate = useCallback(async (jobId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api<{ jobId: string }>('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) });
      if (response.jobId) pollJobStatus(response.jobId);
      else throw new Error('Validate request did not return a job ID.');
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      setIsLoading(false);
      throw e;
    }
  }, [pollJobStatus]);
  const exportJob = useCallback(async (jobId: string, exportType: 'zip' | 'github' | 'cf', options: { branch?: string; token?: string } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api<ExportResult>('/api/export', { method: 'POST', body: JSON.stringify({ jobId, exportType, ...options }) });
      setExportResult(res);
      if (res.blobUrl) {
        const link = document.createElement("a");
        link.href = res.blobUrl;
        link.download = "pwa-transformed.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      // For github/cf, the result is handled via state update
      return res;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const loadHistory = useCallback(async (cursor?: string, limit = 10) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) params.set('cursor', cursor);
      const res = await api<HistoryResponse>(`/api/history?${params.toString()}`);
      setHistory(res);
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const rerunJob = useCallback(async (jobId: string) => {
    setIsLoading(true);
    try {
      const res = await api<{ newJobId: string }>('/api/rerun', { method: 'POST', body: JSON.stringify({ jobId }) });
      if (res.newJobId) {
        reset(); // Reset current view to track the new job
        pollJobStatus(res.newJobId);
      }
      return res.newJobId;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [pollJobStatus]);
  const clearHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api<{ clearedCount: number }>('/api/history/clear', { method: 'POST' });
      await loadHistory(); // Refresh history
      return res;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [loadHistory]);
  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setIsLoading(false);
    setError(null);
    setHistory(null);
    setExportResult(null);
  }, []);
  return {
    result: job?.analysis ?? null,
    generatedFiles: job?.generated ?? null,
    validationResult: job?.validation ?? null,
    exportResult,
    job,
    isLoading,
    error,
    history,
    analyze,
    generate,
    validate,
    exportJob,
    loadHistory,
    rerunJob,
    clearHistory,
    reset
  };
}