import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api-client';
import type { AnalysisResult, JobState, PWAOptions, GeneratedFiles } from '@shared/types';
export function useFileAnalyzer() {
  const [job, setJob] = useState<JobState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        if (['complete', 'generated', 'error'].includes(updatedJob.status)) {
          stopPolling();
          setIsLoading(false);
          if (updatedJob.status === 'error') {
            setError(updatedJob.error || 'Analysis failed');
          }
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
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      if (typeof input === 'string') {
        headers['Content-Type'] = 'application/json';
        response = await api<{ jobId: string }>('/api/analyze', {
          method: 'POST',
          headers,
          body: JSON.stringify({ githubUrl: input }),
        });
      } else {
        const formData = new FormData();
        formData.append('file', input);
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers,
          body: formData,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Analysis failed');
        }
        response = json.data;
      }
      if (response.jobId) {
        setJob({ id: response.jobId, status: 'pending' } as JobState); // Initial state
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
      const response = await api<{ jobId: string }>('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, options }),
      });
      if (response.jobId) {
        pollJobStatus(response.jobId);
      } else {
        throw new Error('Generate request did not return a job ID.');
      }
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      setIsLoading(false);
      throw e;
    }
  }, [pollJobStatus]);
  const reset = useCallback(() => {
    stopPolling();
    setJob(null);
    setIsLoading(false);
    setError(null);
  }, []);
  return {
    result: job?.analysis ?? null,
    generatedFiles: job?.generated ?? null,
    job,
    isLoading,
    error,
    analyze,
    generate,
    reset
  };
}