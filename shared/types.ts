export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
// PWA_Gen specific types
export interface AnalysisResult {
  platform: string;
  detectedStack: string;
  entryFile: string;
  manifestPath: string;
  swRegLocation: string;
  totalFiles: number;
  prePWA_LighthouseEstimate: string;
  cloudflareOptimized: boolean;
  jobId?: string;
}
export interface JobState {
  id: string;
  input: string | { name: string };
  inputType: 'zip' | 'github';
  status: 'pending' | 'analyzing' | 'complete' | 'error';
  analysis?: AnalysisResult;
  createdAt: number;
  error?: string;
}
// Minimal real-world chat example types (shared by frontend and worker)
export interface User {
  id: string;
  name: string;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}