<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
        Olá, {{ usuarioLogado?.nome || 'Usuário' }}! 👋
      </h1>
      <p class="text-slate-500 dark:text-slate-400">
        Bem-vindo ao painel administrativo do ERP A Casa.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard 
        title="Status da Conta" 
        :value="usuarioLogado?.status" 
        icon="pi pi-check-circle"
        class="border-green-100 bg-green-50/30"
      />
      
      <MetricCard 
        v-can="'usuarios.ver'"
        title="Gestão de Acessos" 
        value="Aprovar Usuários" 
        icon="pi pi-users"
        @click="$router.push('/rh/usuarios')"
        class="cursor-pointer hover:border-indigo-200 transition-colors"
      />

      <MetricCard 
        title="Meus Dados" 
        value="Ver Perfil" 
        icon="pi pi-user-edit"
        @click="$router.push('/alterar-senha')"
        class="cursor-pointer hover:border-slate-300 transition-colors"
      />
    </div>

    <div v-if="usuarioLogado?.usuario === 'Ana.P'" class="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6">
      <div class="flex items-start gap-4 text-indigo-900">
        <i class="pi pi-shield text-2xl" />
        <div>
          <h3 class="font-bold text-lg">Modo Administrador Ativo</h3>
          <p class="text-sm opacity-80">
            Você tem acesso total a todos os módulos do sistema. Utilize o menu lateral para gerenciar produções, vendas e RH.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuth } from '@/services/useauth.js' // Ajustado para o nome real do arquivo

const { usuarioLogado } = useAuth()

// Não precisa de definePage meta public aqui, 
// pois queremos que o Router proteja esta página!
</script>