# PWA_Gen — Ultimate PWA Forge

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/VuDube/pwa-gen-ultimate-pwa-forge)

PWA_Gen is a Cloudflare-native Progressive Web App (PWA) generation platform. It is a single-page Vite+React application hosted on Cloudflare Pages with serverless APIs on Cloudflare Workers to ingest code (via ZIP upload, local folder, or GitHub repo), analyze the codebase for framework and build patterns, synthesize and inject standards-compliant PWA infrastructure (manifest, Workbox service worker, offline shell), and run deterministic validations. The platform features an elegant dashboard guiding users through a 4-step pipeline: Analyze → Generate → Validate → Export. Storage uses KV for sessions and OAuth tokens, and D1 for project history and diffs. The runtime is optimized for Cloudflare (Pages for static assets, Workers for APIs, Durable Objects for atomic operations).

## Key Features

- **Autonomous Code Ingestion**: Drag-and-drop ZIP/folder uploads or GitHub repo imports with OAuth PKCE support.
- **Framework-Agnostic Detection**: Automatically identifies stacks like React (Vite), Next.js, Vue/Nuxt, SvelteKit, Angular, and Vanilla JS via package.json, entry files, and build configs.
- **PWA Infrastructure Synthesis**: Generates framework-specific manifest.json, Workbox-powered sw.js (via CDN), offline.html, and registration snippets without custom install UI.
- **Validation Suite**: Deterministic checks for Lighthouse 100/100 criteria (manifest validity, SW registration, offline fallback, HTTPS readiness) plus orchestrated full audits via GitHub Actions.
- **Export Options**: Download transformed ZIP, atomic GitHub commits, or Cloudflare preview deployment instructions.
- **Project Dashboard**: History, diffs, re-runs, and GitHub integration for seamless workflows.
- **Cloudflare-Optimized**: Edge caching, fast TTI (<2s), and native PWA support for the platform itself.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Lucide React icons, Sonner (toasts), React Router, Zustand (state), React Hook Form.
- **Backend**: Hono (routing), Cloudflare Workers, Durable Objects (atomic storage), D1 (SQLite), KV (sessions/tokens).
- **Integrations**: Octokit (GitHub API), JSZip (ZIP handling), Workbox (service workers), Zod (validation).
- **Dev Tools**: TypeScript, ESLint, Bun (package manager), Wrangler (Cloudflare CLI).
- **PWA Standards**: Manifest v3+, beforeinstallprompt (native install), offline support, responsive design.

## Quick Start

### Prerequisites

- Bun 1.0+ (package manager)
- Node.js 18+ (for some dev tools)
- Cloudflare account with Workers/Pages enabled
- Wrangler CLI: `bun add -g wrangler`

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd pwa_gen
   ```

2. Install dependencies with Bun:
   ```
   bun install
   ```

3. Generate TypeScript types for Cloudflare bindings:
   ```
   bun run cf-typegen
   ```

### Development

- Start the development server (frontend + worker proxy):
  ```
  bun run dev
  ```
  Access at `http://localhost:3000`.

- For worker-only development (API endpoints):
  ```
  npx wrangler dev
  ```

- Lint the codebase:
  ```
  bun run lint
  ```

The app includes hot-reload for frontend changes and proxies API calls to the local worker during dev.

### Build

Build the frontend for production:
```
bun run build
```
Output is in `dist/`, ready for Cloudflare Pages.

## Usage

### Dashboard (Home)

The main landing page features:
- GitHub OAuth login for repo imports.
- Drag-and-drop zone for ZIP/folder uploads or GitHub URL input.
- 4-step stepper: Analyze (detect stack), Generate (inject PWA files), Validate (Lighthouse checks), Export (ZIP/GitHub/CF deploy).
- Sidebar for project stats, detected framework, and quick actions.
- Recent projects and history via D1 storage.

### Job Workflow

1. **Ingest**: Upload files or paste GitHub URL (e.g., `owner/repo@branch/path`). Client-side scan shows file tree.
2. **Analyze**: POST to `/api/analyze` returns JSON with `detectedStack` (e.g., "Vite+React"), entry points, and Lighthouse estimate.
3. **Generate**: POST to `/api/generate` synthesizes files (manifest in `public/`, SW registration in `src/main.jsx` for Vite).
4. **Validate**: POST to `/api/validate` runs checks; full Lighthouse via GitHub Actions for 100/100 scores.
5. **Export**: Download ZIP via JSZip, push to GitHub (atomic commit), or get CF deploy commands.

### API Endpoints

All APIs are under `/api/` and return `ApiResponse<T>`:
- `POST /api/analyze`: Accepts multipart (ZIP) or JSON (GitHub URL).
- `POST /api/generate`: Takes analysis JSON, returns transformed files.
- `POST /api/validate`: Checklist and audit orchestration.
- `POST /api/export`: ZIP blob or GitHub commit.
- `GET /api/job/:id`: Poll job progress.
- `POST /api/github/oauth`: PKCE flow for tokens (stored in KV).

Error handling uses Sonner toasts; all responses include success/error fields.

### Example: Processing a Vite+React Project

1. Drag a project ZIP into the dashboard.
2. Click "Analyze" → Detects `Vite+React`, suggests `public/manifest.json` and `src/main.jsx` registration.
3. Customize options (theme color `#0066FF`, icons).
4. "Generate" injects Workbox SW with StaleWhileRevalidate for assets.
5. "Validate" confirms 100/100 Lighthouse (no custom install UI).
6. Export as ZIP or push to GitHub branch `pwa-generated`.

For GitHub: Authorize via OAuth, import `user/repo@main`, exports create a new branch with changes.

## Deployment

Deploy to Cloudflare Pages (frontend) + Workers (backend) in one command:

```
bun run deploy
```

This builds the frontend, publishes to Pages, and deploys the worker with bindings intact. Assets are served from Pages with SPA fallback, APIs route through Workers.

### Manual Deployment

1. **Frontend (Pages)**:
   ```
   bun run build
   npx wrangler pages publish dist --project-name pwa_gen
   ```

2. **Backend (Workers)**:
   ```
   npx wrangler deploy
   ```
   Ensure `wrangler.toml` bindings match (GlobalDurableObject, D1, KV).

3. **Environment Variables**:
   - Set D1 database: `wrangler d1 create pwa_gen_history`
   - KV namespace: `wrangler kv:namespace create pwa_gen_sessions`
   - Bind in `wrangler.toml` (do not modify manually).

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/VuDube/pwa-gen-ultimate-pwa-forge)

Custom domain: Update Pages project settings. For production, enable Workers for `/api/*` routing.

## Contributing

1. Fork the repo and create a feature branch (`git checkout -b feature/pwa-enhancement`).
2. Commit changes (`git commit -m 'Add PWA validation for SvelteKit'`).
3. Push to branch (`git push origin feature/pwa-enhancement`).
4. Open a Pull Request.

Follow TypeScript strict mode, ESLint rules, and test APIs with Wrangler dev. Focus on framework detection accuracy and Lighthouse guarantees.

## License

MIT License. See [LICENSE](LICENSE) for details.