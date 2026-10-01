import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';

import { APP_NAME, APP_VERSION } from '../../app.config';
import { config } from './common/config';
import { responseInterceptor } from './common/interceptor/response-interceptor';
import { LogService, SYSTEM_TAG } from './common/service/log-service';
import { embeddedStatic } from './common/static/embedded-static';
// Side-effect import on purpose: migrations are embedded in the executable
// (`--asset server/drizzle`, see scripts/compile.ts), so a deployed binary has to
// migrate the database it is pointed at before it serves anything.
import './db/database';
import { authInterceptor } from './modules/auth/interceptor/auth.interceptor';
import { createAuthPlugin } from './modules/auth/auth.plugin';
import {runNativeHelper} from "./common/native/native-helper.ts";

// Before the first line, so nothing is lost to a missing LOG_DIR.
LogService.init();

runNativeHelper("hello-helper").then((res) => {
    console.log(res)
})

const app = new Elysia()
  .use(cors({ origin: config.corsOrigin, credentials: true }))
  .use(responseInterceptor)
  .use(authInterceptor)
  .get('/health', () => ({ status: 'ok', name: APP_NAME, version: APP_VERSION }))
  // Injection point for your own account storage — see .claude/rules/auth.md.
  .use(createAuthPlugin())
  .use(embeddedStatic)
  .listen(config.port);

LogService.info(
  SYSTEM_TAG,
  `${APP_NAME} ${APP_VERSION} — server is running at http://${app.server?.hostname}:${app.server?.port}`,
);
