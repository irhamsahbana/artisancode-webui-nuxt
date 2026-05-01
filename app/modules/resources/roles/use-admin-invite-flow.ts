import { computed, ref, type ComputedRef } from 'vue'
import { buildAdminInvitationLink } from './roles-format'
import type { createRolesApi } from './roles-api'
import type { InvitationResponse } from './types'

type RolesApi = ReturnType<typeof createRolesApi>

type UseAdminInviteFlowOptions = {
  appOrigin: ComputedRef<string>
  rolesApi: RolesApi
  show: (message: string, variant: 'success' | 'error') => void
  t: (key: string) => string
  formatReadableDateTime: (
    value: string | null | undefined,
    options?: Intl.DateTimeFormatOptions,
    fallback?: string,
  ) => string
}

export const useAdminInviteFlow = ({
  appOrigin,
  rolesApi,
  show,
  t,
  formatReadableDateTime,
}: UseAdminInviteFlowOptions) => {
  const open = ref(false)
  const loading = ref(false)
  const email = ref('')
  const result = ref<InvitationResponse | null>(null)

  const invitationLink = computed(() => buildAdminInvitationLink(
    appOrigin.value,
    result.value?.accept_token,
  ))

  const openDialog = () => {
    email.value = ''
    result.value = null
    open.value = true
  }

  const closeDialog = () => {
    open.value = false
    loading.value = false
    email.value = ''
    result.value = null
  }

  const formatInvitationDateTime = (value: string | null | undefined) => (
    formatReadableDateTime(value, undefined, '-')
  )

  const copyToClipboard = async (value: string, successMessageKey: string) => {
    if (!value || !import.meta.client || !navigator.clipboard) {
      show(t('ui.clipboardIsNotAvailableInThisBrowser'), 'error')
      return
    }

    await navigator.clipboard.writeText(value)
    show(t(successMessageKey), 'success')
  }

  const submit = async () => {
    const trimmedEmail = email.value.trim()
    if (!trimmedEmail) {
      show(t('ui.emailIsRequired'), 'error')
      return
    }

    loading.value = true
    let response

    try {
      response = await rolesApi.inviteAdmin(trimmedEmail)
    }
    finally {
      loading.value = false
    }

    if (!response.success || !response.data) {
      return
    }

    result.value = response.data
    show(t('ui.adminInvitationCreatedSuccessfully'), 'success')
  }

  return {
    open,
    loading,
    email,
    result,
    invitationLink,
    openDialog,
    closeDialog,
    formatInvitationDateTime,
    copyToClipboard,
    submit,
  }
}
