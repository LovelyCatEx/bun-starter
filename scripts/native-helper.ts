import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import path from 'node:path';

import type { BuildTargetInfo } from './build-targets';

const root = path.resolve(import.meta.dir, '..');
/** The C / C++ sources, and where their builds are staged. */
const SOURCE_DIR = path.join(root, 'server/native');
const BUILD_DIR = path.join(SOURCE_DIR, 'build');
/** A zig unpacked beside the build output, for a machine without one on PATH. */
const LOCAL_ZIG = path.join(BUILD_DIR, 'zig/zig');

const SOURCE_EXTENSIONS = /\.(c|cpp|cc|cxx)$/i;

export interface NativeHelper {
  /**
   * The name it is embedded under — and the name the runtime looks it up by
   * (server/src/common/native/native-helper.ts): the source file's basename plus `.exe` on
   * Windows, because `--asset` keeps only the basename, so all five land under one name.
   */
  name: string;
  /** This target's build of it, ready to be passed to `--asset`. */
  path: string;
}

/**
 * Every helper this repo has: any `server/native/*.c` or `*.cpp`. The file name *is* the
 * helper's name, so dropping one in is the whole registration step — no list in a config.
 */
function sources(): string[] {
  return readdirSync(SOURCE_DIR).filter((file) => SOURCE_EXTENSIONS.test(file));
}

/**
 * The compiler for this target, or null when nothing here can produce it. macOS is not zig's:
 * a helper that wants `openpty` includes `<util.h>` from the platform SDK, and a downloaded
 * toolchain carries its own libc but not Apple's SDK headers, so the machine's clang builds it.
 */
function compileCommand(
  info: BuildTargetInfo,
  source: string,
  out: string,
): string[] | null {
  const cxx = !source.endsWith('.c');
  const args = ['-O2', '-o', out, source];

  if (info.arch !== undefined) {
    const cc = cxx ? Bun.which('c++') : (Bun.which('cc') ?? Bun.which('clang'));

    return cc === null ? null : [cc, '-arch', info.arch, ...args];
  }

  const zig = resolveZig();

  if (zig === null || info.triple === undefined) {
    return null;
  }

  const libs = info.triple.includes('linux') ? ['-lutil'] : ['-lshell32'];

  return [zig, cxx ? 'c++' : 'cc', '-target', info.triple, ...args, ...libs];
}

function resolveZig(): string | null {
  if (process.env.ZIG) {
    return process.env.ZIG;
  }

  return Bun.which('zig') ?? (existsSync(LOCAL_ZIG) ? LOCAL_ZIG : null);
}

function size(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Build every helper for one target, staged where `--asset` can take each of them. Returns
 * null — dropping the whole target — when one cannot be built, since a release that quietly
 * lost a feature is worse than one that names the missing platform. An empty list is fine.
 */
export function buildNativeHelpers(info: BuildTargetInfo): NativeHelper[] | null {
  const staged: NativeHelper[] = [];

  for (const file of sources()) {
    const name = `${path.basename(file).replace(SOURCE_EXTENSIONS, '')}${info.exe}`;
    const out = path.join(BUILD_DIR, 'asset', info.target, name);
    const command = compileCommand(info, path.join(SOURCE_DIR, file), out);

    if (command === null) {
      console.log(
        `  native ${name}: no compiler for ${info.target} (macOS needs clang, the rest need zig)`,
      );

      return null;
    }

    mkdirSync(path.dirname(out), { recursive: true });

    const result = Bun.spawnSync(command, { stdout: 'pipe', stderr: 'pipe' });

    if (result.exitCode !== 0) {
      const stderr = result.stderr.toString().trim().split('\n')[0] ?? '';

      console.log(`  native ${name}: build failed — ${stderr || `exit ${result.exitCode}`}`);

      return null;
    }

    console.log(
      `  native ${name}: ${command[0]} -> ${path.relative(root, out)} (${size(Bun.file(out).size)})`,
    );

    staged.push({ name, path: out });
  }

  return staged;
}
