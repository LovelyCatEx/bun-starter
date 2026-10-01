/**
 * The cross-compile targets, and what building a native helper needs to know about each —
 * shared by `compile.ts` (which executable) and `native-helper.ts` (how to compile C for it).
 */
export type BuildTarget =
  | 'bun-darwin-arm64'
  | 'bun-darwin-x64'
  | 'bun-linux-x64'
  | 'bun-linux-arm64'
  | 'bun-windows-x64';

export interface BuildTargetInfo {
  /** Spelled the way `bun build --target` spells it. */
  target: BuildTarget;
  /** The same target's `bun-` suffix, used in artifact file names. */
  platform: string;
  /** What a compiled native helper is called here — Windows is the odd one. */
  exe: string;
  /**
   * `-arch` for the machine's own clang. Only the macOS targets have it: zig carries
   * its own libc but not Apple's SDK headers, which a helper including `<util.h>` needs.
   */
  arch?: string;
  /**
   * `-target` for zig — the only way to produce Linux and Windows output from macOS,
   * since it ships its own libc and mingw headers.
   */
  triple?: string;
}

export const TARGETS: BuildTargetInfo[] = [
  { target: 'bun-darwin-arm64', platform: 'darwin-arm64', exe: '', arch: 'arm64' },
  { target: 'bun-darwin-x64', platform: 'darwin-x64', exe: '', arch: 'x86_64' },
  { target: 'bun-linux-x64', platform: 'linux-x64', exe: '', triple: 'x86_64-linux-gnu' },
  { target: 'bun-linux-arm64', platform: 'linux-arm64', exe: '', triple: 'aarch64-linux-gnu' },
  { target: 'bun-windows-x64', platform: 'windows-x64', exe: '.exe', triple: 'x86_64-windows-gnu' },
];
