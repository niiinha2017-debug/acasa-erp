import { api } from './ApiService.js';
import { DOMHelper } from '../utils/DOMHelper.js'; // Vamos criar esse jajá

export class BaseManager {
    /**
     * @param {string} endpoint - Ex: '/clientes' ou '/produtos'
     */
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    // LISTAR: Busca dados e chama a renderização
    async loadAll() {
        try {
            DOMHelper.showLoading(true);
            const data = await api.get(this.endpoint);
            
            // Se a classe filha tiver um método específico de renderizar, chama ele
            if (this.renderList && data) {
                this.renderList(data);
            }
            return data;
        } catch (error) {
            DOMHelper.notify('Erro ao carregar dados', 'error');
        } finally {
            DOMHelper.showLoading(false);
        }
    }

    // CRIAR
    async create(data) {
        try {
            const result = await api.post(this.endpoint, data);
            DOMHelper.notify('Salvo com sucesso!', 'success');
            return result;
        } catch (error) {
            DOMHelper.notify(error.message, 'error');
            throw error;
        }
    }

    // EDITAR
    async update(id, data) {
        try {
            await api.put(`${this.endpoint}/${id}`, data);
            DOMHelper.notify('Atualizado com sucesso!', 'success');
        } catch (error) {
            DOMHelper.notify(error.message, 'error');
        }
    }

    // DELETAR
    async delete(id) {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;
        
        try {
            await api.delete(`${this.endpoint}/${id}`);
            DOMHelper.notify('Registro excluído.', 'success');
            this.loadAll(); // Recarrega a lista automaticamente
        } catch (error) {
            DOMHelper.notify(error.message, 'error');
        }
    }
}