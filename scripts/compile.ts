import { rm } from 'node:fs/promises';
import path from 'node:path';

import { APP_NAME, APP_VERSION } from '../app.config';

const root = path.resolve(import.meta.dir, '..');
const webDist = path.join(root, 'web/dist');

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
    '--target',
    target,
    '--outfile',
    outfile,
  ]);
}

console.log(`\nBuilt ${targets.length} executables into ${path.join(root, 'dist-bin')}`);