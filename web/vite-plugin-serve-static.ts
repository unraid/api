import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

export function serveStaticHtml(): Plugin {
  return {
    name: 'serve-static-html',
    configureServer(server) {
      // Serve test pages from public/test-pages
      server.middlewares.use((req, res, next) => {
        // Check if request is for test-pages
        if (req.url?.startsWith('/test-pages')) {
          const __dirname = path.dirname(fileURLToPath(import.meta.url));
          const filePath = path.join(__dirname, 'public', req.url);

          // If it's a directory, serve index.html
          let targetPath = filePath;
          if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            targetPath = path.join(filePath, 'index.html');
          }

          // If no extension, try adding .html
          if (!path.extname(targetPath) && !fs.existsSync(targetPath)) {
            targetPath = targetPath + '.html';
          }

          // Serve the file if it exists
          if (fs.existsSync(targetPath)) {
            const content = fs.readFileSync(targetPath, 'utf-8');
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
            return;
          }
        }

        next();
      });
    },
  };
}
