import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ChatBoardEntity, JobEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import JSZip from 'jszip';
import type { AnalysisResult } from "@shared/types";
// A mock Octokit for type safety without including the full library in the main bundle if not needed.
// In a real scenario, you might use a dynamic import or ensure it's bundled.
const mockOctokit = { repos: { getContent: () => {}, getCommit: () => {} } };
type Octokit = typeof mockOctokit;
const detectStack = (pkg: { dependencies?: Record<string, string>, devDependencies?: Record<string, string> }): string => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (deps['next']) return 'Next.js';
    if (deps['@angular/core']) return 'Angular';
    if (deps['svelte']) return 'SvelteKit';
    if (deps['vue']) return 'Vue/Nuxt';
    if (deps['vite'] && deps['react']) return 'Vite+React';
    if (deps['react']) return 'React (CRA)';
    return 'Vanilla JS';
};
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // --- PWA_Gen API Routes ---
  app.post('/api/analyze', async (c) => {
    const contentType = c.req.header('content-type') || '';
    let job;
    let analysisPromise;
    if (contentType.includes('multipart/form-data')) {
        const formData = await c.req.formData();
        const file = formData.get('file') as File;
        if (!file) return bad(c, 'File not provided');
        job = await JobEntity.createJob(c.env, { input: { name: file.name }, inputType: 'zip' });
        const jobEntity = new JobEntity(c.env, job.id);
        await jobEntity.updateStatus('analyzing');
        analysisPromise = (async () => {
            const buffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(buffer);
            let pkg: any = {};
            const pkgFile = zip.file('package.json');
            if (pkgFile) {
                pkg = JSON.parse(await pkgFile.async('string'));
            }
            const stack = detectStack(pkg);
            const result: AnalysisResult = {
                platform: "PWA_Gen",
                detectedStack: stack,
                entryFile: "src/main.tsx", // Heuristic
                manifestPath: "public/manifest.json", // Heuristic
                swRegLocation: "src/main.tsx", // Heuristic
                totalFiles: Object.keys(zip.files).length,
                prePWA_LighthouseEstimate: "65/100",
                cloudflareOptimized: true,
                jobId: job.id,
            };
            await jobEntity.updateStatus('complete', result);
            return result;
        })();
    } else if (contentType.includes('application/json')) {
        const { githubUrl } = await c.req.json<{ githubUrl: string }>();
        if (!githubUrl) return bad(c, 'GitHub URL not provided');
        job = await JobEntity.createJob(c.env, { input: githubUrl, inputType: 'github' });
        const jobEntity = new JobEntity(c.env, job.id);
        await jobEntity.updateStatus('analyzing');
        // This part is a placeholder for full Octokit implementation
        // In a real scenario, you'd use Octokit to fetch repo contents.
        analysisPromise = (async () => {
            await new Promise(res => setTimeout(res, 2000)); // Simulate API call
            const result: AnalysisResult = {
                platform: "PWA_Gen",
                detectedStack: "Vite+React", // Mocked for GitHub
                entryFile: "src/main.tsx",
                manifestPath: "public/manifest.json",
                swRegLocation: "src/main.tsx",
                totalFiles: 123, // Mocked
                prePWA_LighthouseEstimate: "70/100",
                cloudflareOptimized: true,
                jobId: job.id,
            };
            await jobEntity.updateStatus('complete', result);
            return result;
        })();
    } else {
        return bad(c, 'Unsupported content type');
    }
    // Don't wait for the full analysis to complete. Return the job ID immediately.
    // The client will poll for the result.
    c.executionCtx.waitUntil(analysisPromise.catch(async (e) => {
        const jobEntity = new JobEntity(c.env, job.id);
        await jobEntity.updateStatus('error', undefined, e instanceof Error ? e.message : 'Unknown error');
    }));
    return ok(c, { jobId: job.id });
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