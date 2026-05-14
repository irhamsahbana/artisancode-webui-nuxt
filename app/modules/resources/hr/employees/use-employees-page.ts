import { computed, ref } from 'vue'
import {
  buildEmployeePayload,
  createEmptyEmployeeForm,
  syncEmployeeForm,
} from './employee-form'

type InvitationResponse = {
  id: string
  accept_token: string
  expires_at: string
  email_sent: boolean
}

type InvitationListItem = {
  id: string
  employee_id?: string | null
  email: string
  role_code: string
  status: string
  expires_at: string
  last_sent_at: string
}

type InvitationListResponse = {
  items: InvitationListItem[]
}

type CreateEmployeeResponse = {
  id: string
}

type InviteEmployeeTarget = {
  id: string
  full_name: string
  email: string
}

type OrgUnitOption = {
  id: string
  name: string
  parent_id: string | null
}

type FlatOption = {
  id: string
  name: string
}

export const useEmployeesPage = () => {
  const { apiFetch } = useApi()
  const { show } = useBanner()
  const { locale, t } = useLocale()
  const { formatDateOnly, formatReadableDateTime, normalizeDateInput } = useDateTime()
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const appOrigin = computed(() => (import.meta.client ? window.location.origin : ''))

  const formatJoinDateForTable = (value: unknown) => {
    if (value == null) {
      return '-'
    }

    const raw = String(value).trim()
    if (!raw) {
      return '-'
    }

    return formatDateOnly(raw, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }, raw)
  }

  const normalizeJoinDateForInput = (value: unknown) => {
    if (value == null) {
      return ''
    }

    const raw = String(value).trim()
    if (!raw) {
      return ''
    }

    return normalizeDateInput(raw)
  }

  const formatInvitationDateTime = (value: string | null | undefined) => (
    formatReadableDateTime(value, undefined, '-')
  )

  const accessStatusMeta = (value: unknown): { label: string; class: string } => {
    const status = String(value ?? 'no_access')
    if (status === 'active') {
      return {
        label: t('ui.accessActive'),
        class: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200',
      }
    }
    if (status === 'invited') {
      return {
        label: t('ui.invitationPending'),
        class: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200',
      }
    }

    return {
      label: t('ui.accessNotSent'),
      class: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200',
    }
  }

  const deleteLabelFormatter = (row: Record<string, unknown>) => {
    const name = row.full_name
    if (typeof name === 'string' && name.length > 0) {
      return name
    }
    return String(row.id ?? '-')
  }

  const columns = [
    { key: 'employee_no', label: 'Employee No' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Status',
      format: (value: unknown) => {
        const s = String(value ?? '')
        return s.charAt(0).toUpperCase() + s.slice(1)
      },
    },
    {
      key: 'access_status',
      label: 'Access',
      format: (value: unknown) => accessStatusMeta(value),
    },
    {
      key: 'join_date',
      label: 'Join Date',
      format: (value: unknown) => formatJoinDateForTable(value),
    },
  ]

  const modalOpen = ref(false)
  const modalMode = ref<'create' | 'edit'>('create')
  const modalLoading = ref(false)
  const submitLoading = ref(false)
  const inviteModalOpen = ref(false)
  const inviteLoading = ref(false)
  const inviteMetaLoading = ref(false)
  const inviteEmployee = ref<InviteEmployeeTarget | null>(null)
  const inviteResult = ref<InvitationResponse | null>(null)
  const inviteSummary = ref<InvitationListItem | null>(null)
  const inviteSource = ref<'manual' | 'after-create' | 'manage'>('manual')

  const form = ref(createEmptyEmployeeForm())

  const resetForm = () => {
    form.value = createEmptyEmployeeForm()
  }

  const orgUnits = ref<OrgUnitOption[]>([])
  const jobPositions = ref<FlatOption[]>([])
  const workLocations = ref<FlatOption[]>([])
  const workShifts = ref<FlatOption[]>([])

  const jobPositionOptions = computed(() => jobPositions.value.map(jp => ({ value: jp.id, label: jp.name })))
  const workLocationOptions = computed(() => workLocations.value.map(wl => ({ value: wl.id, label: wl.name })))
  const workShiftOptions = computed(() => workShifts.value.map(ws => ({ value: ws.id, label: ws.name })))
  const statusOptions = computed(() => [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ])

  const loadDropdowns = async () => {
    const [orgResp, jpResp, wlResp, wsResp] = await Promise.all([
      apiFetch<{ items: OrgUnitOption[] }>('/org-units?paginate=100'),
      apiFetch<{ items: FlatOption[] }>('/job-positions?paginate=100'),
      apiFetch<{ items: FlatOption[] }>('/work-locations?paginate=100'),
      apiFetch<{ items: FlatOption[] }>('/work-shifts?paginate=100'),
    ])

    if (orgResp.success && orgResp.data) orgUnits.value = orgResp.data.items ?? []
    if (jpResp.success && jpResp.data) jobPositions.value = jpResp.data.items ?? []
    if (wlResp.success && wlResp.data) workLocations.value = wlResp.data.items ?? []
    if (wsResp.success && wsResp.data) workShifts.value = wsResp.data.items ?? []
  }

  const refreshKey = ref(0)
  const triggerRefresh = () => {
    refreshKey.value++
  }

  const openCreateModal = async () => {
    resetForm()
    modalMode.value = 'create'
    modalOpen.value = true
    await loadDropdowns()
  }

  const openEditModal = async (row: Record<string, unknown>) => {
    resetForm()
    modalMode.value = 'edit'
    modalOpen.value = true
    modalLoading.value = true

    try {
      await loadDropdowns()

      const id = row.id as string
      const response = await apiFetch<Record<string, unknown>>(`/employees/${id}`)
      if (response.success && response.data) {
        syncEmployeeForm(form.value, response.data, normalizeJoinDateForInput)
      }
    }
    finally {
      modalLoading.value = false
    }
  }

  const closeModal = () => {
    modalOpen.value = false
    resetForm()
  }

  const openInviteModal = (row: Record<string, unknown>) => {
    inviteSource.value = 'manual'
    inviteEmployee.value = {
      id: String(row.id ?? ''),
      full_name: String(row.full_name ?? ''),
      email: String(row.email ?? ''),
    }
    inviteResult.value = null
    inviteModalOpen.value = true
  }

  const closeInviteModal = () => {
    inviteModalOpen.value = false
    inviteLoading.value = false
    inviteMetaLoading.value = false
    inviteEmployee.value = null
    inviteResult.value = null
    inviteSummary.value = null
    inviteSource.value = 'manual'
  }

  const openInviteModalForEmployee = (employee: InviteEmployeeTarget, source: 'manual' | 'after-create' | 'manage' = 'manual') => {
    inviteSource.value = source
    inviteEmployee.value = employee
    inviteResult.value = null
    inviteSummary.value = null
    inviteModalOpen.value = true
  }

  const invitationLink = computed(() => {
    if (!inviteResult.value?.accept_token || !appOrigin.value) {
      return ''
    }

    return `${appOrigin.value}/auth/invitation?token=${encodeURIComponent(inviteResult.value.accept_token)}`
  })

  const inviteEmailSent = computed(() => inviteResult.value?.email_sent === true)
  const showManualInviteFallback = computed(() => Boolean(inviteResult.value) && !inviteEmailSent.value)

  const invitationMessage = computed(() => {
    if (!inviteEmployee.value || !invitationLink.value) {
      return ''
    }

    if (locale.value === 'id') {
      return [
        `Halo ${inviteEmployee.value.full_name},`,
        '',
        'Akses login Anda sudah siap.',
        'Silakan buka link aktivasi berikut untuk membuat kata sandi dan mulai masuk ke aplikasi:',
        invitationLink.value,
      ].join('\n')
    }

    return [
      `Hello ${inviteEmployee.value.full_name},`,
      '',
      'Your login access is ready.',
      'Open the activation link below to create your password and sign in:',
      invitationLink.value,
    ].join('\n')
  })

  const canInviteEmployee = (row: Record<string, unknown>) => String(row.access_status ?? 'no_access') === 'no_access'
  const hasPendingInvitation = (row: Record<string, unknown>) => String(row.access_status ?? 'no_access') === 'invited'
  const invitePrimaryActionLabel = computed(() => {
    if (inviteSource.value === 'manage') {
      return t('ui.resendInvitationEmail')
    }

    return t('ui.sendInvitationEmail')
  })

  const copyToClipboard = async (value: string, successMessageKey: string) => {
    if (!value || !import.meta.client || !navigator.clipboard) {
      show(t('ui.clipboardIsNotAvailableInThisBrowser'), 'error')
      return
    }

    await navigator.clipboard.writeText(value)
    show(t(successMessageKey), 'success')
  }

  const validateForm = () => {
    if (!form.value.employee_no.trim()) {
      show(t('ui.employeeNumberIsRequired'), 'error')
      return false
    }
    if (!form.value.full_name.trim()) {
      show(t('ui.fullNameIsRequired'), 'error')
      return false
    }
    if (!form.value.email.trim()) {
      show(t('ui.emailIsRequired'), 'error')
      return false
    }
    if (!form.value.shift_id) {
      show(t('ui.workShiftIsRequired'), 'error')
      return false
    }
    if (modalMode.value === 'edit' && form.value.password.trim() && form.value.password.trim().length < 8) {
      show(t('ui.passwordMustBeAtLeast8Characters'), 'error')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    submitLoading.value = true

    try {
      if (modalMode.value === 'create') {
        const createdEmployee = {
          id: '',
          full_name: form.value.full_name.trim(),
          email: form.value.email.trim(),
        }

        const response = await apiFetch<CreateEmployeeResponse>('/employees', {
          method: 'POST',
          body: buildEmployeePayload(form.value, browserTimezone),
        })
        if (response.success) {
          show(t('ui.employeeCreatedSuccessfully'), 'success')
          createdEmployee.id = String(response.data?.id ?? '')
          closeModal()
          if (createdEmployee.id) {
            openInviteModalForEmployee(createdEmployee, 'after-create')
          }
          triggerRefresh()
        }
      }
      else {
        const response = await apiFetch(`/employees/${form.value.id}`, {
          method: 'PUT',
          body: buildEmployeePayload(form.value, browserTimezone),
        })
        if (response.success) {
          show(t('ui.employeeUpdatedSuccessfully'), 'success')
          closeModal()
          triggerRefresh()
        }
      }
    }
    finally {
      submitLoading.value = false
    }
  }

  const loadPendingInvitationSummary = async () => {
    if (!inviteEmployee.value?.id) {
      inviteSummary.value = null
      return
    }

    inviteMetaLoading.value = true
    const response = await apiFetch<InvitationListResponse>('/user-invitations', {
      query: {
        employee_ids: inviteEmployee.value.id,
        role_code: 'employee',
        status: 'pending',
        page: 1,
        paginate: 1,
      },
    })
    inviteMetaLoading.value = false

    if (!response.success || !response.data) {
      inviteSummary.value = null
      return
    }

    inviteSummary.value = response.data.items?.[0] ?? null
  }

  const handleInviteEmployee = async () => {
    if (!inviteEmployee.value?.id || !inviteEmployee.value.email.trim()) {
      show(t('ui.employeeInvitationRequiresAValidEmployeeEmail'), 'error')
      return
    }

    inviteLoading.value = true

    const response = await apiFetch<InvitationResponse>('/user-invitations', {
      method: 'POST',
      body: {
        employee_id: inviteEmployee.value.id,
        email: inviteEmployee.value.email.trim(),
        role_code: 'employee',
      },
    })

    inviteLoading.value = false

    if (!response.success || !response.data) {
      return
    }

    inviteResult.value = response.data
    show(
      response.data.email_sent ? t('ui.invitationEmailSentSuccessfully') : t('ui.employeeInvitationCreatedSuccessfully'),
      'success',
    )
    await loadPendingInvitationSummary()
  }

  const openManageInviteModal = async (row: Record<string, unknown>) => {
    openInviteModalForEmployee({
      id: String(row.id ?? ''),
      full_name: String(row.full_name ?? ''),
      email: String(row.email ?? ''),
    }, 'manage')
    await loadPendingInvitationSummary()
  }

  const handleResendInvitation = async () => {
    if (!inviteSummary.value?.id) {
      return
    }

    inviteLoading.value = true
    const response = await apiFetch<InvitationResponse>(`/user-invitations/${inviteSummary.value.id}/resend`, {
      method: 'POST',
    })
    inviteLoading.value = false

    if (!response.success || !response.data) {
      return
    }

    inviteResult.value = response.data
    show(
      response.data.email_sent ? t('ui.invitationEmailResentSuccessfully') : t('ui.invitationResentSuccessfully'),
      'success',
    )
    await loadPendingInvitationSummary()
    triggerRefresh()
  }

  const handlePrimaryInviteAction = async () => {
    if (inviteSource.value === 'manage') {
      await handleResendInvitation()
      return
    }

    await handleInviteEmployee()
  }

  const handleRevokeInvitation = async () => {
    if (!inviteSummary.value?.id) {
      return
    }

    inviteLoading.value = true
    const response = await apiFetch(`/user-invitations/${inviteSummary.value.id}/revoke`, {
      method: 'POST',
    })
    inviteLoading.value = false

    if (!response.success) {
      return
    }

    inviteResult.value = null
    inviteSummary.value = null
    show(t('ui.invitationRevokedSuccessfully'), 'success')
    triggerRefresh()
    closeInviteModal()
  }

  return {
    canInviteEmployee,
    closeInviteModal,
    closeModal,
    columns,
    copyToClipboard,
    deleteLabelFormatter,
    form,
    formatInvitationDateTime,
    handlePrimaryInviteAction,
    handleRevokeInvitation,
    handleSubmit,
    hasPendingInvitation,
    invitationLink,
    invitationMessage,
    inviteEmailSent,
    inviteEmployee,
    inviteLoading,
    inviteMetaLoading,
    inviteModalOpen,
    invitePrimaryActionLabel,
    inviteResult,
    inviteSource,
    inviteSummary,
    jobPositionOptions,
    modalLoading,
    modalMode,
    modalOpen,
    openCreateModal,
    openEditModal,
    openInviteModal,
    openManageInviteModal,
    orgUnits,
    refreshKey,
    showManualInviteFallback,
    statusOptions,
    submitLoading,
    workLocationOptions,
    workShiftOptions,
  }
}
