<template>
  <Card class="login-font mt-4 mb-8 mx-2 lg:mx-4 rounded-3xl border border-border-ui bg-bg-card shadow-2xl overflow-hidden animate-page-in">
    <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>
    <PageHeader
      :title="isEdit ? `Editar Funcionário #${funcionarioId}` : 'Novo Funcionário'"
      subtitle="Gerenciamento de dados pessoais e contratuais"
      icon="pi pi-users"
      :showBack="false"
      class="border-b border-border-ui"
    />

    <div class="p-8 lg:p-12">
      <Loading v-if="loading" />

      <form v-else class="space-y-10 clientes-line-form" @submit.prevent="confirmarSalvar" autocomplete="off">
        
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Dados Pessoais
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-6"
            v-model="form.nome"
            label="Nome Completo"
            required
            placeholder="NOME DO FUNCIONÁRIO"
            force-upper
          />
          <Input
            class="col-span-12 md:col-span-3"
            v-model="cpfMask"
            label="CPF"
            required
            placeholder="000.000.000-00"
          />
          <Input
            class="col-span-12 md:col-span-3"
            v-model="form.rg"
            label="RG"
            placeholder="EX: 00.000.000-0"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.data_nascimento"
            type="date"
            label="Data de Nascimento"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="telefoneMask"
            label="Telefone/WhatsApp"
            placeholder="(00) 00000-0000"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.email"
            label="E-mail"
            type="email"
            placeholder="exemplo@email.com"
            :force-upper="false"
          />
        </div>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-border-ui/50"></div>
          </div>
          <div class="relative flex justify-center">
            <span class="bg-bg-page dark:bg-slate-900 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Contrato e Datas
            </span>
          </div>
        </div>

        <div class="grid grid-cols-12 gap-6">
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.data_inicio"
            type="date"
            label="Início das Atividades (Registro)"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.admissao"
            type="date"
            label="Data de Admissão"
          />
          <Input
            class="col-span-12 md:col-span-4"
            v-model="form.demissao"
            type="date"
            label="Data de Demissão"
          />
        </div>

        <div class="pt-10 mt-6 border-t border-border-ui">
          <div class="flex items-center justify-between gap-4">
            <Button
              variant="primary"
              size="lg"
              type="submit"
              :loading="saving"
              class="!rounded-xl px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-primary/90 hover:shadow-2xl hover:shadow-brand-primary/30 active:scale-[0.98] transition-all group relative overflow-hidden"
            >
              <span class="relative flex items-center justify-center gap-2 font-bold tracking-wide text-white">
                <i class="pi pi-save group-hover:rotate-12 transition-transform"></i>
                {{ isEdit ? 'ATUALIZAR FUNCIONÁRIO' : 'CADASTRAR FUNCIONÁRIO' }}
              </span>
            </Button>

            <Button
              v-if="isEdit && can('funcionarios.excluir')"
              type="button"
              variant="danger"
              size="lg"
              :loading="deleting"
              @click="confirmarExcluir"
            >
              <i class="pi pi-trash mr-2"></i> EXCLUIR
            </Button>
          </div>
        </div>
      </form>
    </div>
  </Card>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FuncionariosService } from '@/services/index' // Ajuste conforme seu index de services
import { notify } from '@/services/notify'
import { confirm } from '@/services/confirm'
import { maskCPF, maskTelefone } from '@/utils/masks'
import { can } from '@/services/permissions'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)

const funcionarioId = computed(() => Number(route.params?.id))
const isEdit = computed(() => !!funcionarioId.value)

const form = ref({
  nome: '',
  cpf: '',
  rg: '',
  email: '',
  telefone: '',
  data_nascimento: '',
  data_inicio: '',
  admissao: '',
  demissao: '',
})

// Máscaras reativas
const cpfMask = computed({
  get: () => form.value.cpf,
  set: (v) => { form.value.cpf = maskCPF(v) }
})

const telefoneMask = computed({
  get: () => form.value.telefone,
  set: (v) => { form.value.telefone = maskTelefone(v) }
})

async function carregarDados() {
  if (!isEdit.value) return
  loading.value = true
  try {
    const res = await FuncionariosService.buscarPorId(funcionarioId.value)
    // Formata datas para o input type="date" (YYYY-MM-DD)
    const data = res?.data || res
    form.value = {
      ...data,
      data_nascimento: data.data_nascimento?.split('T')[0] || '',
      data_inicio: data.data_inicio?.split('T')[0] || '',
      admissao: data.admissao?.split('T')[0] || '',
      demissao: data.demissao?.split('T')[0] || '',
    }
  } catch (e) {
    notify.error('Erro ao carregar funcionário.')
  } finally {
    loading.value = false
  }
}

async function confirmarSalvar() {
  const ok = await confirm.show(
    isEdit.value ? 'Atualizar' : 'Cadastrar',
    'Deseja salvar os dados do funcionário?'
  )
  if (!ok) return

  saving.value = true
  try {
    const payload = { ...form.value }
    if (isEdit.value) {
      await FuncionariosService.atualizar(funcionarioId.value, payload)
    } else {
      await FuncionariosService.criar(payload)
    }
    notify.success('Sucesso!')
    router.push('/funcionarios')
  } catch (e) {
    notify.error(e?.response?.data?.message || 'Erro ao salvar.')
  } finally {
    saving.value = false
  }
}

async function confirmarExcluir() {
  const ok = await confirm.show('Excluir?', 'Esta ação é irreversível.')
  if (!ok) return
  deleting.value = true
  try {
    await FuncionariosService.remover(funcionarioId.value)
    notify.success('Removido!')
    router.push('/funcionarios')
  } catch (e) {
    notify.error('Erro ao excluir.')
  } finally {
    deleting.value = false
  }
}

onMounted(carregarDados)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
.login-font { font-family: 'Manrope', sans-serif; }

.clientes-line-form :deep(.w-full.flex.flex-col.gap-1\.5 > label) {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: rgb(100 116 139);
}

.clientes-line-form :deep(input.w-full) {
  border-top: 0; border-left: 0; border-right: 0;
  border-bottom-width: 2px;
  border-radius: 0;
  background: transparent;
}
</style>