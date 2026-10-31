import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const projectRootDir = typeof import.meta.dirname !== 'undefined'
  ? import.meta.dirname
  : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  const appUrl = process.env.APP_URL;
  let wsClientPort: number | undefined = undefined;
  let wsProtocol: string | undefined = undefined;

  if (appUrl) {
    try {
      const parsed = new URL(appUrl);
      if (parsed.protocol === 'https:') {
        wsProtocol = 'wss';
        wsClientPort = parsed.port ? parseInt(parsed.port, 10) : 443;
      } else {
        wsProtocol = 'ws';
        wsClientPort = parsed.port ? parseInt(parsed.port, 10) : 80;
      }
    } catch {}
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(projectRootDir, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      ws: {
        ...(wsClientPort ? { clientPort: wsClientPort } : {}),
        ...(wsProtocol ? { protocol: wsProtocol } : {}),
      },
      // Disable file watching when DISABLE_HMR is true; ignore database and backups to prevent reload loops
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**', '**/backups/**', '**/*.json.bak', '**/.git/**'],
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('jspdf') || id.includes('jspdf-autotable') || id.includes('xlsx')) {
                return 'vendor-export';
              }
              if (id.includes('recharts') || id.includes('d3')) {
                return 'vendor-charts';
              }
              return 'vendor-utils';
            }
          },
        },
      },
    },
  };
});

