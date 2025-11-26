import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import nunjucks from 'nunjucks';

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

type ThemeName = 'white' | 'black' | 'gray' | 'azure';

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

const ALLOWED_THEMES: ThemeName[] = ['white', 'black', 'gray', 'azure'];

const normalizeTheme = (theme?: string | null): ThemeName => {
  const normalized = (theme ?? '').toLowerCase() as ThemeName;
  return ALLOWED_THEMES.includes(normalized) ? normalized : 'white';
};

const repoRoot = path.resolve(__dirname, '..');

const toAbsolute = (maybePath?: string | null) => {
  if (!maybePath) return null;
  return path.isAbsolute(maybePath) ? maybePath : path.resolve(repoRoot, maybePath);
};

const parseCookies = (cookieHeader?: string | string[]): Record<string, string> => {
  const header = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader;
  if (!header) {
    return {};
  }

  return header.split(';').reduce<Record<string, string>>((acc, cookie) => {
    const [name, ...rest] = cookie.split('=');
    if (!name) {
      return acc;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      return acc;
    }
    acc[trimmedName] = decodeURIComponent(rest.join('=').trim());
    return acc;
  }, {});
};

const dynamixCandidates = [
  toAbsolute(process.env.DEV_DYNAMIX_CFG),
  toAbsolute(process.env.PATHS_DYNAMIX_CONFIG),
  path.join(repoRoot, 'api/dev/dynamix/dynamix.cfg'),
  path.join(__dirname, 'dev/dynamix/dynamix.cfg'),
].filter(Boolean) as string[];

const findDynamixConfigPath = (): string | null =>
  dynamixCandidates.find((candidate) => fs.existsSync(candidate)) ?? null;

const parseIniSection = (content: string, section: string): Record<string, string> => {
  const lines = content.split(/\r?\n/);
  const sectionName = section.trim().toLowerCase();
  const data: Record<string, string> = {};
  let inSection = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith(';') || line.startsWith('#')) {
      continue;
    }
    if (line.startsWith('[') && line.endsWith(']')) {
      inSection = line.slice(1, -1).trim().toLowerCase() === sectionName;
      continue;
    }
    if (!inSection) {
      continue;
    }
    const [key, ...rest] = line.split('=');
    if (!key) continue;
    data[key.trim()] = rest.join('=').trim();
  }

  return data;
};

const readThemeFromConfig = (): ThemeName | null => {
  const configPath = findDynamixConfigPath();
  if (!configPath) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const displaySection = parseIniSection(content, 'display');
    return normalizeTheme(displaySection.theme);
  } catch {
    return null;
  }
};

const writeThemeToConfig = (theme: ThemeName): { success: boolean; path?: string; error?: string } => {
  const configPath = findDynamixConfigPath() ?? dynamixCandidates[0];
  if (!configPath) {
    return { success: false, error: 'Config path not found' };
  }

  try {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    const content = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf-8') : '[display]\n';
    const lines = content.split(/\r?\n/);
    let inDisplay = false;
    let updated = false;

    const nextLines = lines.map((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        inDisplay = trimmed.slice(1, -1).trim().toLowerCase() === 'display';
        return line;
      }
      if (inDisplay && trimmed.toLowerCase().startsWith('theme=')) {
        updated = true;
        return `theme=${theme}`;
      }
      return line;
    });

    if (!updated) {
      const displayIndex = nextLines.findIndex((line) => line.trim().toLowerCase() === '[display]');
      if (displayIndex >= 0) {
        nextLines.splice(displayIndex + 1, 0, `theme=${theme}`);
      } else {
        nextLines.push('[display]', `theme=${theme}`);
      }
    }

    fs.writeFileSync(configPath, nextLines.join('\n'), 'utf-8');
    return { success: true, path: configPath };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

const readRequestBody = async (req: IncomingMessage): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
};

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

      server.middlewares.use('/dev/theme', async (req: IncomingMessage, res: ServerResponse, next) => {
        if (req.method === 'GET') {
          const theme = readThemeFromConfig();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ theme }));
          return;
        }

        if (req.method === 'POST') {
          try {
            const raw = await readRequestBody(req);
            const parsed = raw ? JSON.parse(raw) : {};
            if (!parsed || typeof parsed.theme !== 'string') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: 'theme is required' }));
              return;
            }

            const normalized = normalizeTheme(parsed.theme);
            const result = writeThemeToConfig(normalized);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ...result, theme: normalized }));
            return;
          } catch (error) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Invalid request body',
              })
            );
            return;
          }
        }

        if (req.method && !['GET', 'POST'].includes(req.method)) {
          res.statusCode = 405;
          res.setHeader('Allow', 'GET, POST');
          res.end('Method Not Allowed');
          return;
        }

        next();
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

              const cookies = parseCookies(req.headers.cookie);
              const cookieTheme = cookies['unraid_dev_theme'];
              const queryTheme = requestUrl.searchParams.get('theme');
              const cfgTheme = readThemeFromConfig();
              const resolvedTheme = normalizeTheme(cfgTheme || queryTheme || cookieTheme);

              const html = env.render(templateName, {
                url: requestUrl.pathname,
                query: Object.fromEntries(requestUrl.searchParams.entries()),
                mode: server.config.mode,
                resolvedTheme,
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
