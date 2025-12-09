require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ==========================================
// 1. IMPORTAÇÃO DAS ROTAS (MÓDULOS)
// ==========================================
const authRoutes = require('./routes/auth.routes');
const clientesRoutes = require('./routes/clientes.routes');

// --- NOVOS MÓDULOS (Descomente conforme for criando os arquivos na pasta routes) ---
// const publicoRoutes = require('./routes/publico.routes');       // Login, Registro, Senha
// const funcionariosRoutes = require('./routes/funcionarios.routes');
// const fornecedoresRoutes = require('./routes/fornecedores.routes');
// const produtosRoutes = require('./routes/produtos.routes');     // Faltou criar esse! (Veja abaixo)
// const comprasRoutes = require('./routes/compras.routes');
// const vendasFornecedorRoutes = require('./routes/vendaFornecedor.routes'); // Plano de Corte
// const financeiroRoutes = require('./routes/financeiro.routes'); // Despesas
// const agendaRoutes = require('./routes/agenda.routes');         // Produção
// const pontoRoutes = require('./routes/ponto.routes');           // Relógio de Ponto

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 2. CONFIGURAÇÕES GERAIS
// ==========================================
app.use(cors());
app.use(express.json());

// Log de requisições (Para você ver no terminal o que está acontecendo)
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] 📥 ${req.method} ${req.originalUrl}`);
    next();
});

// ==========================================
// 3. REGISTRO DAS ROTAS
// ==========================================

// Rota de Teste
app.get('/api', (req, res) => {
    res.json({ message: 'API ACASA ERP (V4) Rodando 🚀' });
});

// --- Rota Pública (Auth) ---
app.use('/api/auth', authRoutes);

// --- Rotas Públicas de Cadastro/Senha (Descomente quando criar publico.routes.js) ---
// app.use('/api/publico', publicoRoutes);

// --- Rotas Protegidas (Middleware de Auth recomendado aqui) ---
// (Dica: No futuro, coloque authMiddleware em todas essas abaixo)

app.use('/api/clientes', clientesRoutes);

// --- Módulos do Sistema (Descomente um por um quando criar os arquivos) ---
// app.use('/api/funcionarios', funcionariosRoutes);
// app.use('/api/fornecedores', fornecedoresRoutes);
// app.use('/api/produtos', produtosRoutes);
// app.use('/api/compras', comprasRoutes);
// app.use('/api/vendas-fornecedor', vendasFornecedorRoutes);
// app.use('/api/financeiro', financeiroRoutes);
// app.use('/api/agenda', agendaRoutes);
// app.use('/api/ponto', pontoRoutes);


// ==========================================
// 4. INICIALIZAÇÃO
// ==========================================
app.listen(PORT, () => {
    console.log(`🔥 Servidor online em: http://localhost:${PORT}`);
    console.log(`📂 Modo: Desenvolvimento`);
});
