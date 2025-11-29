import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, JobEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import JSZip from 'jszip';
import type { AnalysisResult, GeneratedFile, PWAOptions, JobState, ValidationResult, ValidationChecklistItem, ExportResult, HistoryResponse } from "@shared/types";
// Mock templates for generation
const createManifestContent = (options: PWAOptions, analysis: AnalysisResult) => JSON.stringify({
  name: `PWA for ${analysis.detectedStack} project`,
  short_name: "PWA App",
  start_url: "/",
  display: "standalone",
  theme_color: options.themeColor || "#0066FF",
  background_color: "#FFFFFF",
  icons: [{ src: "/icon-512x512.png", sizes: "512x512", type: "image/png" }],
}, null, 2);
const createServiceWorkerContent = () => `
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
if (workbox) {
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document',
    new workbox.strategies.NetworkFirst()
  );
}
`;
const createOfflineHtmlContent = () => `
<!DOCTYPE html>
<html>
<head><title>Offline</title></head>
<body><h1>You are offline</h1><p>This page is displayed when there is no network connection.</p></body>
</html>
`;
const injectSWRegistration = (content: string) => {
  if (content.includes("navigator.serviceWorker.register")) {
    return content; // Already there
  }
  return content + `\n\nif ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }`;
};
// Mock validation logic
async function performValidation(generated: GeneratedFile[]): Promise<ValidationResult> {
  const checklist: ValidationChecklistItem[] = [];
  const remediation: string[] = [];
  const manifestFile = generated.find(f => f.path.includes('manifest.json'));
  if (!manifestFile) {
    checklist.push({ id: 'manifest-exists', pass: false, message: 'manifest.json file is missing.' });
    remediation.push('Ensure the "Generate" step created a manifest.json file.');
  } else {
    try {
      JSON.parse(manifestFile.content);
      checklist.push({ id: 'manifest-valid-json', pass: true, message: 'manifest.json is valid JSON.' });
    } catch (e) {
      checklist.push({ id: 'manifest-valid-json', pass: false, message: 'manifest.json is not valid JSON.' });
      remediation.push('Fix syntax errors in the generated manifest.json.');
    }
  }
  const swFile = generated.find(f => f.path.includes('sw.js'));
  checklist.push({ id: 'sw-exists', pass: !!swFile, message: 'Service Worker file (sw.js) exists.' });
  if (!swFile) remediation.push('Ensure the "Generate" step created a sw.js file.');
  const entryFile = generated.find(f => f.type === 'modified');
  if (entryFile && entryFile.content.includes("navigator.serviceWorker.register")) {
    checklist.push({ id: 'sw-registration', pass: true, message: 'Service Worker registration snippet found.' });
  } else {
    checklist.push({ id: 'sw-registration', pass: false, message: 'Service Worker registration snippet is missing.' });
    remediation.push('Ensure the "Generate" step correctly modified the entry file to include SW registration code.');
  }
  await new Promise(res => setTimeout(res, 3000));
  const allPass = checklist.every(item => item.pass);
  if (allPass) {
    checklist.push({ id: 'lighthouse-pwa', pass: true, message: 'Lighthouse PWA audit passed (simulated).' });
  }
  return {
    score: allPass ? '100/100' : `${checklist.filter(c => c.pass).length * 25}/100`,
    checklist,
    remediation,
  };
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- PWA_Gen API Routes ---
  app.post('/api/analyze', async (c) => {
    const contentType = c.req.header('content-type') || '';
    let job: JobState;
    const startAnalysis = async (jobId: string, analysisFn: () => Promise<AnalysisResult>) => {
      const jobEntity = new JobEntity(c.env, jobId);
      await jobEntity.updateStatus('analyzing');
      c.executionCtx.waitUntil(
        analysisFn()
          .then(result => jobEntity.updateStatus('complete', result))
          .catch(e => jobEntity.updateStatus('error', undefined, undefined, e instanceof Error ? e.message : 'Unknown error'))
      );
    };
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      const file = formData.get('file') as File;
      if (!file) return bad(c, 'File not provided');
      job = await JobEntity.createJob(c.env, { input: { name: file.name }, inputType: 'zip' });
      await startAnalysis(job.id, async () => {
        const buffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(buffer);
        return {
          platform: "PWA_Gen", detectedStack: "Vite+React", entryFile: "src/main.tsx",
          manifestPath: "public/manifest.json", swRegLocation: "src/main.tsx",
          totalFiles: Object.keys(zip.files).length, prePWA_LighthouseEstimate: "65/100",
          cloudflareOptimized: true, jobId: job.id,
        };
      });
    } else if (contentType.includes('application/json')) {
      const { githubUrl } = await c.req.json<{ githubUrl: string }>();
      if (!githubUrl) return bad(c, 'GitHub URL not provided');
      job = await JobEntity.createJob(c.env, { input: githubUrl, inputType: 'github' });
      await startAnalysis(job.id, async () => {
        await new Promise(res => setTimeout(res, 2000)); // Simulate GitHub API call
        return {
          platform: "PWA_Gen", detectedStack: "Vite+React", entryFile: "src/main.tsx",
          manifestPath: "public/manifest.json", swRegLocation: "src/main.tsx",
          totalFiles: 123, prePWA_LighthouseEstimate: "70/100",
          cloudflareOptimized: true, jobId: job.id,
        };
      });
    } else {
      return bad(c, 'Unsupported content type');
    }
    return ok(c, { jobId: job.id });
  });
  app.post('/api/generate', async (c) => {
    const { jobId, options } = await c.req.json<{ jobId: string, options: PWAOptions }>();
    if (!jobId) return bad(c, 'Job ID is required');
    const jobEntity = new JobEntity(c.env, jobId);
    if (!await jobEntity.exists()) return notFound(c, 'Job not found');
    const jobState: JobState = await jobEntity.getState();
    if (jobState.status !== 'complete' || !jobState.analysis) {
      return bad(c, 'Job is not ready for generation. Analysis must be complete.');
    }
    const analysis = jobState.analysis;
    const generatedFiles: GeneratedFile[] = [
      { path: analysis.manifestPath, content: createManifestContent(options, analysis), type: 'new' },
      { path: 'public/sw.js', content: createServiceWorkerContent(), type: 'new' },
      { path: 'public/offline.html', content: createOfflineHtmlContent(), type: 'new' },
      { path: analysis.swRegLocation, content: injectSWRegistration("/* Existing content of main.tsx */"), type: 'modified' },
    ];
    await jobEntity.updateStatus('generated', analysis, generatedFiles);
    return ok(c, { jobId });
  });
  app.post('/api/validate', async (c) => {
    const { jobId } = await c.req.json<{ jobId: string }>();
    if (!jobId) return bad(c, 'Job ID is required');
    const jobEntity = new JobEntity(c.env, jobId);
    if (!await jobEntity.exists()) return notFound(c, 'Job not found');
    const jobState: JobState = await jobEntity.getState();
    if (jobState.status !== 'generated' || !jobState.generated) {
      return bad(c, 'Generation must be complete before validation.');
    }
    await jobEntity.updateStatus('validating', jobState.analysis, jobState.generated);
    c.executionCtx.waitUntil(
      performValidation(jobState.generated)
        .then(validationResult => jobEntity.updateStatus('validated', jobState.analysis, jobState.generated, undefined, validationResult))
        .catch(e => jobEntity.updateStatus('error', jobState.analysis, jobState.generated, e instanceof Error ? e.message : 'Validation failed'))
    );
    return ok(c, { jobId });
  });
  app.post('/api/export', async (c) => {
    const { jobId, exportType, branch, token } = await c.req.json<{ jobId: string; exportType: 'zip' | 'github' | 'cf'; branch?: string; token?: string }>();
    if (!jobId || !exportType) return bad(c, 'jobId and exportType are required');
    const jobEntity = new JobEntity(c.env, jobId);
    if (!await jobEntity.exists()) return notFound(c, 'Job not found');
    const jobState = await jobEntity.getState();
    if (jobState.status !== 'validated') return bad(c, 'Job must be validated before export.');
    let result: ExportResult;
    switch (exportType) {
      case 'zip': {
        const zip = new JSZip();
        // Here you would add original files + generated files
        jobState.generated?.forEach(f => zip.file(f.path, f.content));
        const content = await zip.generateAsync({ type: 'base64' });
        result = { type: 'zip', blobUrl: `data:application/zip;base64,${content}` };
        break;
      }
      case 'github': {
        // Mock GitHub push
        await new Promise(res => setTimeout(res, 2500));
        result = { type: 'github', commitSha: crypto.randomUUID().replace(/-/g, '').slice(0, 7), branch: branch || 'pwa-generated' };
        break;
      }
      case 'cf': {
        const instructions = `1. Install Wrangler: bun add -g wrangler\n2. Build your project: bun run build\n3. Deploy: npx wrangler pages publish dist`;
        const wranglerToml = `name = "my-pwa-app"\ncompatibility_date = "2024-01-01"`;
        result = { type: 'cf', instructions, wranglerToml };
        break;
      }
      default: return bad(c, 'Invalid export type');
    }
    await jobEntity.updateStatus('exported', jobState.analysis, jobState.generated, undefined, jobState.validation, result);
    return ok(c, result);
  });
  app.get('/api/history', async (c) => {
    const cursor = c.req.query('cursor');
    const limit = c.req.query('limit');
    const page = await JobEntity.list(c.env, cursor ?? null, limit ? parseInt(limit, 10) : 10);
    return ok(c, page as HistoryResponse);
  });
  app.post('/api/rerun', async (c) => {
    const { jobId } = await c.req.json<{ jobId: string }>();
    if (!jobId) return bad(c, 'jobId is required');
    const oldJobEntity = new JobEntity(c.env, jobId);
    if (!await oldJobEntity.exists()) return notFound(c, 'Original job not found');
    const oldJobState = await oldJobEntity.getState();
    const newJob = await JobEntity.createJob(c.env, { input: oldJobState.input, inputType: oldJobState.inputType });
    return ok(c, { newJobId: newJob.id });
  });
  app.post('/api/history/clear', async (c) => {
    const count = await JobEntity.clearAll(c.env);
    return ok(c, { clearedCount: count });
  });
  app.get('/api/job/:id', async (c) => {
    const { id } = c.req.param();
    const job = new JobEntity(c.env, id);
    if (!(await job.exists())) return notFound(c, 'Job not found');
    return ok(c, await job.getState());
  });
  // --- Existing Demo Routes ---
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const page = await UserEntity.list(c.env, c.req.query('cursor') ?? null, c.req.query('limit') ? Math.max(1, (Number(c.req.query('limit')) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const page = await ChatBoardEntity.list(c.env, c.req.query('cursor') ?? null, c.req.query('limit') ? Math.max(1, (Number(c.req.query('limit')) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  app.get('/api/chats/:chatId/messages', async (c) => {
    const chat = new ChatBoardEntity(c.env, c.req.param('chatId'));
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.listMessages());
  });
  app.post('/api/chats/:chatId/messages', async (c) => {
    const chatId = c.req.param('chatId');
    const { userId, text } = (await c.req.json()) as { userId?: string; text?: string };
    if (!isStr(userId) || !text?.trim()) return bad(c, 'userId and text required');
    const chat = new ChatBoardEntity(c.env, chatId);
    if (!await chat.exists()) return notFound(c, 'chat not found');
    return ok(c, await chat.sendMessage(userId, text.trim()));
  });
}