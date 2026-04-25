<script setup lang="ts">
import InternalLoginPage from '~/modules/auth/internal-login-page.vue'

defineOptions({ name: 'InternalLoginRoutePage' })

definePageMeta({
  path: '/app/internal/login',
})
</script>

<template>
  <InternalLoginPage />
</template>
