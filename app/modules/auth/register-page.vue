<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { navigateTo } from '#app'
import GoogleIdentityButton from '~/components/auth/google-identity-button.vue'
import { useAuth } from '~/composables/useAuth'
import { resolveGoogleAuthErrorKey } from '~/utils/google-auth-errors'

defineOptions({ name: 'RegisterPage' })

const runtimeConfig = useRuntimeConfig()
const {
  googleRegisterInit,
  googleRegister,
  register,
} = useAuth()
const { locale, t } = useLocale()
const localePath = useLocalePath()
const isLoading = ref(false)
const isGoogleLoading = ref(false)
const googleRegistrationToken = ref('')
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
  | 'tenant_name'
  | 'tenant_code'
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
  tenant_code: '',
  tenant_name: '',
  language: locale.value,
})

const googleTenantForm = reactive({
  tenant_name: '',
  tenant_code: '',
  confirm_tenant_setup: false,
})

const fieldErrors = reactive<Record<RegisterFieldName, string>>({
  language: '',
  tenant_name: '',
  tenant_code: '',
  name: '',
  username: '',
  email: '',
  password: '',
})

const genericFailureMessage = computed(() =>
  locale.value === 'id'
    ? 'Permintaan Anda gagal diproses'
    : 'Your request has failed to process',
)

const localizedFieldLabels = computed<Record<RegisterFieldName, string>>(() => ({
  language: t('common.language'),
  tenant_name: t('auth.tenantName'),
  tenant_code: t('auth.tenantCode'),
  name: t('auth.fullName'),
  username: t('auth.username'),
  email: t('auth.email'),
  password: t('auth.password'),
}))

const fieldAliases: Record<string, RegisterFieldName> = {
  code: 'tenant_code',
  tenant_code: 'tenant_code',
  tenant_name: 'tenant_name',
  language: 'language',
  name: 'name',
  username: 'username',
  email: 'email',
  password: 'password',
}

const clearFieldError = (field: RegisterFieldName) => {
  fieldErrors[field] = ''
}

const resetGoogleErrors = () => {
  googleErrorMessage.value = ''
  clearFieldError('tenant_name')
  clearFieldError('tenant_code')
}

const resetErrors = () => {
  errorMessage.value = ''
  clearFieldError('language')
  clearFieldError('tenant_name')
  clearFieldError('tenant_code')
  clearFieldError('name')
  clearFieldError('username')
  clearFieldError('email')
  clearFieldError('password')
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const localizeServerMessage = (message: string, field?: RegisterFieldName) => {
  let formatted = message

  const replacements = [
    ['tenant code', localizedFieldLabels.value.tenant_code],
    ['tenant name', localizedFieldLabels.value.tenant_name],
    ['username', localizedFieldLabels.value.username],
    ['password', localizedFieldLabels.value.password],
    ['language', localizedFieldLabels.value.language],
    ['email', localizedFieldLabels.value.email],
    ['name', localizedFieldLabels.value.name],
    ['code', localizedFieldLabels.value.tenant_code],
  ] as const

  const placeholders = new Map<string, string>()

  replacements.forEach(([source], index) => {
    const placeholder = `__FIELD_${index}__`
    placeholders.set(placeholder, '')
    formatted = formatted.replace(new RegExp(`\\b${escapeRegExp(source)}\\b`, 'gi'), placeholder)
  })

  for (const [source, target] of replacements) {
    const placeholder = [...placeholders.keys()].shift()
    if (!placeholder) {
      continue
    }
    placeholders.delete(placeholder)
    formatted = formatted.replace(new RegExp(escapeRegExp(placeholder), 'g'), target)
  }

  if (!field) {
    return formatted
  }

  const label = localizedFieldLabels.value[field]
  const fallbackPatterns: Partial<Record<RegisterFieldName, RegExp>> = {
    tenant_code: /\bcode\b/gi,
    tenant_name: /\bname\b/gi,
  }

  const fallbackPattern = fallbackPatterns[field]
  if (fallbackPattern && !formatted.includes(label)) {
    formatted = formatted.replace(fallbackPattern, label)
  }

  return formatted
}

const applyServerErrors = (errors: unknown) => {
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) {
    return false
  }

  let hasMappedFieldError = false

  for (const [rawKey, rawValue] of Object.entries(errors as Record<string, unknown>)) {
    const field = fieldAliases[rawKey]
    if (!field) {
      continue
    }

    const messages = Array.isArray(rawValue)
      ? rawValue.filter((item): item is string => typeof item === 'string' && item.length > 0)
      : typeof rawValue === 'string' && rawValue.length > 0
        ? [rawValue]
        : []

    if (messages.length === 0) {
      continue
    }

    fieldErrors[field] = localizeServerMessage(messages[0] || '', field)
    hasMappedFieldError = true
  }

  return hasMappedFieldError
}

// Ensure tenant code is always uppercase alphanumeric
watch(() => form.tenant_code, (newVal) => {
  const cleaned = newVal
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (cleaned !== newVal) {
    form.tenant_code = cleaned
  }

  clearFieldError('tenant_code')
})

watch(locale, (newLocale) => {
  form.language = newLocale
  clearFieldError('language')
})

watch(() => form.tenant_name, () => clearFieldError('tenant_name'))
watch(() => form.name, () => clearFieldError('name'))
watch(() => form.username, () => clearFieldError('username'))
watch(() => form.email, () => clearFieldError('email'))
watch(() => form.password, () => clearFieldError('password'))

watch(() => googleTenantForm.tenant_code, (newVal) => {
  const cleaned = newVal
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (cleaned !== newVal) {
    googleTenantForm.tenant_code = cleaned
  }

  clearFieldError('tenant_code')
})

watch(() => googleTenantForm.tenant_name, () => clearFieldError('tenant_name'))
watch(() => googleTenantForm.confirm_tenant_setup, () => {
  if (googleTenantForm.confirm_tenant_setup) {
    googleErrorMessage.value = ''
  }
})

const googleSetupActive = computed(() => googleRegistrationToken.value.length > 0)
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

const submit = async () => {
  resetErrors()
  if (showPasswordMismatch.value) {
    errorMessage.value = t('auth.passwordMismatch')
    return
  }

  isLoading.value = true
  try {
    const { confirmPassword: _confirmPassword, ...payload } = form
    const response = await register(payload)
    if (!response.success) {
      const hasFieldErrors = applyServerErrors(response.errors)
      if (!hasFieldErrors || (response.message && response.message !== genericFailureMessage.value)) {
        errorMessage.value = response.message ? localizeServerMessage(response.message) : ''
      }
    }
    if (response.success) {
      await navigateTo(localePath({
        path: '/auth/check-email',
        query: {
          email: form.email,
          tenant_code: form.tenant_code,
        },
      }))
    }
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
    const response = await googleRegisterInit({ id_token: idToken })
    if (!response.success || !response.data) {
      const mappedKey = resolveGoogleAuthErrorKey(response)
      googleErrorMessage.value = mappedKey ? t(mappedKey) : t('auth.googleRegisterRetryRequired')
      return
    }

    googleRegistrationToken.value = response.data.registration_token
    googleTenantForm.tenant_name = form.tenant_name
    googleTenantForm.tenant_code = form.tenant_code
    googleTenantForm.confirm_tenant_setup = false
  } catch {
    googleErrorMessage.value = t('auth.googleRegisterFailed')
  } finally {
    isGoogleLoading.value = false
  }
}

const cancelGoogleSetup = () => {
  googleRegistrationToken.value = ''
  googleErrorMessage.value = ''
  googleTenantForm.confirm_tenant_setup = false
}

const submitGoogleRegister = async () => {
  resetGoogleErrors()
  if (!googleRegistrationToken.value) {
    googleErrorMessage.value = t('auth.googleRegistrationSessionInvalid')
    return
  }

  if (!googleTenantForm.tenant_name.trim()) {
    fieldErrors.tenant_name = t('common.requiredField', { field: t('auth.tenantName') })
    return
  }

  if (!googleTenantForm.tenant_code.trim()) {
    fieldErrors.tenant_code = t('common.requiredField', { field: t('auth.tenantCode') })
    return
  }

  if (!googleTenantForm.confirm_tenant_setup) {
    googleErrorMessage.value = t('auth.tenantSetupConfirmationRequired')
    return
  }

  isGoogleLoading.value = true
  try {
    const response = await googleRegister({
      registration_token: googleRegistrationToken.value,
      tenant_name: googleTenantForm.tenant_name.trim(),
      tenant_code: googleTenantForm.tenant_code.trim(),
      confirm_tenant_setup: true,
      language: locale.value,
    })

    if (!response.success) {
      const hasFieldErrors = applyServerErrors(response.errors)
      const mappedKey = resolveGoogleAuthErrorKey(response)
      if (mappedKey) {
        if (
          mappedKey === 'auth.googleTokenInvalid'
          || mappedKey === 'auth.googleRegistrationSessionInvalid'
        ) {
          googleRegistrationToken.value = ''
        }
        googleErrorMessage.value = t(mappedKey)
        return
      }

      if (!hasFieldErrors || (response.message && response.message !== genericFailureMessage.value)) {
        googleErrorMessage.value = response.message ? localizeServerMessage(response.message) : t('auth.googleRegisterFailed')
      }
      return
    }

    await navigateTo(localePath('/app'))
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
          v-if="googleSetupActive"
          class="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
        >
          <div class="space-y-1">
            <p class="text-sm font-semibold">
              {{ t('auth.googleTenantSetup') }}
            </p>
            <p class="text-sm leading-6 text-muted-foreground">
              {{ t('auth.googleTenantSetupDescription') }}
            </p>
          </div>
          <div class="space-y-3">
            <div class="space-y-2">
              <Label for="google-register-tenant-name">
                {{ t('auth.tenantName') }}
              </Label>
              <Input
                id="google-register-tenant-name"
                v-model="googleTenantForm.tenant_name"
                name="google_tenant_name"
                autocomplete="organization"
                :placeholder="t('auth.tenantNamePlaceholder')"
              />
              <p class="text-xs leading-5 text-muted-foreground">
                {{ t('auth.tenantNameHint') }}
              </p>
              <p
                v-if="fieldErrors.tenant_name"
                class="text-xs font-medium text-destructive dark:text-red-300"
              >
                {{ fieldErrors.tenant_name }}
              </p>
            </div>
            <div class="space-y-2">
              <Label for="google-register-tenant-code">
                {{ t('auth.tenantCode') }}
              </Label>
              <Input
                id="google-register-tenant-code"
                v-model="googleTenantForm.tenant_code"
                name="google_tenant_code"
                autocomplete="off"
                spellcheck="false"
                :placeholder="t('auth.tenantCodePlaceholder')"
                maxlength="5"
              />
              <p class="text-xs leading-5 text-muted-foreground dark:text-slate-300">
                {{ t('auth.tenantCodeRegisterHint') }}
              </p>
              <p
                v-if="fieldErrors.tenant_code"
                class="text-xs font-medium text-destructive dark:text-red-300"
              >
                {{ fieldErrors.tenant_code }}
              </p>
            </div>
          </div>
          <label class="flex items-start gap-3 rounded-md border border-border/70 bg-background/80 p-3 text-sm">
            <input
              v-model="googleTenantForm.confirm_tenant_setup"
              type="checkbox"
              class="mt-1 h-4 w-4 rounded border-border"
            >
            <span class="text-muted-foreground">
              {{ t('auth.confirmTenantSetup') }}
            </span>
          </label>
          <div
            v-if="googleErrorMessage"
            class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
          >
            {{ googleErrorMessage }}
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <Button
              class="w-full"
              :disabled="isGoogleLoading"
              @click="submitGoogleRegister"
            >
              <span
                v-if="isGoogleLoading"
                class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
              {{ isGoogleLoading ? t('auth.creatingWorkspace') : t('auth.createWorkspace') }}
            </Button>
            <Button
              variant="outline"
              class="w-full"
              :disabled="isGoogleLoading"
              @click="cancelGoogleSetup"
            >
              {{ t('common.cancel') }}
            </Button>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator class="flex-1" />
          <span>{{ t('auth.orRegisterWithEmail') }}</span>
          <Separator class="flex-1" />
        </div>
        <!-- Tenant section -->
        <div class="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {{ t('auth.organization') }}
          </p>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-2">
              <Label for="register-tenant-name">
                {{ t('auth.tenantName') }}
              </Label>
              <Input
                id="register-tenant-name"
                v-model="form.tenant_name"
                name="organization"
                autocomplete="organization"
                :placeholder="t('auth.tenantNamePlaceholder')"
              />
              <p
                v-if="fieldErrors.tenant_name"
                class="text-xs font-medium text-destructive dark:text-red-300"
              >
                {{ fieldErrors.tenant_name }}
              </p>
            </div>
            <div class="space-y-2">
              <Label for="register-tenant-code">
                {{ t('auth.tenantCode') }}
              </Label>
              <Input
                id="register-tenant-code"
                v-model="form.tenant_code"
                name="tenant_code"
                autocomplete="off"
                spellcheck="false"
                :placeholder="t('auth.tenantCodePlaceholder')"
                maxlength="5"
              />
              <p
                v-if="fieldErrors.tenant_code"
                class="text-xs font-medium text-destructive dark:text-red-300"
              >
                {{ fieldErrors.tenant_code }}
              </p>
              <p class="text-xs text-muted-foreground dark:text-slate-300">
                {{ t('auth.tenantCodeRegisterHint') }}
              </p>
            </div>
          </div>
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
