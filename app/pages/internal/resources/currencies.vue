<script setup lang="ts">
import InternalCurrenciesPage from '~/modules/internal/resources/currencies/internal-currencies-page.vue'

defineOptions({ name: 'InternalCurrenciesRoutePage' })

definePageMeta({
  path: '/app/internal/currencies',
})
</script>

<template>
  <InternalCurrenciesPage />
</template>
