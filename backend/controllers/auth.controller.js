console.log("🔥 Entrou no AuthController.login");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_super_secreto';
const JWT_EXPIRES_IN = '8h';

const AuthController = {
    async login(req, res) {
        try {
            const { email, senha } = req.body;

            if (!email || !senha) {
                return res.status(400).json({
                    success: false,
                    message: 'E-mail e senha são obrigatórios.'
                });
            }

            const user = await UserModel.findByEmail(email);

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário ou senha inválidos.'
                });
            }

            // Aqui usamos o campo correto do banco: "password"
            const senhaValida = await bcrypt.compare(senha, user.password);

            if (!senhaValida) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário ou senha inválidos.'
                });
            }

            // Ajustado para "name" ao invés de "nome"
            const token = jwt.sign(
                { id: user.id, email: user.email, name: user.name, role: user.role },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return res.json({
                token,
                user: {
                    id: user.id,
                    nome: user.name,     // Mantemos 'nome' no front, mas pegando 'name'
                    email: user.email,
                    role: user.role
                }
            });

        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno no servidor.'
            });
        }
    }
};

module.exports = AuthController;
