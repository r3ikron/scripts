const Knex = require("knex");
const config = require("../knexfile.js");

const knex = Knex(config[process.env.NODE_ENV || "development"]);

knex.on("query", ({ sql }) => console.log(`${sql.split(" ")[0].toLowerCase()}${sql.slice(sql.indexOf(" "))}`));

module.exports = knex;
