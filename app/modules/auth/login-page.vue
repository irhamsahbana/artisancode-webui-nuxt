<script setup lang="ts">
import { reactive, ref } from 'vue'
import { navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'LoginPage' })

const { login } = useAuth()
const isLoading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  password: '',
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
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <p class="text-sm text-muted-foreground">
          Use your API credentials to continue.
        </p>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label>Username</Label>
          <Input
            v-model="form.username"
            placeholder="username"
          />
        </div>
        <div class="space-y-2">
          <Label>Password</Label>
          <Input
            v-model="form.password"
            type="password"
            placeholder="••••••••"
          />
        </div>
        <div
          v-if="errorMessage"
          class="text-sm text-destructive"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
      <CardFooter class="justify-end">
        <Button
          :disabled="isLoading"
          @click="submit"
        >
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
