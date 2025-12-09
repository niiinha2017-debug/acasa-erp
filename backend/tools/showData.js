const db = require("../config/db");

const tabela = process.argv[2];

if (!tabela) {
    console.log("❌ Use: node showData.js nome_da_tabela");
    process.exit();
}

db.query(`SELECT * FROM ${tabela}`, (err, results) => {
    if (err) throw err;

    console.log(`📌 Conteúdo da tabela ${tabela}:`);
    console.table(results);

    process.exit();
});

