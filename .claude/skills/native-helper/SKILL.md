---
name: native-helper
description: 处理"服务端要跑一段原生程序（C / C++）"的 Skill。当需要为一个功能引入 .c / .cpp（PTY、系统调用、现成 C/C++ 库、性能热点），把原生件交叉编译进 5 个平台的产物、在 dev 与产物里都能跑，或者排查"helper 没进去""编不出来""名字对不上""产物里没有它""每平台少了 target"时使用。也覆盖"该用进程还是 bun:ffi 函数调用"的选择。
---

# 原生产物（C / C++ helper）

有些事脚本干不了：真 PTY（`fork` + `setsid` + `TIOCSCTTY`，多线程 runtime 不能安全 fork）、ConPTY、系统调用、现成的 C/C++ 库、性能热点。这套东西负责把这种程序**编出来、内嵌进对应平台的产物、运行时抽出来跑**。

管线在 `scripts/{build-targets,native-helper,compile}.ts`，运行时在 `server/src/common/native/native-helper.ts`，源码放 `server/native/`。

## 先定形状：进程，还是 `bun:ffi` 函数调用

**默认是进程**：C 那侧写 `int main(int argc, char **argv)`，TS 这侧 spawn 它、读 stdout。人家的 PTY helper 就是这个形状（一个程序，不是一个库）。

要"执行函数"是另一条路：`bun:ffi` 的 `dlopen` 打开共享库直接调导出函数。本机实测（带校验和防 JIT 消掉循环）：

| | 代码 | 每次耗时 |
| --- | --- | --- |
| 函数调用（FFI + 共享库） | `symbols.add(2, 3)` → `5` | **9 ns** |
| 进程调用（这套） | spawn → 读 stdout → `"5"` | **1.73 ms** |

差 ~19 万倍，但这不是"FFI 更好"，是两种东西：

| | 进程（这套） | FFI（`bun:ffi`） |
| --- | --- | --- |
| 接口 | argv 进、stdout 出，**文本**，自己解析 | 类型化参数 / 返回值（`FFIType.i32`），不用解析 |
| 崩了 | 只死 helper | **整个 server 一起死**；内存越界是进程级 UB |
| 阻塞 | `Bun.spawn` 异步，天然并发 | **同步调用，卡事件循环** —— 慢函数 = 整个服务停摆 |
| 长连接 / 流式 | 可以（stdin/stdout 持续通信） | 不适合 |
| 产物 | 可执行文件 | 必须共享库（`extern "C"` + `.dylib` / `.so` / `.dll`） |
| 调试 | `./helper 2 3` 直接手跑 | 得挂宿主进程 + 调试器 |

**怎么选**：偶尔跑一次 / 长连接 / 可能崩的活（PTY、解码、解析不可信文件）→ 进程；每次请求里调很多次、进出是结构化数据 → FFI。**这个仓库现在只实现了进程这条**（FFI 那半没做，要做的话内嵌机制能复用：`-shared -fPIC` / `-dynamiclib` + `dlopen` 抽出来的路径）。

## 名字是唯一的约定

`server/native/<name>.c`（或 `.cpp`）编出来就叫 `<name>`，Windows 上是 `<name>.exe`。

**为什么能写死**：`--asset` 只保留 basename（实测 `--asset server/native/hello-helper.c` 内嵌名就是 `hello-helper.c`），所以 5 个平台产物里那份 helper **同名**，运行时可以按名字直接找：

```ts
Bun.embeddedFiles.find((f) => f.name === 'hello-helper')
```

别改成"从目录反推前缀"（前端 `web/dist` 和迁移 `server/drizzle` 是那样做的，因为它们要看目录）。名字对不上会直接报 `native helper "x" is not in this build — …`，不会静默退化。

## 加一个 helper（`add` 为例）

**1. 写源码**，丢进 `server/native/`，**文件名就是名字**。⚠️ **扩展名决定用哪个编译器**：`.c` 走 C（`cc` / `zig cc`），`.cpp` / `.cc` / `.cxx` 走 C++（`c++` / `zig c++`）—— 叫 `add.c` 却用 `std::cout` 会以"这是 C"的口吻报错，改名 `add.cpp` 才对。

```c
/* server/native/add.c —— 参数进 argv、结果出 stdout，就这一条接口 */
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char **argv) {
  if (argc < 3) {
    fprintf(stderr, "usage: add <a> <b>\n");
    return 1;
  }

  printf("%d\n", atoi(argv[1]) + atoi(argv[2]));

  return 0;
}
```

**2. 登记**（`server/src/common/native/native-helper.ts`）：键 = 文件名，值 = 仓库根相对路径。不加这行，调用处连名字都传不进去（类型上就挡住了）。

```ts
export const NATIVE_HELPERS = {
  'hello-helper': 'server/native/hello-helper.c',
  add: 'server/native/add.c',   // ← 加这一行
} as const
```

**3. 在自己的模块里调**（三层，按"答案有多复杂"选）：

```ts
import { runNativeHelper, execNativeHelper, spawnNativeHelper } from '../../../common/native/native-helper'

// ① 糖：跑一次拿 stdout 文本（UTF-8 解码 + trim；退出码非 0 抛，stderr 优先带进错误信息）
const sum = Number(await runNativeHelper('add', ['2', '3']))

// ② 不带观点：完整结果，不 trim、不解码 stdout、失败也不抛
const { stdout, stderr, exitCode } = await execNativeHelper('add', ['2', '3'])

// ③ 拿到进程：怎么通信是你的事（写 stdin、持续读输出、resize）
const child = await spawnNativeHelper('add', ['2', '3'])
```

| 用哪个 | 丢什么 | 什么时候用 |
| --- | --- | --- |
| `runNativeHelper` | **退出码、stderr、stdout 首尾空白**（`trim()` 过） | 最常见的"参数进、一行出" |
| `execNativeHelper` | 什么都不丢（`stdout` 是**原始字节**、`stderr` 文本、`exitCode`） | 要 JSON、要二进制、要"退出码本身就是答案"（1 = 没匹配、2 = 参数错） |
| `spawnNativeHelper` | —— | 长连接 / 流式 / 自己驱动 |

三层都是**边读两个管道边等退出**（`Promise.all([…, child.exited])`）：先 `await exited` 再读的话，输出超过管道缓冲区时 helper 会卡在自己的输出上永远不退出。

## 构建与内嵌

`scripts/native-helper.ts`，每个 target 编一份，产物按 target 分目录 staging（`server/native/build/asset/<target>/`，否则 5 份同名互相覆盖）：

| target | 编译器 | 为什么 |
| --- | --- | --- |
| `bun-darwin-{arm64,x64}` | **本机 clang**（`-arch`） | POSIX helper 要 `<util.h>` 的 `openpty`，那是 Apple SDK 的头 —— zig 自带 libc 但不带 SDK |
| `bun-linux-{x64,arm64}` | **zig**（`zig cc -target x86_64-linux-gnu` / `aarch64-linux-gnu`）+ `-lutil` | zig 自带 libc；`openpty` 在 glibc 的 libutil 里 |
| `bun-windows-x64` | **zig**（`zig cc -target x86_64-windows-gnu`）+ `-lshell32` | 自带 mingw 头；`CommandLineToArgvW` 在 shell32 |

- zig 的查找顺序：`$ZIG` → PATH → `server/native/build/zig/zig`（放在构建输出旁边，给没装全局 zig 的机器）
- **任何一个 helper 编不出来 → 整个 target 跳过**（`(skipped) …` / 最后的 `Skipped: …`），不静默发一个"原生能力一跑就报错"的产物。全 5 个都跳过时脚本 `exit 1`（一个产物都没有不该看起来像成功）
- 仓库里没有任何 `.c` / `.cpp` 时这一步什么都不做，**默认链路依旧零工具链**（前端 + 迁移不需要 gcc / zig）
- **C++ 体积税**：zig 那三个目标会把 libc++ **静态**链进去 —— Linux 产物 4~5 MB、Windows 831 KB（纯 C 只有几 KB；macOS 走系统 libc++ 11 KB）。每个平台的产物各带一份，用 C 就不用交
- Windows 上 zig 的 COFF 链接器会无条件在 exe 旁边留一个 `.pdb`（没有开关能关、也没人读）：它在 gitignore 掉的 build 目录里，**别把它 `--asset` 进去**

## 运行时：dev 编，产物抽

`server/src/common/native/native-helper.ts` 一个入口两种来源，调用方不需要知道自己在哪：

- **dev**（有编译器）：从源码编，产物落在 `server/native/build/<name>`，**按 mtime 缓存**（源码没动就不再调编译器），所以 `bun run dev` 不用先打包
- **产物**（没编译器）：把内嵌那份**抽到磁盘再跑**（程序不能从二进制里直接执行）
  - `tmpdir()/bun-starter-native/<内容 sha256 前 16 位>/<name>`，`mkdir 0700`，先写 `<name>.<pid>` 再 `rename`，`chmod 755`
  - 哈希进路径 → 升级后不会跑到上一版留下的 helper；先写临时名再 rename → 两个实例同时启动时读到的要么是完整文件要么什么都没有；"另一个实例已经写好了"按正常处理
- 路径按名字解析一次就缓存（`Map<name, Promise<string>>`），并发调用只编 / 抽一次

## 排查

| 症状 | 原因 |
| --- | --- |
| `native helper "x" is not in this build` | 编译时没编出来（看 compile 的 `native` / `Skipped` 输出），或文件名与 `NATIVE_HELPERS` 的键不一致 |
| 产物里 helper 在、但抽取逻辑没有 | **没被任何模块 import** → 读取端被 tree-shake 了。`--asset` 是显式的（资源一定在），读它的代码不是 |
| `no C compiler found to build …` | dev 没编译器：装 clang（或 `bun run compile` 用内嵌那份）。Linux 要 `cc`/`clang`/`gcc`，Windows 要 `cl` 或 MinGW |
| 某个平台 `(skipped)` | 这个 target 的 helper 编不出来（对不上就修代码 / 装 zig），日志上一行有编译器原话 |
| 调用永远不返回 | 读了 stdout 才 `await exited`，或输出超过管道缓冲区：用这三层 API（它们已经并发读两个管道） |
| 输出乱码 / 截断 | 二进制输出不能用 `runNativeHelper`（它按 UTF-8 解码并 trim）→ 用 `execNativeHelper` 拿 `stdout` 原始字节 |

## 验证套路

1. **dev 最快**：`bun -e` 起不来就直接写个临时 `.ts` import 进来 `runNativeHelper('add', ['2','3'])`，第一次会自动编
2. **产物**：`bun run compile`，然后跑 `dist-bin/<name>-<version>-<平台>`。要看某个 helper 在不在产物里，`grep -c '<C 里的字符串>' dist-bin/…`
3. **只想验本机一个 target**：直接调 `buildNativeHelpers(目标)`（`scripts/native-helper.ts` 里导出），比打 5 个平台快一个数量级
4. 交叉编译出来的产物顺手 `file` 一下，确认架构真的对（Mach-O / ELF / PE32+），别只看"编译成功"
