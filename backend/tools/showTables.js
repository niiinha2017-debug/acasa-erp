const db = require("../config/db");

db.query("SHOW TABLES", (err, results) => {
    if (err) throw err;

    console.log("📌 Tabelas do banco:");
    console.table(results);

    process.exit();
});
