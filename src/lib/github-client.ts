import { Octokit } from '@octokit/rest';
export function createOctokit(token?: string) {
  const options: { auth?: string } = {};
  if (token) {
    options.auth = token;
  }
  return new Octokit(options);
}
export function parseRepoUrl(url: string): { owner: string; repo: string; branch?: string; path?: string } | null {
  const match = url.match(/^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:(?:\/tree\/|\@)([^/]+))?(?:\/(.*))?$/);
  if (!match) return null;
  return {
    owner: match[1],
    repo: match[2],
    branch: match[3], // can be undefined
    path: match[4],   // can be undefined
  };
}