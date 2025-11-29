import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, JobEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import JSZip from 'jszip';
import type { AnalysisResult, GeneratedFile, PWAOptions } from "@shared/types";
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
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- PWA_Gen API Routes ---
  app.post('/api/analyze', async (c) => {
    const contentType = c.req.header('content-type') || '';
    let job;
    let analysisPromise;
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
        const pkgFile = zip.file('package.json');
        const pkg = pkgFile ? JSON.parse(await pkgFile.async('string')) : {};
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
    const jobState = await jobEntity.getState();
    if (jobState.status !== 'complete' || !jobState.analysis) {
      return bad(c, 'Job is not ready for generation. Analysis must be complete.');
    }
    const analysis = jobState.analysis;
    // This is a mock generation. A real implementation would fetch project files.
    const generatedFiles: GeneratedFile[] = [
      { path: analysis.manifestPath, content: createManifestContent(options, analysis), type: 'new' },
      { path: 'public/sw.js', content: createServiceWorkerContent(), type: 'new' },
      { path: 'public/offline.html', content: createOfflineHtmlContent(), type: 'new' },
      { path: analysis.swRegLocation, content: injectSWRegistration("/* Existing content of main.tsx */"), type: 'modified' },
    ];
    await jobEntity.updateStatus('generated', analysis, generatedFiles);
    return ok(c, { jobId });
  });
  app.get('/api/job/:id', async (c) => {
    const { id } = c.req.param();
    const job = new JobEntity(c.env, id);
    if (!(await job.exists())) {
      return notFound(c, 'Job not found');
    }
    const state = await job.getState();
    return ok(c, state);
  });
  // --- Existing Demo Routes ---
  app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
  // USERS
  app.get('/api/users', async (c) => {
    await UserEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await UserEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/users', async (c) => {
    const { name } = (await c.req.json()) as { name?: string };
    if (!name?.trim()) return bad(c, 'name required');
    return ok(c, await UserEntity.create(c.env, { id: crypto.randomUUID(), name: name.trim() }));
  });
  // CHATS
  app.get('/api/chats', async (c) => {
    await ChatBoardEntity.ensureSeed(c.env);
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ChatBoardEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  app.post('/api/chats', async (c) => {
    const { title } = (await c.req.json()) as { title?: string };
    if (!title?.trim()) return bad(c, 'title required');
    const created = await ChatBoardEntity.create(c.env, { id: crypto.randomUUID(), title: title.trim(), messages: [] });
    return ok(c, { id: created.id, title: created.title });
  });
  // MESSAGES
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
  // DELETE: Users
  app.delete('/api/users/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await UserEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/users/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await UserEntity.deleteMany(c.env, list), ids: list });
  });
  // DELETE: Chats
  app.delete('/api/chats/:id', async (c) => ok(c, { id: c.req.param('id'), deleted: await ChatBoardEntity.delete(c.env, c.req.param('id')) }));
  app.post('/api/chats/deleteMany', async (c) => {
    const { ids } = (await c.req.json()) as { ids?: string[] };
    const list = ids?.filter(isStr) ?? [];
    if (list.length === 0) return bad(c, 'ids required');
    return ok(c, { deletedCount: await ChatBoardEntity.deleteMany(c.env, list), ids: list });
  });
}