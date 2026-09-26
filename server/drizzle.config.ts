import { defineConfig } from 'drizzle-kit';

import { config } from './src/common/config';

const schema = './src/db/schema.ts';
const out = './drizzle';

export default (() => {
  switch (config.database.type) {
    case 'postgres':
      return defineConfig({
        dialect: 'postgresql',
        schema,
        out,
        dbCredentials: { url: config.database.url ?? '' },
      });

    case 'mysql':
      return defineConfig({
        dialect: 'mysql',
        schema,
        out,
        dbCredentials: { url: config.database.url ?? '' },
      });

    case 'sqlite':
    default:
      return defineConfig({
        dialect: 'sqlite',
        schema,
        out,
        dbCredentials: { url: config.database.sqlitePath },
      });
  }
})();
