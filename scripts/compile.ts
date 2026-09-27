import { rm } from 'node:fs/promises';
import path from 'node:path';

import { APP_NAME, APP_VERSION } from '../app.config';

const root = path.resolve(import.meta.dir, '..');
const webDist = path.join(root, 'web/dist');
const migrations = path.join(root, 'server/drizzle');

/** Spelled the way `bun build --target` spells them. */
const targets = [
  'bun-darwin-arm64',
  'bun-darwin-x64',
  'bun-linux-x64',
  'bun-linux-arm64',
  'bun-windows-x64',
] as const;

async function run(command: string[]) {
  console.log(`\n$ ${command.join(' ')}`);

  const exitCode = await Bun.spawn(command, {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
  }).exited;

  if (exitCode !== 0) {
    console.error(`\nCommand failed with exit code ${exitCode}`);
    process.exit(exitCode);
  }
}

console.log('1/2 Build frontend');
await run(['bun', 'run', '--filter', 'web', 'build']);

if (!(await Bun.file(path.join(webDist, 'index.html')).exists())) {
  console.error(`\n${webDist}/index.html is missing — there would be nothing to embed.`);
  process.exit(1);
}

// The migrations are an embedded asset too: the server applies them on startup
// (server/src/db/database.ts), and a compiled binary has no `server/drizzle` beside
// it to read them from. `db:generate` writes the folder — a schema that has never
// been generated from simply has none, which is why a miss is a warning and not a
// failure (the binary boots without applying anything, and says so at startup).
const hasMigrations = await Bun.file(
  path.join(migrations, 'meta/_journal.json'),
).exists();

if (!hasMigrations) {
  console.warn(
    `\n${migrations} has no migrations — run \`bun run --filter server db:generate\` first.`,
  );
  console.warn('These executables will start without applying any migration.');
}

console.log(`2/2 Compile ${targets.length} executables — ${APP_NAME} ${APP_VERSION}`);
// `--asset web/dist` embeds the built frontend under its own path, and the server
// reads it back out of `Bun.embeddedFiles` at startup to serve it on its own port
// (see server/src/common/static/embedded-static.ts). Each artifact is then this one
// file, and it needs neither node_modules nor bun to run: `--target` cross-compiles
// without any external toolchain, since the target's Bun runtime is embedded whole.
await rm(path.join(root, 'dist-bin'), { recursive: true, force: true });

for (const target of targets) {
  const platform = target.slice('bun-'.length);
  // Whatever this produces has to be identifiable without being opened or run, so
  // the name and version are in the file name — see app.config.ts for where they
  // come from and `.claude/skills/app-version/SKILL.md` for how to change them.
  const outfile = `dist-bin/${APP_NAME}-${APP_VERSION}-${platform}${target.endsWith('windows-x64') ? '.exe' : ''}`;

  console.log(`\n--- ${target} -> ${outfile}`);

  await run([
    'bun',
    'build',
    'server/src/main.ts',
    '--compile',
    '--minify',
    '--asset',
    'web/dist',
    // A path rather than a bare name on purpose: bun embeds a directory under its
    // basename, so this lands in the executable as `drizzle/…`, and the server
    // derives which folder to read from `Bun.embeddedFiles` instead of assuming it.
    ...(hasMigrations ? ['--asset', 'server/drizzle'] : []),
    '--target',
    target,
    '--outfile',
    outfile,
  ]);
}

console.log(`\nBuilt ${targets.length} executables into ${path.join(root, 'dist-bin')}`);