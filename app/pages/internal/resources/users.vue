<script setup lang="ts">
import InternalUsersPage from '~/modules/resources/internal-users/internal-users-page.vue'

defineOptions({ name: 'InternalUsersRoutePage' })

definePageMeta({
  path: '/app/internal/users/:id?',
})
</script>

<template>
  <InternalUsersPage />
</template>
