<script setup lang="ts">
import UsersPage from '~/modules/resources/users/users-page.vue'

defineOptions({ name: 'UsersRoutePage' })

definePageMeta({
  path: '/app/resources/users/:id?',
})
</script>

<template>
  <UsersPage />
</template>
