import knexConfiguration from './src/lib/knexConfiguration.js';

const migrations = { directory: './knex/migrations' };

const config = {
    development: { ...knexConfiguration.production, migrations: migrations },
    production: { ...knexConfiguration.production, migrations: migrations },
};

export default config;
