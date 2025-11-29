import { useState, useCallback } from 'react';
import { api } from '@/lib/api-client';
export interface AnalysisResult {
  platform: string;
  detectedStack: string;
  entryFile: string;
  manifestPath: string;
  swRegLocation: string;
  totalFiles: number;
  prePWA_LighthouseEstimate: string;
  cloudflareOptimized: boolean;
}
export function useFileAnalyzer() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyze = useCallback(async (input: File | string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      let data: AnalysisResult;
      if (typeof input === 'string') {
        // GitHub URL
        data = await api<AnalysisResult>('/api/analyze', {
          method: 'POST',
          body: JSON.stringify({ githubUrl: input }),
        });
      } else {
        // File upload
        const formData = new FormData();
        formData.append('file', input);
        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Analysis failed');
        }
        data = json.data;
      }
      setResult(data);
      return data;
    } catch (err) {
      const e = err as Error;
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, []);
  return { result, isLoading, error, analyze };
}