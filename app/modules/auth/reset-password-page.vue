<script setup lang="ts">
import { computed, ref } from 'vue'
import { navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'ResetPasswordPage' })

const route = useRoute()
const { resetPassword } = useAuth()
const { t } = useLocale()
const localePath = useLocalePath()
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')

const token = computed(() => (
  typeof route.query.token === 'string' ? route.query.token : ''
))

const submit = async () => {
  errorMessage.value = ''
  infoMessage.value = ''

  if (!token.value) {
    errorMessage.value = t('auth.passwordResetFailed')
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = t('auth.passwordMismatch')
    return
  }

  isLoading.value = true
  try {
    const response = await resetPassword(token.value, password.value)
    if (!response.success) {
      errorMessage.value = response.message
      return
    }

    infoMessage.value = response.message
    setTimeout(() => navigateTo(localePath('/login')), 1200)
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
          {{ t('auth.resetPassword') }}
        </CardTitle>
        <p class="text-sm text-muted-foreground">
          {{ t('auth.resetPasswordDescription') }}
        </p>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <Label for="reset-password">
            {{ t('auth.password') }}
          </Label>
          <Input
            id="reset-password"
            v-model="password"
            name="password"
            type="password"
            autocomplete="new-password"
            @keyup.enter="submit"
          />
        </div>
        <div class="space-y-2">
          <Label for="reset-password-confirm">
            {{ t('auth.confirmPassword') }}
          </Label>
          <Input
            id="reset-password-confirm"
            v-model="confirmPassword"
            name="confirm_password"
            type="password"
            autocomplete="new-password"
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
          {{ isLoading ? t('auth.resettingPassword') : t('auth.resetPasswordAction') }}
        </Button>
        <NuxtLink
          :to="localePath('/login')"
          class="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {{ t('auth.backToLogin') }}
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>
