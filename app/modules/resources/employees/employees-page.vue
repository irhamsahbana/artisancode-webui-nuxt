<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'EmployeesPage' })

const { apiFetch } = useApi()
const { show } = useBanner()
const { locale, t } = useLocale()
const { formatDateOnly, formatReadableDateTime, normalizeDateInput } = useDateTime()
const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const appOrigin = computed(() => (import.meta.client ? window.location.origin : ''))

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

// --- List config ---
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
    format: (value: unknown) => {
      return accessStatusMeta(value)
    },
  },
  {
    key: 'join_date',
    label: 'Join Date',
    format: (value: unknown) => formatJoinDateForTable(value),
  },
]

// --- Modal state ---
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

const form = ref({
  id: '',
  employee_no: '',
  full_name: '',
  email: '',
  password: '',
  org_unit_id: '',
  job_position_id: '',
  location_id: '',
  shift_id: '',
  status: 'active',
  join_date: '',
})

const resetForm = () => {
  form.value = {
    id: '',
    employee_no: '',
    full_name: '',
    email: '',
    password: '',
    org_unit_id: '',
    job_position_id: '',
    location_id: '',
    shift_id: '',
    status: 'active',
    join_date: '',
  }
}

// --- Dropdown options ---
const orgUnits = ref<Array<{ id: string; name: string; parent_id: string | null }>>([])
const jobPositions = ref<Array<{ id: string; name: string }>>([])
const workLocations = ref<Array<{ id: string; name: string }>>([])
const workShifts = ref<Array<{ id: string; name: string }>>([])

// --- Searchable select option computeds ---
const jobPositionOptions = computed(() => jobPositions.value.map((jp) => ({ value: jp.id, label: jp.name })))
const workLocationOptions = computed(() => workLocations.value.map((wl) => ({ value: wl.id, label: wl.name })))
const workShiftOptions = computed(() => workShifts.value.map((ws) => ({ value: ws.id, label: ws.name })))
const statusOptions = computed(() => [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
])

const loadDropdowns = async () => {
  const [orgResp, jpResp, wlResp, wsResp] = await Promise.all([
    apiFetch<{ items: Array<{ id: string; name: string; parent_id: string | null }> }>('/org-units?paginate=100'),
    apiFetch<{ items: Array<{ id: string; name: string }> }>('/job-positions?paginate=100'),
    apiFetch<{ items: Array<{ id: string; name: string }> }>('/work-locations?paginate=100'),
    apiFetch<{ items: Array<{ id: string; name: string }> }>('/work-shifts?paginate=100'),
  ])
  if (orgResp.success && orgResp.data) orgUnits.value = orgResp.data.items ?? []
  if (jpResp.success && jpResp.data) jobPositions.value = jpResp.data.items ?? []
  if (wlResp.success && wlResp.data) workLocations.value = wlResp.data.items ?? []
  if (wsResp.success && wsResp.data) workShifts.value = wsResp.data.items ?? []
}

// --- Refresh trigger for ResourceList ---
const refreshKey = ref(0)
const triggerRefresh = () => {
  refreshKey.value++
}

// --- Open modal ---
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

  await loadDropdowns()

  const id = row.id as string
  const resp = await apiFetch<Record<string, unknown>>(`/employees/${id}`)
  if (resp.success && resp.data) {
    const d = resp.data
    form.value.id = String(d.id ?? '')
    form.value.employee_no = String(d.employee_no ?? '')
    form.value.full_name = String(d.full_name ?? '')
    form.value.email = String(d.email ?? '')
    form.value.password = ''
    form.value.org_unit_id = d.org_unit_id == null ? '' : String(d.org_unit_id)
    form.value.job_position_id = d.job_position_id == null ? '' : String(d.job_position_id)
    form.value.location_id = d.location_id == null ? '' : String(d.location_id)
    form.value.shift_id = d.shift_id == null ? '' : String(d.shift_id)
    form.value.status = String(d.status ?? 'active')
    form.value.join_date = normalizeJoinDateForInput(d.join_date)
  }
  modalLoading.value = false
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

// --- Submit ---
const buildPayload = () => {
  const payload: Record<string, unknown> = {
    employee_no: form.value.employee_no.trim(),
    full_name: form.value.full_name.trim(),
    email: form.value.email.trim(),
    status: form.value.status,
    join_date_timezone: browserTimezone,
  }
  if (form.value.password.trim()) payload.password = form.value.password.trim()
  if (form.value.org_unit_id) payload.org_unit_id = form.value.org_unit_id
  if (form.value.job_position_id) payload.job_position_id = form.value.job_position_id
  if (form.value.location_id) payload.location_id = form.value.location_id
  if (form.value.shift_id) payload.shift_id = form.value.shift_id
  if (form.value.join_date) payload.join_date = form.value.join_date
  return payload
}

const handleSubmit = async () => {
  if (!form.value.employee_no.trim()) {
    show(t('ui.employeeNumberIsRequired'), 'error')
    return
  }
  if (!form.value.full_name.trim()) {
    show(t('ui.fullNameIsRequired'), 'error')
    return
  }
  if (!form.value.email.trim()) {
    show(t('ui.emailIsRequired'), 'error')
    return
  }
  if (!form.value.shift_id) {
    show(t('ui.workShiftIsRequired'), 'error')
    return
  }
  if (modalMode.value === 'edit' && form.value.password.trim() && form.value.password.trim().length < 8) {
    show(t('ui.passwordMustBeAtLeast8Characters'), 'error')
    return
  }

  submitLoading.value = true

  if (modalMode.value === 'create') {
    const createdEmployee = {
      id: '',
      full_name: form.value.full_name.trim(),
      email: form.value.email.trim(),
    }

    const resp = await apiFetch<CreateEmployeeResponse>('/employees', {
      method: 'POST',
      body: buildPayload(),
    })
    if (resp.success) {
      show(t('ui.employeeCreatedSuccessfully'), 'success')
      createdEmployee.id = String(resp.data?.id ?? '')
      closeModal()
      if (createdEmployee.id) {
        openInviteModalForEmployee(createdEmployee, 'after-create')
      }
      triggerRefresh()
    }
  } else {
    const resp = await apiFetch(`/employees/${form.value.id}`, {
      method: 'PUT',
      body: buildPayload(),
    })
    if (resp.success) {
      show(t('ui.employeeUpdatedSuccessfully'), 'success')
      closeModal()
      triggerRefresh()
    }
  }

  submitLoading.value = false
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

const openManageInviteModal = async (row: Record<string, unknown>) => {
  openInviteModalForEmployee({
    id: String(row.id ?? ''),
    full_name: String(row.full_name ?? ''),
    email: String(row.email ?? ''),
  }, 'manage')
  await loadPendingInvitationSummary()
}

const handlePrimaryInviteAction = async () => {
  if (inviteSource.value === 'manage') {
    await handleResendInvitation()
    return
  }

  await handleInviteEmployee()
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
</script>

<template>
  <ResourceList
    :key="refreshKey"
    title="Employees"
    endpoint="/employees"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
    :can-view-detail="false"
  >
    <template #header-actions>
      <Button
        size="sm"
        class="rounded-xl"
        @click="openCreateModal"
      >
        {{ t('ui.addNew') }}
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        v-if="canInviteEmployee(row)"
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openInviteModal(row)"
      >
        {{ t('ui.sendAccess') }}
      </button>
      <button
        v-if="hasPendingInvitation(row)"
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openManageInviteModal(row)"
      >
        {{ t('ui.manageAccess') }}
      </button>
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ t('ui.edit') }}
      </button>
    </template>
  </ResourceList>

  <!-- Create / Edit Modal -->
  <div
    v-if="modalOpen"
  >
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="modalMode === 'create' ? t('ui.addEmployee') : t('ui.editEmployee')"
      :description="modalMode === 'create' ? '' : t('ui.keepEmployeeIdentityAssignmentAndAttendanceSetupAligned')"
      @close="closeModal"
    >
      <div
        v-if="modalLoading"
        class="text-sm text-muted-foreground"
      >
        {{ t('ui.loading2') }}
      </div>

      <form
        v-else
        class="space-y-4"
        @submit.prevent="handleSubmit"
      >
        <!-- Employee No -->
        <div>
          <Label for="emp-no">Employee No *</Label>
          <Input
            id="emp-no"
            v-model="form.employee_no"
            placeholder="e.g. EMP001"
            class="mt-1"
          />
        </div>

        <!-- Full Name -->
        <div>
          <Label for="emp-name">Full Name *</Label>
          <Input
            id="emp-name"
            v-model="form.full_name"
            placeholder="e.g. John Doe"
            class="mt-1"
          />
        </div>

        <!-- Email -->
        <div>
          <Label for="emp-email">Email *</Label>
          <Input
            id="emp-email"
            v-model="form.email"
            type="email"
            placeholder="e.g. john@example.com"
            class="mt-1"
          />
        </div>

        <div v-if="modalMode === 'edit'">
          <Label for="emp-password">
            {{ t('ui.resetPassword') }}
          </Label>
          <Input
            id="emp-password"
            v-model="form.password"
            type="password"
            :placeholder="t('ui.optionalLeaveBlankToKeepCurrentPassword')"
            class="mt-1"
          />
        </div>

        <!-- Org Unit -->
        <div>
          <Label>{{ t('ui.organizationUnit') }}</Label>
          <SearchableTreeSelect
            v-model="form.org_unit_id"
            :items="orgUnits"
            :placeholder="t('ui.notAssigned')"
            search-placeholder="Search org units..."
            class="mt-1"
          />
        </div>

        <!-- Job Position -->
        <div>
          <Label>{{ t('ui.jobPosition') }}</Label>
          <SearchableSelect
            v-model="form.job_position_id"
            :options="jobPositionOptions"
            :placeholder="t('ui.notAssigned')"
            search-placeholder="Search job positions..."
            class="mt-1"
          />
        </div>

        <!-- Work Location -->
        <div>
          <Label>{{ t('ui.workLocation') }}</Label>
          <SearchableSelect
            v-model="form.location_id"
            :options="workLocationOptions"
            :placeholder="t('ui.notAssigned')"
            search-placeholder="Search work locations..."
            class="mt-1"
          />
        </div>

        <!-- Work Shift -->
        <div>
          <Label>{{ t('ui.workShift') }} *</Label>
          <SearchableSelect
            v-model="form.shift_id"
            :options="workShiftOptions"
            :placeholder="t('ui.selectWorkShift')"
            search-placeholder="Search work shifts..."
            class="mt-1"
          />
        </div>

        <!-- Status -->
        <div>
          <Label>Status *</Label>
          <SearchableSelect
            v-model="form.status"
            :options="statusOptions"
            :placeholder="t('ui.selectStatus')"
            search-placeholder="Search status..."
            class="mt-1"
          />
        </div>

        <!-- Join Date -->
        <div>
          <Label for="emp-join">Join Date</Label>
          <Input
            id="emp-join"
            v-model="form.join_date"
            type="date"
            class="mt-1"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            @click="closeModal"
          >
            {{ t('ui.cancel') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            type="submit"
          >
            {{ submitLoading ? t('ui.saving') : (modalMode === 'create' ? t('ui.create') : t('ui.update')) }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>

  <div v-if="inviteModalOpen">
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="inviteSource === 'manage' ? t('ui.manageAccess') : t('ui.sendAccess')"
      :description="''"
      @close="closeInviteModal"
    >
      <div class="space-y-4">
        <div class="rounded-2xl border border-border/70 bg-muted/30 px-4 py-4 text-sm">
          <div class="font-medium text-foreground">
            {{ inviteEmployee?.full_name || '-' }}
          </div>
          <div class="mt-1 text-muted-foreground">
            {{ inviteEmployee?.email || '-' }}
          </div>
        </div>

        <div
          v-if="inviteSource === 'manage'"
          class="rounded-2xl border border-border/70 bg-background/90 px-4 py-4 text-sm"
        >
          <div
            v-if="inviteMetaLoading"
            class="text-muted-foreground"
          >
            {{ t('ui.loadingInvitationStatus') }}
          </div>
          <div
            v-else-if="inviteSummary"
            class="space-y-2"
          >
            <div class="font-medium text-foreground">
              {{ t('ui.invitationEmailIsPending') }}
            </div>
            <div class="text-muted-foreground">
              {{ t('ui.resendTheEmailToDeliverAFreshAccessLinkOrRevokeItIfThisEmployeeShouldNotReceiveAccessRightNow') }}
            </div>
            <div class="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>{{ t('ui.lastSentAt') }}: {{ formatInvitationDateTime(inviteSummary.last_sent_at) }}</div>
              <div>{{ t('ui.expiresAt2') }}: {{ formatInvitationDateTime(inviteSummary.expires_at) }}</div>
            </div>
          </div>
          <div
            v-else
            class="text-muted-foreground"
          >
            {{ t('ui.noActiveInvitationWasFoundForThisEmployee') }}
          </div>
        </div>

        <div
          v-if="inviteResult"
          class="space-y-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/20"
        >
          <div class="font-medium text-emerald-900 dark:text-emerald-100">
            {{ inviteEmailSent ? t('ui.invitationEmailIsOnItsWay') : t('ui.activationLinkIsReady') }}
          </div>
          <div
            v-if="inviteEmailSent"
            class="text-emerald-800 dark:text-emerald-200"
          >
            {{ t('ui.weSentTheActivationEmailToThisEmployeeTheyCanSetTheirPasswordDirectlyFromTheirInbox') }}
          </div>
          <div
            v-else
            class="text-emerald-800 dark:text-emerald-200"
          >
            {{ t('ui.emailCouldNotBeSentAutomaticallyYetUseTheBackupLinkBelowIfYouStillNeedToShareAccessManually') }}
          </div>
          <div class="text-xs text-emerald-800/80 dark:text-emerald-200/80">
            {{ t('ui.expiresAt2') }}: {{ formatInvitationDateTime(inviteResult.expires_at) }}
          </div>
          <div
            v-if="showManualInviteFallback"
            class="space-y-3"
          >
            <div class="space-y-1">
              <Label for="employee-invitation-token">{{ t('ui.invitationToken') }}</Label>
              <Input
                id="employee-invitation-token"
                :model-value="inviteResult.accept_token"
                readonly
              />
            </div>
            <div class="space-y-1">
              <Label for="employee-invitation-link">{{ t('ui.invitationLink') }}</Label>
              <Input
                id="employee-invitation-link"
                :model-value="invitationLink"
                readonly
              />
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              v-if="showManualInviteFallback"
              size="sm"
              class="rounded-xl"
              @click="copyToClipboard(invitationLink, 'ui.invitationLinkCopied')"
            >
              {{ t('ui.copyActivationLink') }}
            </Button>
            <Button
              v-if="showManualInviteFallback"
              variant="outline"
              size="sm"
              class="rounded-xl"
              @click="copyToClipboard(invitationMessage, 'ui.invitationMessageCopied')"
            >
              {{ t('ui.copyInvitationMessage') }}
            </Button>
            <Button
              v-if="showManualInviteFallback"
              variant="outline"
              size="sm"
              class="rounded-xl"
              @click="copyToClipboard(inviteResult.accept_token, 'ui.invitationTokenCopied')"
            >
              {{ t('ui.copyToken') }}
            </Button>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button
            v-if="inviteSource === 'manage' && inviteSummary"
            variant="destructive"
            size="sm"
            class="mr-auto rounded-xl"
            :disabled="inviteLoading || inviteMetaLoading"
            @click="handleRevokeInvitation"
          >
            {{ t('ui.revokeInvitation') }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="inviteLoading"
            @click="closeInviteModal"
          >
            {{ t('ui.close') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="inviteLoading || (inviteSource === 'manage' && !inviteSummary)"
            @click="handlePrimaryInviteAction"
          >
            {{ inviteLoading ? t('ui.sending') : invitePrimaryActionLabel }}
          </Button>
        </div>
      </div>
    </FormDialogShell>
  </div>
</template>
