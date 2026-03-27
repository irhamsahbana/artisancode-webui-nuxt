<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'LoginPage' })

const { login } = useAuth()
const isLoading = ref(false)
const errorMessage = ref('')

const form = reactive({
  email: '',
  password: '',
  tenant_code: '',
})

// Ensure tenant code is always uppercase alphanumeric
watch(() => form.tenant_code, (newVal) => {
  const cleaned = newVal
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (cleaned !== newVal) {
    form.tenant_code = cleaned
  }
})

const submit = async () => {
  errorMessage.value = ''
  isLoading.value = true
  try {
    const response = await login({ ...form })
    if (!response.success) {
      errorMessage.value = response.message
    }
    if (response.success) {
      await navigateTo('/')
    }
  } catch {
    errorMessage.value = 'Login failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/30 px-6">
    <!-- Decorative background elements -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div class="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div class="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
    </div>

    <Card class="relative w-full max-w-md shadow-lg">
      <CardHeader class="space-y-1 text-center">
        <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          AC
        </div>
        <CardTitle class="text-2xl">
          Welcome back
        </CardTitle>
        <p class="text-sm text-muted-foreground">
          Sign in to your ArtisanCode account
        </p>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="login-email">
            Email
          </Label>
          <Input
            id="login-email"
            v-model="form.email"
            type="email"
            placeholder="you@company.com"
            @keyup.enter="submit"
          />
        </div>
        <div class="space-y-2">
          <Label for="login-password">
            Password
          </Label>
          <Input
            id="login-password"
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            @keyup.enter="submit"
          />
        </div>
        <div class="space-y-2">
          <Label for="login-tenant-code">
            Tenant Code
          </Label>
          <Input
            id="login-tenant-code"
            v-model="form.tenant_code"
            placeholder="your tenant code"
            maxlength="5"
            @keyup.enter="submit"
          />
          <p class="text-xs text-muted-foreground">
            Maximum 5 characters, case insensitive
          </p>
        </div>
        <div
          v-if="errorMessage"
          class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
      <CardFooter class="flex-col gap-4">
        <Button
          id="login-submit"
          class="w-full"
          :disabled="isLoading"
          @click="submit"
        >
          <span
            v-if="isLoading"
            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </Button>
        <p class="text-center text-sm text-muted-foreground">
          Don't have an account?
          <NuxtLink
            to="/register"
            class="font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            Create one
          </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
