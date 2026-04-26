<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { navigateTo } from '#app'
import { useApi } from '~/composables/useApi'

defineOptions({ name: 'InvitationPage' })

type InvitationPreview = {
  id: string
  tenant_code: string
  tenant_name: string
  employee_name?: string | null
  employee_no?: string | null
  email: string
  role_code: string
  status: string
  expires_at: string
}

type AcceptInvitationResponse = {
  user_id: string
}

const route = useRoute()
const { apiFetch } = useApi()
const { t, locale } = useLocale()
const localePath = useLocalePath()

const token = computed(() => (
  typeof route.query.token === 'string' ? route.query.token : ''
))

const preview = ref<InvitationPreview | null>(null)
const previewLoading = ref(false)
const acceptLoading = ref(false)
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const errorMessage = ref('')
const infoMessage = ref('')

const isAdminInvitation = computed(() => preview.value?.role_code === 'admin')

const loadPreview = async () => {
  errorMessage.value = ''
  infoMessage.value = ''
  preview.value = null

  if (!token.value) {
    errorMessage.value = t('auth.invitationMissingToken')
    return
  }

  previewLoading.value = true
  const response = await apiFetch<InvitationPreview>('/user-invitations/accept', {
    query: { token: token.value },
  })
  previewLoading.value = false

  if (!response.success || !response.data) {
    errorMessage.value = response.message || t('auth.invitationPreviewFailed')
    return
  }

  preview.value = response.data
  if (!isAdminInvitation.value) {
    fullName.value = response.data.employee_name ?? ''
  }
}

const submit = async () => {
  errorMessage.value = ''
  infoMessage.value = ''

  if (!token.value) {
    errorMessage.value = t('auth.invitationMissingToken')
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = t('auth.passwordMismatch')
    return
  }

  if (password.value.length < 8) {
    errorMessage.value = t('auth.passwordMin')
    return
  }

  if (isAdminInvitation.value && !fullName.value.trim()) {
    errorMessage.value = t('auth.fullNameRequired')
    return
  }

  acceptLoading.value = true
  const response = await apiFetch<AcceptInvitationResponse>('/user-invitations/accept', {
    method: 'POST',
    body: {
      token: token.value,
      password: password.value,
      full_name: fullName.value.trim() || undefined,
    },
  })
  acceptLoading.value = false

  if (!response.success) {
    errorMessage.value = response.message || t('auth.invitationAcceptFailed')
    return
  }

  infoMessage.value = t('auth.invitationAccepted')
  setTimeout(() => navigateTo(localePath({
    path: '/login',
    query: {
      email: preview.value?.email || '',
      tenant_code: preview.value?.tenant_code || '',
      notice: 'invitation-accepted',
    },
  })), 1200)
}

watch(
  () => token.value,
  () => {
    loadPreview()
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-10">
    <Card class="w-full max-w-2xl shadow-lg">
      <CardHeader class="space-y-2">
        <CardTitle class="text-2xl">
          {{ t('auth.invitationTitle') }}
        </CardTitle>
        <p class="text-sm text-muted-foreground">
          {{ t('auth.invitationDescription') }}
        </p>
      </CardHeader>
      <CardContent class="space-y-5">
        <div
          v-if="previewLoading"
          class="rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          {{ t('auth.loadingInvitation') }}
        </div>

        <div
          v-else-if="preview"
          class="grid gap-4"
        >
          <div class="grid gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
            <div>
              <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {{ t('auth.organization') }}
              </div>
              <div class="font-medium">
                {{ preview.tenant_name }}
              </div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {{ t('ui.email') }}
              </div>
              <div class="font-medium">
                {{ preview.email }}
              </div>
            </div>
            <div>
              <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {{ t('ui.roles') }}
              </div>
              <div class="font-medium">
                {{ preview.role_code }}
              </div>
            </div>
            <div v-if="preview.employee_name">
              <div class="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                {{ t('ui.employees') }}
              </div>
              <div class="font-medium">
                {{ preview.employee_name }}
                <span
                  v-if="preview.employee_no"
                  class="text-muted-foreground"
                >({{ preview.employee_no }})</span>
              </div>
            </div>
          </div>

          <div
            v-if="isAdminInvitation"
            class="space-y-2"
          >
            <Label for="invitation-full-name">{{ t('auth.fullName') }}</Label>
            <Input
              id="invitation-full-name"
              v-model="fullName"
              name="name"
              autocomplete="name"
              :placeholder="t('auth.fullName')"
            />
          </div>

          <div class="space-y-2">
            <Label for="invitation-password">{{ t('auth.password') }}</Label>
            <Input
              id="invitation-password"
              v-model="password"
              name="password"
              type="password"
              autocomplete="new-password"
              @keyup.enter="submit"
            />
          </div>

          <div class="space-y-2">
            <Label for="invitation-password-confirm">{{ t('auth.confirmPassword') }}</Label>
            <Input
              id="invitation-password-confirm"
              v-model="confirmPassword"
              name="confirm_password"
              type="password"
              autocomplete="new-password"
              @keyup.enter="submit"
            />
          </div>
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
          :disabled="acceptLoading || previewLoading || !preview"
          @click="submit"
        >
          {{ acceptLoading ? t('auth.acceptingInvitation') : t('auth.acceptInvitation') }}
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
