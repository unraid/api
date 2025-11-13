import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import nunjucks from 'nunjucks';

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const templatesDir = path.join(__dirname, 'test-pages');
const pagesDir = path.join(templatesDir, 'pages');

const env = nunjucks.configure(templatesDir, {
  autoescape: false,
  noCache: true,
  throwOnUndefined: false,
});

const GITHUB_RAW_BASE =
  'https://raw.githubusercontent.com/unraid/webgui/189edb1a690cfaef3358db9d6bef281a5e1231bc/emhttp/plugins/dynamix/styles';

export function serveStaticHtml(): Plugin {
  return {
    name: 'serve-static-html',
    configureServer(server) {
      server.watcher.add(path.join(templatesDir, '**/*'));

      const handleUnraidAsset = async (res: ServerResponse, assetPath: string) => {
        if (!assetPath || assetPath === '/') {
          res.statusCode = 404;
          res.end('Asset path required');
          return;
        }

        try {
          const assetUrl = `${GITHUB_RAW_BASE}${assetPath}`;
          const response = await fetch(assetUrl);

          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Failed to fetch asset: ${response.statusText}`);
            return;
          }

          const ext = path.extname(assetPath).toLowerCase();

          let contentType = 'text/plain';
          if (ext === '.css') {
            contentType = 'text/css';
          } else if (ext === '.woff') {
            contentType = 'font/woff';
          } else if (ext === '.woff2') {
            contentType = 'font/woff2';
          }

          let content: string | Buffer;
          if (ext === '.woff' || ext === '.woff2') {
            const arrayBuffer = await response.arrayBuffer();
            content = Buffer.from(arrayBuffer);
          } else {
            content = await response.text();
          }

          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.end(content);
        } catch (error) {
          res.statusCode = 500;
          res.end(`Error fetching asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      };

      server.middlewares.use(
        '/test-pages/unraid-assets',
        async (req: IncomingMessage, res: ServerResponse) => {
          const url = new URL(req.url || '/', 'http://localhost');
          const assetPath = url.pathname.replace('/test-pages/unraid-assets', '');
          await handleUnraidAsset(res, assetPath);
        }
      );

      server.middlewares.use('/webGui/styles', async (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const assetPath = url.pathname.replace('/webGui/styles', '');
        await handleUnraidAsset(res, assetPath);
      });

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/test-pages')) {
          next();
          return;
        }

        const requestUrl = new URL(req.url, 'http://localhost');
        let pathname = requestUrl.pathname;

        if (pathname.endsWith('/')) {
          pathname = `${pathname}index.html`;
        }

        const extension = path.extname(pathname);

        if (!extension) {
          pathname = `${pathname}.html`;
        }

        const relativePath = pathname.replace(/^\/test-pages\/?/, '');
        const templatePath = path.join(pagesDir, relativePath.replace(/\.html$/, '.njk'));

        if (extension === '' || extension === '.html') {
          if (fs.existsSync(templatePath)) {
            try {
              const templateName = `pages/${relativePath.replace(/\.html$/, '.njk')}`.replace(
                /\\/g,
                '/'
              );

              const html = env.render(templateName, {
                url: requestUrl.pathname,
                query: Object.fromEntries(requestUrl.searchParams.entries()),
                mode: server.config.mode,
              });

              res.setHeader('Content-Type', 'text/html');
              res.end(html);
              return;
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'text/plain');
              res.end(
                `Failed to render template: ${relativePath}\n\n${
                  error instanceof Error ? error.stack : error
                }`
              );
              return;
            }
          }
        }

        const filePath = path.join(publicDir, pathname);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          const indexPath = path.join(filePath, 'index.html');
          if (fs.existsSync(indexPath)) {
            const content = fs.readFileSync(indexPath, 'utf-8');
            res.setHeader('Content-Type', 'text/html');
            res.end(content);
            return;
          }
        }

        if (fs.existsSync(filePath)) {
          const contentType = path.extname(filePath) === '.js' ? 'application/javascript' : 'text/html';
          res.setHeader('Content-Type', contentType);
          const content = fs.readFileSync(filePath, 'utf-8');
          res.end(content);
          return;
        }

        next();
      });
    },
  };
}
