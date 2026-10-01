import { rm } from 'node:fs/promises';
import path from 'node:path';

import { APP_NAME, APP_VERSION } from '../app.config';
import { TARGETS } from './build-targets';
import { buildNativeHelpers } from './native-helper';

const root = path.resolve(import.meta.dir, '..');
const webDist = path.join(root, 'web/dist');
const migrations = path.join(root, 'server/drizzle');

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

// The migrations are an embedded asset too: the server applies them on startup, and a
// compiled binary has no `server/drizzle` beside it. A schema never generated from simply
// has none, which is why a miss is a warning, not a failure.
const hasMigrations = await Bun.file(
  path.join(migrations, 'meta/_journal.json'),
).exists();

if (!hasMigrations) {
  console.warn(
    `\n${migrations} has no migrations — run \`bun run --filter server db:generate\` first.`,
  );
  console.warn('These executables will start without applying any migration.');
}

console.log(`2/2 Compile ${TARGETS.length} executables — ${APP_NAME} ${APP_VERSION}`);
// `--asset` 只保留 basename，所以前端落在 `dist/…` 而不是 `web/dist/…`；`--target` 会把整个
// 运行时嵌进去，产物不依赖 node_modules 与 bun。命名与内嵌规则见 `packaging.md`。
await rm(path.join(root, 'dist-bin'), { recursive: true, force: true });

const skipped: string[] = [];

for (const info of TARGETS) {
  // Identifiable without being opened: the name and version are in the file name, from
  // app.config.ts (how to change them — `.claude/skills/app-version/SKILL.md`).
  const outfile = `dist-bin/${APP_NAME}-${APP_VERSION}-${info.platform}${info.exe}`;

  console.log(`\n--- ${info.target} -> ${outfile}`);

  // This platform's C / C++ helpers (scripts/native-helper.ts). One that cannot be built
  // takes the whole target with it — a broken native half at runtime is worse than a skip.
  const native = buildNativeHelpers(info);

  if (native === null) {
    console.log(`(skipped) ${info.target} — a native helper could not be built`);
    skipped.push(info.target);

    continue;
  }

  await run([
    'bun',
    'build',
    'server/src/main.ts',
    '--compile',
    '--minify',
    '--asset',
    'web/dist',
    // A path rather than a bare name: bun embeds a directory under its basename, so this
    // lands as `drizzle/…`; the server derives the folder from `Bun.embeddedFiles`.
    ...(hasMigrations ? ['--asset', 'server/drizzle'] : []),
    // Unlike the two above, these are looked up by their bare file name at runtime
    // (server/src/common/native/native-helper.ts), which is what `--asset` keeps.
    ...native.flatMap((helper) => ['--asset', helper.path]),
    '--target',
    info.target,
    '--outfile',
    outfile,
  ]);
}

console.log(
  `\nBuilt ${TARGETS.length - skipped.length}/${TARGETS.length} executables into ${path.join(root, 'dist-bin')}`,
);

if (skipped.length > 0) {
  console.log(`Skipped: ${skipped.join(', ')}`);
  console.log('A native helper that cannot be built takes its whole target with it.');

  // Losing a platform or two is legitimate (a machine with no zig); producing nothing at
  // all is not — a release with zero artifacts must not look like a success.
  if (skipped.length === TARGETS.length) {
    process.exitCode = 1;
  }
}
