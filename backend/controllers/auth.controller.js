const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_super_secreto';
const JWT_EXPIRES_IN = '8h';

const AuthController = {
    async login(req, res) {
        // Movi o log para DENTRO da função para você ver acontecendo
        console.log("🔥 [AUTH] Tentativa de login iniciada...");

        try {
            // O Front manda 'senha', mas o banco tem 'password'
            const { email, senha } = req.body;

            console.log("📥 Dados recebidos:", { email, senhaPresente: !!senha });

            if (!email || !senha) {
                return res.status(400).json({
                    success: false,
                    message: 'E-mail e senha são obrigatórios.'
                });
            }

            // Busca no banco
            const user = await UserModel.findByEmail(email);

            if (!user) {
                console.log("❌ Usuário não encontrado no banco.");
                return res.status(401).json({
                    success: false,
                    message: 'Usuário ou senha inválidos.'
                });
            }

            // Debug para garantir que o Model trouxe a senha criptografada
            if (!user.password) {
                console.error("⛔ ERRO CRÍTICO: O Model não retornou o campo 'password'. Verifique o SELECT.");
                return res.status(500).json({ success: false, message: "Erro de configuração no servidor." });
            }

            // Compara a senha (Texto limpo vs Hash do banco)
            const senhaValida = await bcrypt.compare(senha, user.password);

            if (!senhaValida) {
                console.log("❌ Senha incorreta.");
                return res.status(401).json({
                    success: false,
                    message: 'Usuário ou senha inválidos.'
                });
            }

            // Gera o Token
            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.name, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            console.log("✅ Login Sucesso! Token gerado para:", user.name);

            return res.json({
                token,
                user: {
                    id: user.id,
                    nome: user.name,   // Mapeando 'name' (banco) para 'nome' (front)
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('🔥 Erro FATAL no login:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno no servidor.'
            });
        }
    }
};

module.exports = AuthController;