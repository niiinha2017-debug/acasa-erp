<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl overflow-hidden text-center">
      <div class="h-1.5 w-full bg-[linear-gradient(90deg,#2f7fb3_0%,#255a82_100%)]"></div>
      <div class="p-8">
        <div class="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
          <i class="pi pi-check text-3xl text-emerald-600 dark:text-emerald-400"></i>
        </div>
        <h1 class="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">Contrato assinado com sucesso</h1>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Obrigado! Seu aceite foi registrado. Em caso de dúvidas, entre em contato conosco.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
definePage({ meta: { public: true } })
</script>
