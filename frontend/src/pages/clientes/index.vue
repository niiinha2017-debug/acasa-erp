<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">Clientes</h1>

      <div class="page-actions">
        <button class="btn btn-primary" type="button" @click="irNovo">
          Novo cliente
        </button>
      </div>
    </header>

    <section class="card">
      <h2 class="card-title">Lista</h2>

      <div v-if="loading" class="muted">Carregando...</div>

      <div v-else-if="erro" class="alert alert-error">
        {{ erro }}
      </div>

      <div v-else>
        <div v-if="!clientes.length" class="muted">
          Nenhum cliente cadastrado.
        </div>

        <table v-else class="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>WhatsApp</th>
              <th style="width: 140px;">Ações</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="c in clientes" :key="c.id">
              <td>
                <div class="cell-title">{{ c.nome_completo }}</div>
                <div class="cell-sub" v-if="c.cnpj || c.cpf">
                  <span v-if="c.cpf">CPF: {{ c.cpf }}</span>
                  <span v-if="c.cnpj"> • CNPJ: {{ c.cnpj }}</span>
                </div>
              </td>

              <td>{{ c.email }}</td>
              <td>{{ c.telefone || '-' }}</td>
              <td>{{ c.whatsapp || '-' }}</td>

              <td>
                <div class="row-actions">
                  <button class="btn btn-ghost" type="button" @click="editar(c.id)">
                    Editar
                  </button>

                  <button class="btn btn-danger" type="button" @click="remover(c.id)">
                    Remover
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import '@/assets/CSS/base/ui.css'

import { ClientesAPI } from '@/services/clientes.api'

// ✅ utils (incluídos)
import * as format from '@/utils/format'
import * as permissions from '@/utils/permissions'
import * as search from '@/utils/search'
import { storage } from '@/utils/storage'
import * as theme from '@/utils/theme'
import * as utils from '@/utils/utils'

const router = useRouter()

const loading = ref(false)
const erro = ref('')
const clientes = ref([])

const carregar = async () => {
  erro.value = ''
  loading.value = true
  try {
    const data = await ClientesAPI.listar()
    clientes.value = Array.isArray(data) ? data : (data?.items || [])
  } catch (e) {
    const m =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      'Não foi possível carregar clientes.'
    erro.value = Array.isArray(m) ? m.join(' | ') : String(m)
  } finally {
    loading.value = false
  }
}

const irNovo = () => {
  router.push('/clientes/novo')
}

const editar = (id) => {
  // se você já tiver a página de editar, mantenha esse padrão
  router.push(`/clientes/${id}`)
}

const remover = async (id) => {
  if (!confirm('Deseja remover este cliente?')) return

  try {
    await ClientesAPI.remover(id)
    await carregar()
  } catch (e) {
    const m =
      e?.response?.data?.message ||
      e?.response?.data?.error ||
      'Não foi possível remover.'
    alert(Array.isArray(m) ? m.join(' | ') : String(m))
  }
}

onMounted(carregar)
</script>
