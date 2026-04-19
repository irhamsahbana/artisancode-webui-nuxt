<script setup lang="ts">
import { useAuth } from '../composables/useAuth'

const { token, user, logout } = useAuth()
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 text-sm">
    <div
      v-if="token"
      class="min-w-0 flex-1 text-muted-foreground"
    >
      <div class="truncate font-medium text-foreground">
        {{ user?.name || user?.username }}
      </div>
      <div
        v-if="user?.tenant_name"
        class="truncate text-xs text-muted-foreground"
      >
        {{ user?.tenant_name }}
      </div>
    </div>
    <Button
      v-if="token"
      variant="outline"
      size="sm"
      class="rounded-xl"
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
