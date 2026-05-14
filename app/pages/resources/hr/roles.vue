<script setup lang="ts">
import RolesPage from '~/modules/resources/hr/roles/roles-page.vue'

defineOptions({ name: 'RolesRoutePage' })

definePageMeta({
  path: '/app/resources/roles/:id?',
})
</script>

<template>
  <RolesPage />
</template>
