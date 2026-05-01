<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { navigateTo } from '#app'
import GoogleIdentityButton from '~/components/auth/google-identity-button.vue'
import { useAuth } from '~/composables/useAuth'
import { useTenantSetupDraft } from '~/composables/useTenantSetupDraft'
import { isGoogleAccountNotConnected, resolveGoogleAuthErrorKey } from '~/utils/google-auth-errors'

defineOptions({ name: 'RegisterPage' })

const runtimeConfig = useRuntimeConfig()
const {
  googleLogin,
  googleRegisterInit,
} = useAuth()
const { clearDraft, setDraft } = useTenantSetupDraft()
const { locale, t } = useLocale()
const localePath = useLocalePath()
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const errorMessage = ref('')
const googleErrorMessage = ref('')
const appName = computed(() => runtimeConfig.public.appName || 'ArtisanCode')
const registerDescription = computed(() =>
  locale.value === 'id'
    ? `Siapkan organisasi Anda di ${appName.value}`
    : `Set up your organization on ${appName.value}`,
)

type RegisterFieldName =
  | 'language'
  | 'name'
  | 'username'
  | 'email'
  | 'password'

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  language: locale.value,
})

const fieldErrors = reactive<Record<RegisterFieldName, string>>({
  language: '',
  name: '',
  username: '',
  email: '',
  password: '',
})

const clearFieldError = (field: RegisterFieldName) => {
  fieldErrors[field] = ''
}

const resetErrors = () => {
  errorMessage.value = ''
  clearFieldError('language')
  clearFieldError('name')
  clearFieldError('username')
  clearFieldError('email')
  clearFieldError('password')
}

watch(locale, (newLocale) => {
  form.language = newLocale
  clearFieldError('language')
})

watch(() => form.name, () => clearFieldError('name'))
watch(() => form.username, () => clearFieldError('username'))
watch(() => form.email, () => clearFieldError('email'))
watch(() => form.password, () => clearFieldError('password'))
// Client-side password strength feedback
const passwordChecks = computed(() => ({
  minLength: form.password.length >= 8,
  hasUpper: /[A-Z]/.test(form.password),
  hasLower: /[a-z]/.test(form.password),
  hasNumber: /\d/.test(form.password),
}))

const passwordStrength = computed(() => {
  const checks = passwordChecks.value
  const passed = [checks.minLength, checks.hasUpper, checks.hasLower, checks.hasNumber].filter(Boolean).length
  return passed
})

const passwordStrengthLabel = computed(() => {
  if (form.password.length === 0) return ''
  if (passwordStrength.value <= 1) return t('auth.passwordWeak')
  if (passwordStrength.value <= 2) return t('auth.passwordFair')
  if (passwordStrength.value <= 3) return t('auth.passwordGood')
  return t('auth.passwordStrong')
})

const passwordStrengthColor = computed(() => {
  if (form.password.length === 0) return 'bg-muted'
  if (passwordStrength.value <= 1) return 'bg-destructive'
  if (passwordStrength.value <= 2) return 'bg-orange-500'
  if (passwordStrength.value <= 3) return 'bg-yellow-500'
  return 'bg-green-500'
})

const passwordsMatch = computed(() =>
  form.confirmPassword.length > 0 && form.password === form.confirmPassword,
)

const showPasswordMismatch = computed(() =>
  form.confirmPassword.length > 0 && !passwordsMatch.value,
)

const validateAccount = () => {
  resetErrors()

  if (!form.name.trim()) {
    fieldErrors.name = t('common.requiredField', { field: t('auth.fullName') })
  }

  if (!form.username.trim()) {
    fieldErrors.username = t('common.requiredField', { field: t('auth.username') })
  }

  if (!form.email.trim()) {
    fieldErrors.email = t('common.requiredField', { field: t('auth.email') })
  }

  if (!form.password.trim()) {
    fieldErrors.password = t('common.requiredField', { field: t('auth.password') })
  }

  return !fieldErrors.name
    && !fieldErrors.username
    && !fieldErrors.email
    && !fieldErrors.password
}

const submit = async () => {
  if (!validateAccount()) {
    return
  }

  if (!passwordsMatch.value) {
    errorMessage.value = t('auth.passwordMismatch')
    return
  }

  isLoading.value = true
  try {
    setDraft({
      kind: 'email',
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      language: form.language,
    })
    await navigateTo(localePath('/auth/tenant-setup'))
  } catch {
    errorMessage.value = t('auth.registrationFailed')
  } finally {
    isLoading.value = false
  }
}

const handleGoogleError = () => {
  googleErrorMessage.value = t('auth.googleUnavailableDescription')
}

const handleGoogleCredential = async (idToken: string) => {
  googleErrorMessage.value = ''
  isGoogleLoading.value = true
  try {
    clearDraft()
    const loginResponse = await googleLogin({ id_token: idToken })
    if (loginResponse.success) {
      await navigateTo(localePath('/app'))
      return
    }

    const loginMappedKey = resolveGoogleAuthErrorKey(loginResponse)
    if (!isGoogleAccountNotConnected(loginResponse)) {
      googleErrorMessage.value = loginMappedKey ? t(loginMappedKey) : t('auth.googleRegisterFailed')
      return
    }

    const initResponse = await googleRegisterInit({ id_token: idToken })
    if (!initResponse.success || !initResponse.data) {
      const mappedKey = resolveGoogleAuthErrorKey(initResponse)
      googleErrorMessage.value = mappedKey ? t(mappedKey) : t('auth.googleRegisterRetryRequired')
      return
    }

    setDraft({
      kind: 'google',
      registrationToken: initResponse.data.registration_token,
      email: initResponse.data.email,
      displayName: initResponse.data.display_name,
    })
    await navigateTo(localePath('/auth/tenant-setup'))
  } catch {
    googleErrorMessage.value = t('auth.googleRegisterFailed')
  } finally {
    isGoogleLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-10">
    <!-- Decorative background elements -->
    <div class="pointer-events-none fixed inset-0 overflow-hidden">
      <div class="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      <div class="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
    </div>

    <Card class="relative w-full max-w-lg shadow-lg">
      <CardHeader class="space-y-1 text-center">
        <div class="mx-auto mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-border/60">
          <img
            src="/brand/presense-app-icon.svg"
            :alt="`${appName} logo`"
            class="h-full w-full object-cover"
          >
        </div>
        <CardTitle class="text-2xl">
          {{ t('auth.createAccount') }}
        </CardTitle>
        <p class="text-sm text-muted-foreground">
          {{ registerDescription }}
        </p>
      </CardHeader>
      <CardContent class="space-y-4">
        <GoogleIdentityButton
          mode="register"
          :busy="isGoogleLoading"
          @credential="handleGoogleCredential"
          @error="handleGoogleError"
        />
        <div
          v-if="googleErrorMessage"
          class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
        >
          {{ googleErrorMessage }}
        </div>
        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator class="flex-1" />
          <span>{{ t('auth.orRegisterWithEmail') }}</span>
          <Separator class="flex-1" />
        </div>
        <!-- User section -->
        <div class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="register-name">
                {{ t('auth.fullName') }}
              </Label>
              <Input
                id="register-name"
                v-model="form.name"
                name="name"
                autocomplete="name"
                :placeholder="t('auth.fullNamePlaceholder')"
              />
              <p
                v-if="fieldErrors.name"
                class="text-xs font-medium text-destructive dark:text-red-300"
              >
                {{ fieldErrors.name }}
              </p>
            </div>
            <div class="space-y-2">
              <Label for="register-username">
                {{ t('auth.username') }}
              </Label>
              <Input
                id="register-username"
                v-model="form.username"
                name="username"
                autocomplete="username"
                spellcheck="false"
                :placeholder="t('auth.usernamePlaceholder')"
              />
              <p
                v-if="fieldErrors.username"
                class="text-xs font-medium text-destructive dark:text-red-300"
              >
                {{ fieldErrors.username }}
              </p>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="register-email">
              {{ t('auth.email') }}
            </Label>
            <Input
              id="register-email"
              v-model="form.email"
              name="email"
              type="email"
              autocomplete="email"
              spellcheck="false"
              inputmode="email"
              :placeholder="t('auth.emailPlaceholder')"
            />
            <p
              v-if="fieldErrors.email"
              class="text-xs font-medium text-destructive dark:text-red-300"
            >
              {{ fieldErrors.email }}
            </p>
          </div>
          <div class="space-y-2">
            <Label for="register-password">
              {{ t('auth.password') }}
            </Label>
            <Input
              id="register-password"
              v-model="form.password"
              name="password"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              @keyup.enter="submit"
            />
            <p
              v-if="fieldErrors.password"
              class="text-xs font-medium text-destructive dark:text-red-300"
            >
              {{ fieldErrors.password }}
            </p>
            <!-- Password strength indicator -->
            <div
              v-if="form.password.length > 0"
              class="space-y-2"
            >
              <div class="flex items-center gap-2">
                <div class="flex flex-1 gap-1">
                  <div
                    v-for="i in 4"
                    :key="i"
                    class="h-1.5 flex-1 rounded-full transition-colors duration-300"
                    :class="i <= passwordStrength ? passwordStrengthColor : 'bg-muted'"
                  />
                </div>
                <span
                  class="text-xs font-medium"
                  :class="{
                    'text-destructive': passwordStrength <= 1,
                    'text-orange-500': passwordStrength === 2,
                    'text-yellow-600': passwordStrength === 3,
                    'text-green-600': passwordStrength === 4,
                  }"
                >
                  {{ passwordStrengthLabel }}
                </span>
              </div>
              <ul class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <li :class="passwordChecks.minLength ? 'text-green-600' : 'text-muted-foreground'">
                  {{ passwordChecks.minLength ? '✓' : '○' }} {{ t('auth.passwordMin') }}
                </li>
                <li :class="passwordChecks.hasUpper ? 'text-green-600' : 'text-muted-foreground'">
                  {{ passwordChecks.hasUpper ? '✓' : '○' }} {{ t('auth.passwordUpper') }}
                </li>
                <li :class="passwordChecks.hasLower ? 'text-green-600' : 'text-muted-foreground'">
                  {{ passwordChecks.hasLower ? '✓' : '○' }} {{ t('auth.passwordLower') }}
                </li>
                <li :class="passwordChecks.hasNumber ? 'text-green-600' : 'text-muted-foreground'">
                  {{ passwordChecks.hasNumber ? '✓' : '○' }} {{ t('auth.passwordNumber') }}
                </li>
              </ul>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="register-confirm-password">
              {{ t('auth.confirmPassword') }}
            </Label>
            <Input
              id="register-confirm-password"
              v-model="form.confirmPassword"
              name="confirm_password"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              @keyup.enter="submit"
            />
            <p
              v-if="showPasswordMismatch"
              class="text-xs font-medium text-destructive dark:text-red-300"
            >
              {{ t('auth.passwordMismatch') }}
            </p>
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
      <CardFooter class="flex-col gap-4">
        <Button
          id="register-submit"
          class="w-full"
          :disabled="isLoading || showPasswordMismatch"
          @click="submit"
        >
          <span
            v-if="isLoading"
            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {{ isLoading ? t('auth.creatingAccount') : t('auth.createAccount') }}
        </Button>
        <p class="text-center text-sm text-muted-foreground">
          {{ t('auth.alreadyHaveAccount') }}
          <NuxtLink
            :to="localePath('/login')"
            class="font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            {{ t('auth.signIn') }}
          </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
