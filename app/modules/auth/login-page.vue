<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue'
import { navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'LoginPage' })

const runtimeConfig = useRuntimeConfig()
const route = useRoute()
const { login, resendVerificationEmail } = useAuth()
const { locale, options: localeOptions, setLocale, t } = useLocale()
const isLoading = ref(false)
const isResending = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const appName = computed(() => runtimeConfig.public.appName || 'ArtisanCode')
const signInDescription = computed(() =>
  locale.value === 'id'
    ? `Masuk ke akun ${appName.value} Anda`
    : `Sign in to your ${appName.value} account`,
)

const form = reactive({
  email: '',
  password: '',
  tenant_code: '',
})

const showResendVerification = computed(() =>
  errorMessage.value.toLowerCase().includes('verif')
  && form.email.length > 0,
)

if (typeof route.query.email === 'string' && route.query.email) {
  form.email = route.query.email
}

if (route.query.notice === 'verify-email') {
  infoMessage.value = t('auth.verificationRequiredNotice')
}

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
  infoMessage.value = route.query.notice === 'verify-email' ? t('auth.verificationRequiredNotice') : ''
  isLoading.value = true
  try {
    const response = await login({ ...form })
    if (!response.success) {
      if (response.message.toLowerCase().includes('verif') && form.email) {
        await navigateTo({
          path: '/auth/check-email',
          query: {
            email: form.email,
          },
        })
        return
      }
      errorMessage.value = response.message
    }
    if (response.success) {
      await navigateTo('/')
    }
  } catch {
    errorMessage.value = t('auth.loginFailed')
  } finally {
    isLoading.value = false
  }
}

const resendVerification = async () => {
  if (!form.email) {
    return
  }

  errorMessage.value = ''
  isResending.value = true
  try {
    const response = await resendVerificationEmail(form.email)
    if (!response.success) {
      errorMessage.value = response.message
      return
    }

    infoMessage.value = response.message
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <div class="auth-shell flex min-h-screen items-center justify-center bg-muted/30 px-6">
    <!-- Decorative background elements -->
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
          {{ t('auth.welcomeBack') }}
        </CardTitle>
        <p class="auth-description text-sm text-muted-foreground">
          {{ signInDescription }}
        </p>
      </CardHeader>
      <CardContent class="auth-card-content space-y-4">
        <div class="space-y-2">
          <Label for="login-language">
            {{ t('common.language') }}
          </Label>
          <SearchableSelect
            id="login-language"
            :model-value="locale"
            :options="localeOptions"
            @update:model-value="setLocale(($event || 'id') as 'id' | 'en')"
          />
        </div>
        <div class="space-y-2">
          <Label for="login-email">
            {{ t('auth.email') }}
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
            {{ t('auth.password') }}
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
            {{ t('auth.tenantCode') }}
          </Label>
          <Input
            id="login-tenant-code"
            v-model="form.tenant_code"
            placeholder="your tenant code"
            maxlength="5"
            @keyup.enter="submit"
          />
          <p class="text-xs text-muted-foreground">
            {{ t('auth.tenantCodeHint') }}
          </p>
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
        <Button
          v-if="showResendVerification"
          variant="outline"
          class="w-full"
          :disabled="isResending"
          @click="resendVerification"
        >
          {{ isResending ? t('auth.resendingVerificationEmail') : t('auth.resendVerificationEmail') }}
        </Button>
      </CardContent>
      <CardFooter class="auth-card-footer flex-col gap-4">
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
          {{ isLoading ? t('auth.signingIn') : t('auth.signIn') }}
        </Button>
        <p class="text-center text-sm text-muted-foreground">
          <NuxtLink
            to="/auth/forgot-password"
            class="font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            {{ t('auth.forgotPassword') }}
          </NuxtLink>
        </p>
        <p class="text-center text-sm text-muted-foreground">
          {{ t('auth.noAccount') }}
          <NuxtLink
            to="/register"
            class="font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            {{ t('auth.createOne') }}
          </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
