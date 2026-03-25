<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const { token, user, logout } = useAuth()
</script>

<template>
  <div class="flex items-center gap-3 text-sm">
    <div
      v-if="token"
      class="text-muted-foreground"
    >
      {{ user?.name || user?.username }}
    </div>
    <Button
      v-if="token"
      variant="outline"
      size="sm"
      @click="logout"
    >
      Logout
    </Button>
    <NuxtLink
      v-else
      to="/login"
      class="text-sm text-primary hover:underline"
    >
      Login
    </NuxtLink>
  </div>
</template>
