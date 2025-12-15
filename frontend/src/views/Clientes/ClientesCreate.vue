<template>
  <div class="page">
    <!-- Header da página -->
    <header class="page-header">
      <h1>Novo Cliente</h1>
    </header>

    <!-- Conteúdo -->
    <div class="page-content">

      <form @submit.prevent="submitForm">

        <!-- Nome + Indicação -->
        <div class="form-row">
          <div class="col-8">
            <input
              placeholder="Nome completo *"
              v-model="cliente.nome"
              required
            />
          </div>
          <div class="col-4">
            <input
              placeholder="Indicação"
              v-model="cliente.indicacao"
            />
          </div>
        </div>

        <!-- Email + Telefone -->
        <div class="form-row">
          <div class="col-6">
            <input placeholder="E-mail" v-model="cliente.email" />
          </div>
          <div class="col-6">
            <input placeholder="Telefone" v-model="cliente.telefone" />
          </div>
        </div>

        <!-- CPF + RG -->
        <div class="form-row">
          <div class="col-6">
            <input placeholder="CPF / CNPJ" v-model="cliente.cpf_cnpj" />
          </div>
          <div class="col-6">
            <input placeholder="RG / IE" v-model="cliente.rg_ie" />
          </div>
        </div>

        <!-- CEP + Endereço -->
        <div class="form-row">
          <div class="col-4">
            <input placeholder="CEP" v-model="cliente.cep" />
          </div>
          <div class="col-8">
            <input placeholder="Endereço" v-model="cliente.endereco" />
          </div>
        </div>

        <!-- Número / Complemento / Bairro -->
        <div class="form-row">
          <div class="col-4">
            <input placeholder="Número" v-model="cliente.numero" />
          </div>
          <div class="col-4">
            <input placeholder="Complemento" v-model="cliente.complemento" />
          </div>
          <div class="col-4">
            <input placeholder="Bairro" v-model="cliente.bairro" />
          </div>
        </div>

        <!-- Cidade / UF / Status -->
        <div class="form-row">
          <div class="col-6">
            <input placeholder="Cidade" v-model="cliente.cidade" />
          </div>
          <div class="col-3">
            <input placeholder="UF" maxlength="2" v-model="cliente.estado" />
          </div>
          <div class="col-3">
            <select v-model="cliente.status">
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Potencial">Potencial</option>
            </select>
          </div>
        </div>

        <!-- Observação -->
        <div class="form-row">
          <div class="col-12">
            <textarea
              placeholder="Observação"
              v-model="cliente.observacao"
            ></textarea>
          </div>
        </div>

        <!-- Ações -->
        <div class="form-actions">
          <button type="button" @click="cancelar">
            Cancelar
          </button>

          <button type="submit" class="btn-gradient">
            Salvar Cliente
          </button>
        </div>

        <div v-if="mensagemErro">{{ mensagemErro }}</div>

      </form>
    </div>
  </div>
</template>


<script>
export default {
  name: 'ClientesCreate',
  data() {
    return {
      cliente: {
        nome: '',
        indicacao: '',
        email: '',
        telefone: '',
        cep: '',
        endereco: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        cpf_cnpj: '',
        rg_ie: '',
        observacao: '',
        status: 'Ativo', // Default para 'Ativo'
      },
      mensagemSucesso: '',
      mensagemErro: '',
    };
  },
  methods: {
    // A lógica de submitForm permanece a mesma, pois envia o objeto this.cliente completo
    async submitForm() {
        // ... (Lógica de POST para /clientes) ...
        this.mensagemSucesso = '';
        this.mensagemErro = '';

        // 🛑 CORREÇÃO: Forçando o uso do localhost para contornar o erro do .env
        const apiUrl = import.meta.env.VITE_API_URL;
        const endpoint = `${apiUrl}/clientes`;

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.cliente), 
            });

            if (response.ok || response.status === 201) {
                this.mensagemSucesso = 'Cliente cadastrado com sucesso!';
                this.$router.push('/clientes'); 
            } else {
                const errorData = await response.json();
                this.mensagemErro = `Erro ao cadastrar: ${errorData.message || response.statusText}`;
            }
        } catch (error) {
            this.mensagemErro = 'Erro de conexão com a API. Verifique se o Backend está rodando.';
            console.error('Erro de rede:', error);
        }
    },
    
    cancelar() {
      this.$router.push('/clientes');
    }
  }
};
</script>

