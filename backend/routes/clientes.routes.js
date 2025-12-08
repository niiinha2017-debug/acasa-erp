const express = require('express');
const router = express.Router();

// temporário — apenas para não quebrar o servidor
router.get('/', (req, res) => {
    res.json({ message: 'Rota de clientes funcionando (placeholder)' });
});

module.exports = router;
