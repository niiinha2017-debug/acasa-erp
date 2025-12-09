const ClienteModel = require('../models/cliente.model');

const ClienteController = {
    // Listar (GET)
    async list(req, res) {
        try {
            const clientes = await ClienteModel.findAll();
            return res.json(clientes);
        } catch (error) {
            console.error('Erro ao listar clientes:', error);
            return res.status(500).json({ success: false, message: 'Erro ao buscar clientes.' });
        }
    },

    // Cadastrar (POST)
    async create(req, res) {
        try {
            const { nome, cpf_cnpj } = req.body;

            // Validação simples
            if (!nome) {
                return res.status(400).json({ success: false, message: 'O Nome é obrigatório.' });
            }

            const novoCliente = await ClienteModel.create(req.body);

            return res.status(201).json({
                success: true,
                message: 'Cliente cadastrado com sucesso!',
                data: novoCliente
            });

        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: 'CPF/CNPJ já cadastrado.' });
            }
            return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
        }
    },

    // Editar (PUT)
    async update(req, res) {
        try {
            const { id } = req.params;
            await ClienteModel.update(id, req.body);
            return res.json({ success: true, message: 'Cliente atualizado!' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao atualizar.' });
        }
    },

    // Excluir (DELETE)
    async delete(req, res) {
        try {
            await ClienteModel.delete(req.params.id);
            return res.json({ success: true, message: 'Cliente removido.' });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erro ao excluir.' });
        }
    }
};

module.exports = ClienteController;