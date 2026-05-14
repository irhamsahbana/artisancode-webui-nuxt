<script setup lang="ts">
import InternalClientsPage from '~/modules/internal/resources/clients/internal-clients-page.vue'

defineOptions({ name: 'InternalClientsRoutePage' })

definePageMeta({
  path: '/app/internal/clients/:id?',
})
</script>

<template>
  <InternalClientsPage />
</template>
