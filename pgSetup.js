var query = require("pg-query");

var conString = "pg://user:pass@localhost:5432/hotel";
query.connectionParameters = conString;

module.exports = query;