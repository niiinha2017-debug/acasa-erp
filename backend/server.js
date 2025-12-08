require('dotenv').config();        // Carrega o .env

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const clientesRoutes = require('./routes/clientes.routes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();             // Apenas UMA vez
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api', (req, res) => {
    res.json({ message: 'API ACASA ERP funcionando 🚀' });
});

// Rotas públicas
app.use('/api', authRoutes);

// Rotas protegidas
app.use('/api/clientes', authMiddleware, clientesRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
