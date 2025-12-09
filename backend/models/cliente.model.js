const db = require('../config/db');

const ClienteModel = {
    // Listar todos
    async findAll() {
        const [rows] = await db.query('SELECT * FROM clientes ORDER BY nome ASC');
        return rows;
    },

    // Buscar por ID
    async findById(id) {
        const [rows] = await db.query('SELECT * FROM clientes WHERE id = ?', [id]);
        return rows[0];
    },

    // Criar novo
    async create(data) {
        const { 
            nome, indicacao, cpf_cnpj, rg_ie, telefone, 
            cep, endereco, numero, complemento, bairro, cidade, estado, 
            observacao, status 
        } = data;
        
        const [result] = await db.query(
            `INSERT INTO clientes (
                nome, indicacao, cpf_cnpj, rg_ie, telefone, 
                cep, endereco, numero, complemento, bairro, cidade, estado, 
                observacao, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                nome, indicacao, cpf_cnpj, rg_ie, telefone, 
                cep, endereco, numero, complemento, bairro, cidade, estado, 
                observacao, status || 'Ativo'
            ]
        );
        
        return { id: result.insertId, ...data };
    },

    // Atualizar
    async update(id, data) {
        const { 
            nome, indicacao, cpf_cnpj, rg_ie, telefone, 
            cep, endereco, numero, complemento, bairro, cidade, estado, 
            observacao, status 
        } = data;

        await db.query(
            `UPDATE clientes SET 
                nome=?, indicacao=?, cpf_cnpj=?, rg_ie=?, telefone=?, 
                cep=?, endereco=?, numero=?, complemento=?, bairro=?, cidade=?, estado=?, 
                observacao=?, status=?
             WHERE id = ?`,
            [
                nome, indicacao, cpf_cnpj, rg_ie, telefone, 
                cep, endereco, numero, complemento, bairro, cidade, estado, 
                observacao, status, id
            ]
        );
        
        return { id, ...data };
    },

    // Deletar
    async delete(id) {
        await db.query('DELETE FROM clientes WHERE id = ?', [id]);
    }
};

module.exports = ClienteModel;