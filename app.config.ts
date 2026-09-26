/**
 * 应用标识的唯一来源：名称与版本都只在这里改。
 *
 * 前后端与打包产物全从这里取值，改了立刻影响：启动日志、`GET /health`、
 * 首页显示、`dist-bin/<name>-<version>-<platform>` 的产物名。
 *
 * 用法与坑见 `.claude/skills/app-version/SKILL.md`。
 */

/**
 * 同时当显示名与产物文件名用，所以写小写短横线 slug（如 `bun-starter`），
 * 不要写 `Bun Starter` 这种带空格/大写的展示名。
 */
export const APP_NAME = 'bun-starter';

export const APP_VERSION = '0.1.0';
