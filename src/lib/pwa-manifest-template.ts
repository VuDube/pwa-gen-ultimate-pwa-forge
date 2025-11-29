interface ManifestOptions {
  name: string;
  short_name: string;
  theme_color: string;
  background_color: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
  screenshots?: { src: string; sizes: string; type: string; form_factor?: 'wide' | 'narrow' }[];
}
export function createManifest(options: Partial<ManifestOptions> = {}) {
  const defaults: ManifestOptions = {
    name: "PWA_Gen - Ultimate PWA Builder",
    short_name: "PWA_Gen",
    theme_color: "#0066FF",
    background_color: "#FFFFFF",
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: 'maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
  return {
    "$schema": "https://json.schemastore.org/web-manifest-combined.json",
    "start_url": "/",
    "display": "standalone",
    ...defaults,
    ...options,
  };
}