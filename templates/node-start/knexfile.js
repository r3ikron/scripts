/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const path = require("path");

const config = {
  migrations: { directory: path.join(__dirname, "/data/migrations") },
  seeds: { directory: path.join(__dirname, "/data/seeds") },
};

module.exports = {
  development: {
    client: "sqlite3",
    connection: { filename: path.join(__dirname, "/data/db/development.db") },
    useNullAsDefault: true,
    ...config,
  },

  test: {
    client: "sqlite3",
    connection: { filename: ":memory:" },
    useNullAsDefault: true,
    ...config,
  },

  production: {
    client: "pg",
    connection: process.env['DATABASE_URL'],
    ...config,
  },
};
