---
description: 后端认证规范。改登录 / 令牌 / 鉴权拦截器、接入自己的账号体系、加公开接口（PUBLIC_PATHS）时使用。含 AuthProvider 唯一扩展点、JWT 与两种传输、WS 升级的鉴权口子。
paths:
  - "server/src/modules/auth/**"
  - "server/docs/auth-provider.md"
---

## 认证（`server/src/modules/auth/`）

- 认证全部在 `modules/auth/` 内实现，`common/` 不参与（分层见 `.claude/rules/backend.md` 的「分层与依赖方向」）；**接入自己的账号体系看 `server/docs/auth-provider.md`**
- 目录即「模块内的结构」的参考实现：`auth.plugin.ts`（装配入口）+ `controller/`（含 `dto` / `vo`）+ `service/` + `entity/`（空）+ `provider/`（账号校验实现）+ `interceptor/`（认证拦截器）
- **账号校验的唯一扩展点是 `AuthProvider` 接口**（`provider/auth-provider.ts`）：实现 `authenticate(credentials)`，返回 `AuthUser` 或 `null`，数据库 / LDAP / 第三方接口随便接
- 装配在 `main.ts` 里，工厂模式对齐 `createDatabase()`：

```ts
.use(createAuthPlugin())                     // 不注入 → 内置 admin/admin（仅开发用）
.use(createAuthPlugin(new MyAuthProvider())) // 注入 → 内置实现完全不参与
```

- token 是 jose 的 HS256 无状态 JWT，claims 只有 `sub` / `username` / `name`；secret 与有效期来自 `AUTH_JWT_SECRET` / `AUTH_TOKEN_TTL`
- 传输**同时接受**两种，后端不区分模式：httpOnly cookie（`AUTH_COOKIE_NAME = 'auth_token'`，`sameSite=lax`，生产自动 `secure`）+ `Authorization: Bearer <token>`
- **WS 升级不算第三种传输**：升级请求也走同一个 `authInterceptor`（拿不到 token 直接连不上），只是浏览器不能给 WebSocket 加自定义头，所以升级请求额外接受 `?token=`（`pickToken` 里由 `isUpgrade()` 把口子限定在升级请求上 —— 普通请求把 token 拼进 URL 会漏进访问日志和 Referer）
- 鉴权在 `modules/auth/interceptor/auth.interceptor.ts`：`derive({ as: 'global' })` 只解析身份（不通过就是 `null`），`onBeforeHandle({ as: 'global' })` 负责抛 `UnauthorizedException`；handler 里直接读 `auth`
- 只拦 `/api/*`，静态资源与 HTML 不受影响；放行清单是 `PUBLIC_PATHS`，新增公开接口往这里加
- 接口：`POST /api/auth/login`（返回 token + user，同时写 cookie）、`POST /api/auth/logout`、`GET /api/auth/me`
- `AuthController.routes` 里的 `.use(authInterceptor)` **只是为了拿到 `auth` 的类型**，插件按名字去重，不会重复执行

**cookie 的同站限制**：`SameSite=Lax` 只适用于"前后端同站"（开发时 vite 代理即同源，单端口打包同样同源）。跨站部署需要改成 `SameSite=None; Secure`。

## 前端那一半

token 存哪、401 怎么处理（`unwrap` 遇 401 清 token）、路由守卫，见 `.claude/rules/frontend.md` 的「认证」。
