<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'ForgotPasswordPage' })

const { forgotPassword } = useAuth()
const { t } = useLocale()
const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const submit = async () => {
  errorMessage.value = ''
  infoMessage.value = ''
  isLoading.value = true

  try {
    const response = await forgotPassword(email.value)
    if (!response.success) {
      errorMessage.value = response.message
      return
    }

    infoMessage.value = response.message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-10">
    <Card class="w-full max-w-md shadow-lg">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl">
          {{ t('auth.forgotPassword') }}
        </CardTitle>
        <p class="text-sm text-muted-foreground">
          {{ t('auth.forgotPasswordDescription') }}
        </p>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="forgot-email">
            {{ t('auth.email') }}
          </Label>
          <Input
            id="forgot-email"
            v-model="email"
            type="email"
            placeholder="you@company.com"
            @keyup.enter="submit"
          />
        </div>
        <div
          v-if="infoMessage"
          class="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          {{ infoMessage }}
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
          class="w-full"
          :disabled="isLoading"
          @click="submit"
        >
          {{ isLoading ? t('auth.sendingResetLink') : t('auth.sendResetLink') }}
        </Button>
        <NuxtLink
          to="/login"
          class="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {{ t('auth.backToLogin') }}
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>
