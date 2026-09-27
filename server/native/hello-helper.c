/*
 * A sample native helper — a placeholder for whatever C / C++ you actually need,
 * not a feature of this server. It is here to show the whole path working:
 * `bun run compile` cross-compiles one per target, embeds each platform's build in
 * that platform's executable under the name below, and the runtime writes it out to
 * a temporary file and runs it (`server/src/common/native/native-helper.ts`).
 *
 * Replace it with your own source. The rules that matter:
 *
 *   - the file name is the helper's name (`hello-helper.c` -> `hello-helper`, and
 *     `hello-helper.exe` on Windows), and that is the name the runtime hard-codes.
 *     Rename the file, rename it in NATIVE_HELPERS.
 *   - read your inputs from argv and write your output to stdout, line by line: the
 *     helper is spawned as a child process, so that is the whole interface.
 *
 * Build it by hand while iterating: `bun run compile` takes all five platforms.
 *   cc -O2 -o /tmp/hello-helper server/native/hello-helper.c && /tmp/hello-helper
 *
 * Nothing in this repo calls it, and that is on purpose: a helper is only embedded into an
 * executable that has one, and this one is here to be replaced. The module that reads it must
 * import `server/src/common/native/native-helper.ts`, or the reader gets tree-shaken out of
 * the binary even though the helper itself is in there.
 */
#include <stdio.h>

int main(int argc, char **argv) {
  const char *who = argc > 1 ? argv[1] : "world";

#if defined(_WIN32)
  const char *platform = "windows";
#elif defined(__APPLE__)
  const char *platform = "macos";
#else
  const char *platform = "linux";
#endif

  printf("hello-helper: %s says hello, %s\n", platform, who);

  return 0;
}
