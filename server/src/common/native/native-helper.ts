import { chmodSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Native helpers: `server/native/<name>.c` compiles to `<name>`, and `--asset` keeps only
 * the basename, so all five platforms' builds land under that one name — which is why the
 * lookup below can be hard-coded. See `.claude/rules/packaging.md`「原生产物」.
 */
export const NATIVE_HELPERS = {
  'hello-helper': 'server/native/hello-helper.c',
} as const;

export type NativeHelperName = keyof typeof NATIVE_HELPERS;

const WINDOWS = process.platform === 'win32';
/** The repo root, from this file: server/src/common/native -> … -> root. */
const PROJECT_ROOT = path.resolve(import.meta.dir, '../../../..');
const NATIVE_BUILD_DIR = path.join(PROJECT_ROOT, 'server/native/build');

/** The name inside the build directory — and inside a packaged binary. */
function helperName(name: NativeHelperName): string {
  return WINDOWS ? `${name}.exe` : name;
}

const resolved = new Map<NativeHelperName, Promise<string>>();

/**
 * The path to a runnable helper, built or extracted on first use and cached after.
 * One entry point for both worlds, so callers need not know which one they are in.
 */
export function nativeHelperPath(name: NativeHelperName): Promise<string> {
  const cached = resolved.get(name) ?? build(name);

  resolved.set(name, cached);

  return cached;
}

/**
 * Runs the helper and hands back the subprocess; its stdout is the helper's output.
 * `PipedSubprocess`, not the bare `Subprocess`: only it types the three streams as readable.
 */
export async function spawnNativeHelper(
  name: NativeHelperName,
  args: string[] = [],
): Promise<Bun.PipedSubprocess> {
  const binary = await nativeHelperPath(name);

  return Bun.spawn([binary, ...args], {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'pipe',
  });
}

/** Everything one run produced, before anything decides what it means. */
export interface NativeHelperResult {
  /** Raw bytes: a helper's stdout is data, and not necessarily UTF-8. */
  stdout: Uint8Array;
  /** Decoded: a helper's stderr is diagnostics, meant to be read. */
  stderr: string;
  exitCode: number;
}

/**
 * Runs the helper once and hands back stdout as bytes, stderr as text, and the exit code as
 * a value rather than a throw. Both pipes are read while waiting for the exit: a helper that
 * writes more than a pipe buffer holds would otherwise block on its output and never exit.
 */
export async function execNativeHelper(
  name: NativeHelperName,
  args: string[] = [],
): Promise<NativeHelperResult> {
  const child = await spawnNativeHelper(name, args);
  const [stdout, stderr, exitCode] = await Promise.all([
    readBytes(child.stdout),
    readText(child.stderr),
    child.exited,
  ]);

  return { stdout, stderr, exitCode };
}

/**
 * Runs the helper once and hands back its stdout as trimmed UTF-8 text; a non-zero exit
 * throws with whatever the helper said on stderr. Anything longer-lived than one call takes
 * `spawnNativeHelper` instead.
 */
export async function runNativeHelper(
  name: NativeHelperName,
  args: string[] = [],
): Promise<string> {
  const { stdout, stderr, exitCode } = await execNativeHelper(name, args);
  const text = new TextDecoder().decode(stdout);

  if (exitCode !== 0) {
    throw new Error(
      `${name} exited with ${exitCode}: ${stderr.trim() || text.trim() || 'no output'}`,
    );
  }

  return text.trim();
}

/**
 * All of a subprocess pipe, as text. `Bun.readableStreamToText` is deprecated, and the types
 * give a subprocess's global stream no `text()` — see `.claude/rules/backend.md`「代码风格」.
 */
function readText(stream: ReadableStream<Uint8Array>): Promise<string> {
  return new Response(stream).text();
}

/** The same read, kept as bytes — which is what a helper's stdout is until someone decodes it. */
async function readBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function build(name: NativeHelperName): Promise<string> {
  return Bun.isStandaloneExecutable
    ? extractEmbedded(name)
    : buildFromSource(name);
}

/** The helper a packaged release carries, written out where it can be executed. */
async function extractEmbedded(name: NativeHelperName): Promise<string> {
  const file = helperName(name);
  const embedded = Bun.embeddedFiles.find(
    (blob) => (blob as File).name === file,
  ) as Blob | undefined;

  if (embedded === undefined) {
    throw new Error(
      `native helper "${file}" is not in this build — it was not compiled (see the output of \`bun run compile\`) or its name does not match ${NATIVE_HELPERS[name]}`,
    );
  }

  const bytes = new Uint8Array(await embedded.arrayBuffer());
  // Keyed by a hash of its own bytes rather than by name, so an upgraded release cannot end
  // up executing the previous one's helper.
  const key = new Bun.CryptoHasher('sha256').update(bytes).digest('hex').slice(0, 16);
  const dir = path.join(tmpdir(), 'bun-starter-native', key);
  const out = path.join(dir, file);

  if (existsSync(out)) {
    return out;
  }

  mkdirSync(dir, { recursive: true, mode: 0o700 });

  // Written to a temporary name and renamed, so a second instance starting at the same
  // moment reads a whole file or none.
  const staging = `${out}.${process.pid}`;

  await Bun.write(staging, bytes);

  try {
    chmodSync(staging, 0o755);
    renameSync(staging, out);
  } catch (error) {
    // Losing a rename race is fine: the file left behind is the one just written. A platform
    // without mode bits is fine too — Windows runs by extension.
    rmSync(staging, { force: true });

    if (!existsSync(out)) {
      throw error;
    }
  }

  return out;
}

/** The helper built from the source in this checkout, which is what dev runs. */
async function buildFromSource(name: NativeHelperName): Promise<string> {
  const source = path.join(PROJECT_ROOT, NATIVE_HELPERS[name]);
  const out = path.join(NATIVE_BUILD_DIR, helperName(name));

  const [src, built] = await Promise.all([
    Bun.file(source).stat().catch(() => null),
    Bun.file(out).stat().catch(() => null),
  ]);

  // A built helper newer than its source is reused, so a dev restart doesn't shell out to a
  // compiler every time.
  if (src !== null && built !== null && built.mtimeMs >= src.mtimeMs) {
    return out;
  }

  const command = compileCommand(source, out);

  if (command === null) {
    throw new Error(
      `no C compiler found to build ${NATIVE_HELPERS[name]} — install clang (or run \`bun run compile\`, which embeds a prebuilt helper)`,
    );
  }

  mkdirSync(NATIVE_BUILD_DIR, { recursive: true });

  const child = Bun.spawn(command, { stdout: 'pipe', stderr: 'pipe' });
  const [stdout, stderr, exitCode] = await Promise.all([
    readText(child.stdout),
    readText(child.stderr),
    child.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(
      `${NATIVE_HELPERS[name]} did not compile: ${stderr || stdout || `exit ${exitCode}`}`,
    );
  }

  return out;
}

/**
 * How to build a helper on this machine — dev's half; the cross-compiling table is
 * `scripts/native-helper.ts`. `-lutil` is where glibc keeps `openpty` and shell32 is where
 * `CommandLineToArgvW` lives; both are no-ops for a program that touches neither.
 */
function compileCommand(source: string, out: string): string[] | null {
  const args = ['-O2', '-o', out, source];

  if (!WINDOWS) {
    const cc = Bun.which('cc') ?? Bun.which('clang') ?? Bun.which('gcc');

    if (cc === null) {
      return null;
    }

    return process.platform === 'linux' ? [cc, ...args, '-lutil'] : [cc, ...args];
  }

  // MSVC spells its flags differently and only exists on PATH inside a Developer Command
  // Prompt, so it is tried first and MinGW's gcc / LLVM's clang after it.
  if (Bun.which('cl') !== null) {
    return ['cl', '/nologo', '/O2', `/Fe:${out}`, source, '/link', 'shell32.lib'];
  }

  const mingw = Bun.which('gcc') ?? Bun.which('clang');

  return mingw === null ? null : [mingw, ...args, '-lshell32'];
}
