---
description: 后端数据库规范。加表 / 改 schema、写查询、动迁移（db:generate / db:migrate）、排查"迁移没跑""产物里没迁移"时使用。含方言选择、启动即迁移、迁移目录在 dev 与产物里的两种来源。
paths:
  - "server/src/db/**"
  - "server/drizzle.config.ts"
  - "server/drizzle/**"
---

## 数据库

- `DATABASE_TYPE` 支持 `sqlite` / `postgres` / `mysql`；SQLite 路径按 `process.cwd()` 解析，换目录启动会换掉读到的 `.env` 与落库位置
- schema 写在 `src/db/schema.ts`（当前留空）；**不要自己连库**，统一用 `src/db/database.ts` 的 `db`
- **启动即把迁移跑到最新**：`createDatabase()` 里三种方言各调自己的 `migrate()`。没有迁移（schema 还空着，或编译那个产物时还没 `db:generate`）就跳过并打一行 debug —— 空库启动是脚手架的常态；**但迁移执行失败要把异常抛出去**，schema 不对的进程不该开始收请求
- `main.ts` 里那句 `import './db/database'` 是**副作用 import，别删**：迁移必须赶在第一个请求之前跑完，不能等某个业务模块第一次 import `db`（业务模块只用 `schema.ts` 拿表定义时，`db` 可能一直没人 import）
- 迁移目录 dev 读磁盘上的 `server/drizzle`、产物读 `--asset` 内嵌的那份，内嵌与查找的规矩见 `.claude/rules/packaging.md`
- 脚本 `db:generate` / `db:migrate` / `db:studio`（在 `server/` 下跑）见 `CLAUDE.md` 常用命令；`db:migrate` 是给"手动 / CI 里先迁移"用的，跑起来那份应用自己也会迁移
