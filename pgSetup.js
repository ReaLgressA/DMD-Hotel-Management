var query = require("pg-query");

var conString = "pg://postgres:3081331304@localhost:5432/hotel";
query.connectionParameters = conString;

module.exports = query;