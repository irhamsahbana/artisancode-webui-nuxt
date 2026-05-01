<script setup lang="ts">
import { computed, onMounted, reactive, shallowRef, watch } from 'vue'
import { Building2 } from 'lucide-vue-next'
import { navigateTo } from '#app'
import { useAuth } from '~/composables/useAuth'
import { useTenantSetupDraft } from '~/composables/useTenantSetupDraft'
import { resolveGoogleAuthErrorKey } from '~/utils/google-auth-errors'

defineOptions({ name: 'TenantSetupPage' })

type TenantSetupFieldName = 'tenant_name' | 'tenant_code'

const runtimeConfig = useRuntimeConfig()
const { googleRegister, register } = useAuth()
const { clearDraft, draft } = useTenantSetupDraft()
const { locale, t } = useLocale()
const localePath = useLocalePath()
const isLoading = shallowRef(false)
const errorMessage = shallowRef('')
const fieldErrors = reactive<Record<TenantSetupFieldName, string>>({
  tenant_name: '',
  tenant_code: '',
})
const form = reactive({
  tenant_name: '',
  tenant_code: '',
  confirm_tenant_setup: false,
})

const appName = computed(() => runtimeConfig.public.appName || 'ArtisanCode')
const setupOwnerLabel = computed(() => {
  if (!draft.value) {
    return ''
  }

  return draft.value.kind === 'google'
    ? draft.value.email || draft.value.displayName
    : draft.value.email
})

watch(() => form.tenant_code, (newValue) => {
  const cleaned = newValue
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  if (cleaned !== newValue) {
    form.tenant_code = cleaned
  }

  fieldErrors.tenant_code = ''
})

watch(() => form.tenant_name, () => {
  fieldErrors.tenant_name = ''
})

watch(() => form.confirm_tenant_setup, () => {
  if (form.confirm_tenant_setup) {
    errorMessage.value = ''
  }
})

const validate = () => {
  fieldErrors.tenant_name = ''
  fieldErrors.tenant_code = ''
  errorMessage.value = ''

  if (!form.tenant_name.trim()) {
    fieldErrors.tenant_name = t('common.requiredField', { field: t('auth.tenantName') })
  }

  if (!form.tenant_code.trim()) {
    fieldErrors.tenant_code = t('common.requiredField', { field: t('auth.tenantCode') })
  }

  if (!form.confirm_tenant_setup) {
    errorMessage.value = t('auth.tenantSetupConfirmationRequired')
  }

  return !fieldErrors.tenant_name && !fieldErrors.tenant_code && !errorMessage.value
}

const completeSetup = async () => {
  if (!draft.value) {
    await navigateTo(localePath('/register'))
    return
  }

  if (!validate()) {
    return
  }

  isLoading.value = true
  try {
    if (draft.value.kind === 'google') {
      const response = await googleRegister({
        registration_token: draft.value.registrationToken,
        tenant_name: form.tenant_name.trim(),
        tenant_code: form.tenant_code.trim(),
        confirm_tenant_setup: true,
        language: locale.value,
      })

      if (!response.success) {
        const mappedKey = resolveGoogleAuthErrorKey(response)
        errorMessage.value = mappedKey ? t(mappedKey) : response.message || t('auth.googleRegisterFailed')
        return
      }

      clearDraft()
      await navigateTo(localePath('/app'))
      return
    }

    const emailDraft = draft.value
    const tenantCode = form.tenant_code.trim()
    const response = await register({
      name: emailDraft.name,
      username: emailDraft.username,
      email: emailDraft.email,
      password: emailDraft.password,
      language: emailDraft.language,
      tenant_name: form.tenant_name.trim(),
      tenant_code: tenantCode,
    })

    if (!response.success) {
      errorMessage.value = response.message || t('auth.registrationFailed')
      return
    }

    clearDraft()
    await navigateTo(localePath({
      path: '/auth/check-email',
      query: {
        email: emailDraft.email,
        tenant_code: tenantCode,
      },
    }))
  } catch {
    errorMessage.value = draft.value?.kind === 'google'
      ? t('auth.googleRegisterFailed')
      : t('auth.registrationFailed')
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (!draft.value) {
    await navigateTo(localePath('/register'))
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-10">
    <Card class="w-full max-w-md shadow-lg">
      <CardHeader class="space-y-3 text-center">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-border/60">
          <Building2
            class="size-7"
            aria-hidden="true"
          />
        </div>
        <div class="space-y-1">
          <CardTitle class="text-2xl">
            {{ t('auth.tenantSetupTitle') }}
          </CardTitle>
          <p class="text-sm leading-6 text-muted-foreground">
            {{ t('auth.tenantSetupDescription') }}
          </p>
        </div>
      </CardHeader>
      <CardContent
        v-if="draft"
        class="space-y-4"
      >
        <div class="rounded-md border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
          {{ t('auth.tenantSetupLockedNotice') }}
        </div>
        <div
          v-if="setupOwnerLabel"
          class="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary"
        >
          {{ t('auth.tenantSetupOwner', { email: setupOwnerLabel, appName }) }}
        </div>
        <div class="space-y-2">
          <Label for="tenant-setup-name">
            {{ t('auth.tenantName') }}
          </Label>
          <Input
            id="tenant-setup-name"
            v-model="form.tenant_name"
            autocomplete="organization"
            :placeholder="t('auth.tenantNamePlaceholder')"
            @keyup.enter="completeSetup"
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
          <Label for="tenant-setup-code">
            {{ t('auth.tenantCode') }}
          </Label>
          <Input
            id="tenant-setup-code"
            v-model="form.tenant_code"
            autocomplete="off"
            spellcheck="false"
            :placeholder="t('auth.tenantCodePlaceholder')"
            maxlength="5"
            @keyup.enter="completeSetup"
          />
          <p class="text-xs leading-5 text-muted-foreground">
            {{ t('auth.tenantCodeRegisterHint') }}
          </p>
          <p
            v-if="fieldErrors.tenant_code"
            class="text-xs font-medium text-destructive dark:text-red-300"
          >
            {{ fieldErrors.tenant_code }}
          </p>
        </div>
        <label class="flex items-start gap-3 rounded-md border border-border/70 bg-background/80 p-3 text-sm">
          <input
            v-model="form.confirm_tenant_setup"
            type="checkbox"
            class="mt-1 h-4 w-4 rounded border-border"
          >
          <span class="text-muted-foreground">
            {{ t('auth.confirmTenantSetup') }}
          </span>
        </label>
        <div
          v-if="errorMessage"
          class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
      <CardFooter
        v-if="draft"
        class="flex-col gap-3"
      >
        <Button
          class="w-full"
          :disabled="isLoading"
          @click="completeSetup"
        >
          <span
            v-if="isLoading"
            class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
          {{ isLoading ? t('auth.creatingWorkspace') : t('auth.createWorkspace') }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
