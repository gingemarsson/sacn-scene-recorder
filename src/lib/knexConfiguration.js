const sqliteConfiguration = {
    client: 'better-sqlite3',
    connection: {
        filename: './scenes.sqlite3',
    },
    useNullAsDefault: true,
};

const config = {
    production: sqliteConfiguration,
};

export default config;
