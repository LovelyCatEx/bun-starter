import { Elysia } from 'elysia';

import { NotFoundException } from '../exception/http-exceptions';

const SHELL = 'index.html';

const CONTENT_TYPES: Record<string, string> = {
  css: 'text/css; charset=utf-8',
  html: 'text/html; charset=utf-8',
  ico: 'image/x-icon',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  js: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  map: 'application/json; charset=utf-8',
  png: 'image/png',
  svg: 'image/svg+xml',
  ttf: 'font/ttf',
  txt: 'text/plain; charset=utf-8',
  webp: 'image/webp',
  woff: 'font/woff',
  woff2: 'font/woff2',
};

/** Embedded blobs carry no `type`, so the MIME type comes from the extension. */
function contentType(path: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();

  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

function serve(file: Blob, path: string): Response {
  return new Response(file, {
    headers: { 'content-type': contentType(path) },
  });
}

type EmbeddedFile = Blob & { name: string };

const embedded = Array.from(Bun.embeddedFiles) as unknown as EmbeddedFile[];
const shell = embedded.find((file) => file.name.endsWith(SHELL));

/**
 * `--asset` keeps only a name's **basename** (`web/dist` lands as `dist/...`), so the prefix is
 * derived from the shell entry rather than written down — a changed asset argument breaks silently.
 */
const root = shell === undefined ? '' : shell.name.slice(0, -SHELL.length);
const files = new Map<string, EmbeddedFile>();

for (const file of embedded) {
  if (file !== shell && file.name.startsWith(root)) {
    files.set(`/${file.name.slice(root.length)}`, file);
  }
}

/**
 * Serves the frontend embedded into the executable — what lets the whole app live on one port.
 * `Bun.embeddedFiles` is empty outside a compiled executable, so dev gets the frontend from vite.
 */
function createEmbeddedStatic() {
  if (shell === undefined) {
    return new Elysia({ name: 'embedded-static' });
  }

  return new Elysia({ name: 'embedded-static' })
    .get('/', () => serve(shell, SHELL))
    .get('/*', ({ path }) => {
      const file = files.get(path);

      if (file !== undefined) {
        return serve(file, path);
      }

      // Client-side routes such as /login get the shell and let the router sort them
      // out; a path under /api/ is not one and stays a 404.
      if (path.startsWith('/api/')) {
        throw new NotFoundException();
      }

      return serve(shell, SHELL);
    });
}

export const embeddedStatic = createEmbeddedStatic();
