<script setup lang="ts">
import InternalClientsPage from '~/modules/resources/internal-clients/internal-clients-page.vue'

defineOptions({ name: 'InternalClientsRoutePage' })

definePageMeta({
  path: '/app/internal/clients/:id?',
})
</script>

<template>
  <InternalClientsPage />
</template>
