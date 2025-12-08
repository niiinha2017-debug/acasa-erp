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

            const senhaValida = await bcrypt.compare(senha, user.senha);

            if (!senhaValida) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário ou senha inválidos.'
                });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return res.json({
                token,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email
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
