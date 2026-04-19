<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue'
import { navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'

defineOptions({ name: 'RegisterPage' })

const runtimeConfig = useRuntimeConfig()
const { register } = useAuth()
const { locale, options: localeOptions, setLocale, t } = useLocale()
const isLoading = ref(false)
const errorMessage = ref('')
const appName = computed(() => runtimeConfig.public.appName || 'ArtisanCode')
const registerDescription = computed(() =>
  locale.value === 'id'
    ? `Siapkan organisasi Anda di ${appName.value}`
    : `Set up your organization on ${appName.value}`,
)

const form = reactive({
  name: '',
  username: '',
  email: '',
  password: '',
  tenant_code: '',
  tenant_name: '',
  language: locale.value,
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

watch(locale, (newLocale) => {
  form.language = newLocale
})

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

const submit = async () => {
  errorMessage.value = ''
  isLoading.value = true
  try {
    const response = await register({ ...form })
    if (!response.success) {
      errorMessage.value = response.message
    }
    if (response.success) {
      await navigateTo('/')
    }
  } catch {
    errorMessage.value = t('auth.registrationFailed')
  } finally {
    isLoading.value = false
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
        <div class="space-y-2">
          <Label for="register-language">
            {{ t('common.language') }}
          </Label>
          <SearchableSelect
            id="register-language"
            :model-value="locale"
            :options="localeOptions"
            @update:model-value="setLocale(($event || 'id') as 'id' | 'en')"
          />
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
                placeholder="My Company"
              />
            </div>
            <div class="space-y-2">
              <Label for="register-tenant-code">
                {{ t('auth.tenantCode') }}
              </Label>
              <Input
                id="register-tenant-code"
                v-model="form.tenant_code"
                placeholder="MYCOMP"
                maxlength="5"
              />
              <p class="text-xs text-muted-foreground">
                {{ t('auth.tenantCodeHint') }}
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
                placeholder="John Doe"
              />
            </div>
            <div class="space-y-2">
              <Label for="register-username">
                {{ t('auth.username') }}
              </Label>
              <Input
                id="register-username"
                v-model="form.username"
                placeholder="johndoe"
              />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="register-email">
              {{ t('auth.businessEmail') }}
            </Label>
            <Input
              id="register-email"
              v-model="form.email"
              type="email"
              placeholder="you@company.com"
            />
            <p class="text-xs text-muted-foreground">
              {{ t('auth.businessEmailHint') }}
            </p>
          </div>
          <div class="space-y-2">
            <Label for="register-password">
              {{ t('auth.password') }}
            </Label>
            <Input
              id="register-password"
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              @keyup.enter="submit"
            />
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
          id="register-submit"
          class="w-full"
          :disabled="isLoading"
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
            to="/login"
            class="font-medium text-primary underline-offset-4 transition-colors hover:underline"
          >
            {{ t('auth.signIn') }}
          </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
