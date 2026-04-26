<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { navigateTo } from '#app'
import { useInternalAuth } from '~/composables/useInternalAuth'

defineOptions({ name: 'InternalLoginPage' })

const runtimeConfig = useRuntimeConfig()
const { login } = useInternalAuth()
const { locale, options: localeOptions, setLocale, t } = useLocale()
const localePath = useLocalePath()
const isLoading = ref(false)
const errorMessage = ref('')
const appName = computed(() => runtimeConfig.public.appName || 'ArtisanCode')

const form = reactive({
  email: '',
  password: '',
})

const submit = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const response = await login({
      email: form.email.trim(),
      password: form.password,
    })

    if (!response.success) {
      errorMessage.value = response.message
      return
    }

    await navigateTo(localePath('/app/internal/users'))
  } catch {
    errorMessage.value = t('ui.internalLoginFailed')
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-shell flex min-h-screen items-center justify-center bg-muted/30 px-6">
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div class="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div class="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
    </div>

    <Card class="auth-card relative w-full max-w-md shadow-lg">
      <CardHeader class="auth-card-header space-y-1 text-center">
        <div class="auth-logo-frame mx-auto mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-border/60">
          <img
            src="/brand/presense-app-icon.svg"
            :alt="`${appName} logo`"
            class="h-full w-full object-cover"
          >
        </div>
        <CardTitle class="auth-title text-2xl">
          {{ t('ui.internalAdminLogin') }}
        </CardTitle>
        <p class="auth-description text-sm text-muted-foreground">
          {{ t('ui.signInWithYourInternalAdminAccount') }}
        </p>
      </CardHeader>
      <CardContent class="auth-card-content space-y-4">
        <div class="space-y-2">
          <Label for="internal-login-language">
            {{ t('ui.language') }}
          </Label>
          <SearchableSelect
            id="internal-login-language"
            :model-value="locale"
            :options="localeOptions"
            @update:model-value="setLocale(($event || 'id') as 'id' | 'en')"
          />
        </div>
        <div class="space-y-2">
          <Label for="internal-login-email">
            {{ t('ui.email') }}
          </Label>
          <Input
            id="internal-login-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="admin@company.com"
            @keyup.enter="submit"
          />
        </div>
        <div class="space-y-2">
          <Label for="internal-login-password">
            {{ t('ui.password') }}
          </Label>
          <Input
            id="internal-login-password"
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            @keyup.enter="submit"
          />
        </div>
        <div
          v-if="errorMessage"
          class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
      <CardFooter class="auth-card-footer flex-col gap-4">
        <Button
          class="w-full"
          :disabled="isLoading"
          @click="submit"
        >
          <span
            v-if="isLoading"
            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {{ isLoading ? t('ui.signingIn') : t('ui.signIn') }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
