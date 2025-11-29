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
export type GeneratedFile = {
  path: string;
  content: string;
  type: 'new' | 'modified' | 'deleted';
};
export type GeneratedFiles = GeneratedFile[];
export interface PWAOptions {
  themeColor: string;
  backgroundColor?: string;
  icons?: string[];
}
export interface ValidationChecklistItem {
  id: string;
  pass: boolean;
  message: string;
}
export interface ValidationResult {
  score: string;
  checklist: ValidationChecklistItem[];
  remediation: string[];
}
export interface ExportResult {
  type: 'zip' | 'github' | 'cf';
  blobUrl?: string;
  commitSha?: string;
  branch?: string;
  instructions?: string;
  wranglerToml?: string;
}
export interface JobState {
  id: string;
  input: string | { name: string };
  inputType: 'zip' | 'github';
  status: 'pending' | 'analyzing' | 'complete' | 'generated' | 'validating' | 'validated' | 'exported' | 'error';
  analysis?: AnalysisResult;
  generated?: GeneratedFiles;
  validation?: ValidationResult;
  export?: ExportResult;
  createdAt: number;
  error?: string;
}
export interface HistoryResponse {
  items: JobState[];
  next: string | null;
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