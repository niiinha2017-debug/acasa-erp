<template>
  <main
    :class="[
      'page-shell w-full animate-page-in',
      padded ? 'min-h-[calc(100vh-4rem)] py-6 md:py-8 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] md:pl-[calc(1.5rem+env(safe-area-inset-left,0px))] md:pr-[calc(1.5rem+env(safe-area-inset-right,0px))] lg:pl-[calc(2rem+env(safe-area-inset-left,0px))] lg:pr-[calc(2rem+env(safe-area-inset-right,0px))]' : 'page-shell--fluid min-h-full px-0 py-0',
    ]"
  >
    <div :class="[contained ? 'page-container' : 'w-full max-w-none', 'page-content']">
      <slot />
    </div>
  </main>
</template>

<script setup>
defineProps({
  contained: { type: Boolean, default: false },
  padded: { type: Boolean, default: true },
})
</script>

<style>
.page-shell--fluid {
  background: var(--bg-card);
}

.page-shell--fluid > .page-content {
  min-height: 100%;
  background: var(--bg-card);
}

.page-shell--fluid > .page-content > * {
  min-height: 100%;
}

.page-shell--fluid > .page-content > [class*="rounded-2xl"][class*="border-border-ui"][class*="bg-bg-card"],
.page-shell--fluid > .page-content > .w-full > [class*="rounded-2xl"][class*="border-border-ui"][class*="bg-bg-card"],
.page-shell--fluid > .page-content > .login-font[class*="rounded-2xl"][class*="border-border-ui"][class*="bg-bg-card"] {
  min-height: 100%;
  margin: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: var(--bg-card) !important;
}

.page-shell--fluid > .page-content > [class*="bg-bg-card"] > [class*="bg-brand-primary"][class*="h-1"],
.page-shell--fluid > .page-content > .w-full > [class*="bg-bg-card"] > [class*="bg-brand-primary"][class*="h-1"],
.page-shell--fluid > .page-content > .login-font[class*="bg-bg-card"] > [class*="bg-brand-primary"][class*="h-1"] {
  display: none;
}

.page-shell--fluid .native-table-flush {
  width: 100vw;
  max-width: 100vw;
  margin-inline: calc(50% - 50vw);
  border-radius: 0 !important;
  border-left: 0 !important;
  border-right: 0 !important;
}

.page-shell--fluid .native-table-flush-scroll,
.page-shell--fluid .native-table-flush table,
.page-shell--fluid .native-table-flush thead,
.page-shell--fluid .native-table-flush tbody,
.page-shell--fluid .native-table-flush tr {
  width: 100%;
}
</style>
