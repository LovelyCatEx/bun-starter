import { chmodSync, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Native helpers: where a compiled C / C++ program comes from, and how to run it.
 *
 * The name is a **convention**, and everything else follows from it. `server/native/<name>.c`
 * compiles to `<name>` (`<name>.exe` on Windows), and `scripts/compile.ts` embeds each
 * platform's build with `--asset` — which keeps only the basename, so all five builds land
 * under exactly the same name. That is the whole reason the lookup below can be a hard-coded
 * string instead of a search: see `.claude/rules/backend.md` 「原生产物（C / C++）」.
 *
 * A packaged release has no compiler to build with, so it carries the built helper inside the
 * binary and writes it out on first use — a program cannot be run from inside the binary. In
 * dev there is a compiler, so it builds from source instead and caches beside it.
 *
 * Being embedded and being readable are two different things: `--asset` puts the helper in the
 * executable whether or not anything reads it, while *this* code only survives bundling if a
 * module imports it — the sample in `server/native/` has no consumer, so import this where you
 * actually use it.
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
 *
 * One entry point for both worlds on purpose: callers should not have to know whether they
 * are inside a packaged binary.
 */
export function nativeHelperPath(name: NativeHelperName): Promise<string> {
  const cached = resolved.get(name) ?? build(name);

  resolved.set(name, cached);

  return cached;
}

/**
 * Runs the helper and hands back the subprocess; its stdout is the helper's output.
 *
 * `PipedSubprocess` rather than the bare `Subprocess`, which types all three streams as a
 * union with `undefined`: the caller's reads have to be known to be possible.
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
 * Runs the helper once and hands back all of it — no trimming, no decoding of stdout, and a
 * non-zero exit is a value rather than a throw.
 *
 * This is the layer to reach for when the answer is not one line of text: a helper that
 * prints JSON, a helper whose exit code *is* the answer (1 = no match, 2 = bad input), or one
 * that emits bytes. Deciding for the caller is what `runNativeHelper` is for, and it is built
 * on this.
 *
 * Both pipes are read while waiting for the exit, not after it: a helper that writes more
 * than a pipe buffer holds would otherwise block on its own output and never exit.
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
 * Runs the helper once and hands back its stdout as text, trimmed — the shape most helpers
 * have: take argv, print an answer, exit.
 *
 * The sugar over `execNativeHelper`, and deliberately lossy: `stdout` is decoded as UTF-8 and
 * trimmed, and a non-zero exit throws with whatever the helper said on stderr (falling back to
 * its stdout). When any of that is wrong for your helper, use `execNativeHelper` instead.
 *
 * For anything longer-lived than one call — streaming in, streaming out, resizing a terminal —
 * take `spawnNativeHelper` and drive the subprocess yourself.
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
 * All of a subprocess pipe, as text.
 *
 * `Bun.readableStreamToText` does this but is deprecated in favour of
 * `ReadableStream#text()` — which the runtime has, and the types do not: bun-types only
 * augments `stream/web`'s `ReadableStream` with it, while the one a subprocess hands back is
 * the global. Wrapping the stream in a `Response` is the same read, spelled with types that
 * exist and no deprecated call.
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
    // A rename that lost a race with another instance is fine — the bytes are the same ones,
    // and the file it left is the one just written. A platform without mode bits is fine too;
    // Windows runs by extension.
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

  // Missing either one counts as "needs a build"; a built helper newer than its source is
  // reused, which is what keeps a dev restart from shelling out to a compiler every time.
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
 * How to build a helper on the machine we are running on.
 *
 * The cross-compiling table is `scripts/native-helper.ts`; this one is what dev runs, and it
 * only ever has to name one platform's compiler. `-lutil` is where glibc keeps `openpty` and
 * Windows helpers need shell32 for `CommandLineToArgvW`, so both travel with the helpers people
 * actually write with this; they are no-ops for a program that touches neither.
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
