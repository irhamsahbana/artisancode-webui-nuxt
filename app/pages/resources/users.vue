<script setup lang="ts">
import UsersPage from '~/modules/resources/users/users-page.vue'

defineOptions({ name: 'UsersRoutePage' })

definePageMeta({
  path: '/resources/users/:id?',
})
</script>

<template>
  <UsersPage />
</template>
