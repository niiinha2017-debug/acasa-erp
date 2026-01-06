<template>
  <div
    class="card"
    :class="{
      'card--hoverable': hoverable,
      'card--shadow': shadow
    }"
  >
    <div v-if="$slots.header || title" class="card-header">
      <slot name="header">
        <h3 v-if="title" class="card-title">{{ title }}</h3>
      </slot>
    </div>

    <div class="card-body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  hoverable: { type: Boolean, default: false },
  shadow: { type: Boolean, default: true }
})
</script>


