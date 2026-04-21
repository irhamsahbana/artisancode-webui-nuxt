<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import { localizeUiText } from '~/utils/ui-localization'

defineOptions({ name: 'EmployeesPage' })

const { apiFetch } = useApi()
const { show } = useBanner()
const { locale } = useLocale()
const { formatDateOnly, normalizeDateInput } = useDateTime()
const uiText = (value: string) => localizeUiText(locale.value, value)
const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const appOrigin = computed(() => (import.meta.client ? window.location.origin : ''))

type InvitationResponse = {
  id: string
  accept_token: string
  expires_at: string
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
const inviteEmployee = ref<{ id: string; full_name: string; email: string } | null>(null)
const inviteResult = ref<InvitationResponse | null>(null)

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
  inviteEmployee.value = null
  inviteResult.value = null
}

const invitationLink = computed(() => {
  if (!inviteResult.value?.accept_token || !appOrigin.value) {
    return ''
  }

  return `${appOrigin.value}/auth/invitation?token=${encodeURIComponent(inviteResult.value.accept_token)}`
})

const copyToClipboard = async (value: string, successMessage: string) => {
  if (!value || !import.meta.client || !navigator.clipboard) {
    show(uiText('Clipboard is not available in this browser'), 'error')
    return
  }

  await navigator.clipboard.writeText(value)
  show(uiText(successMessage), 'success')
}

const accessStatusMeta = (value: unknown): { label: string; class: string } => {
  const status = String(value ?? 'no_access')
  if (status === 'active') {
    return {
      label: uiText('Active'),
      class: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200',
    }
  }
  if (status === 'invited') {
    return {
      label: uiText('Invited'),
      class: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200',
    }
  }

  return {
    label: uiText('No Access'),
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
    show(uiText('Employee number is required'), 'error')
    return
  }
  if (!form.value.full_name.trim()) {
    show(uiText('Full name is required'), 'error')
    return
  }
  if (!form.value.email.trim()) {
    show(uiText('Email is required'), 'error')
    return
  }
  if (!form.value.shift_id) {
    show(uiText('Work shift is required'), 'error')
    return
  }
  if (modalMode.value === 'create' && form.value.password.trim() && form.value.password.trim().length < 8) {
    show(uiText('Password must be at least 8 characters'), 'error')
    return
  }
  if (modalMode.value === 'edit' && form.value.password.trim() && form.value.password.trim().length < 8) {
    show(uiText('Password must be at least 8 characters'), 'error')
    return
  }

  submitLoading.value = true

  if (modalMode.value === 'create') {
    const resp = await apiFetch('/employees', {
      method: 'POST',
      body: buildPayload(),
    })
    if (resp.success) {
      show(uiText('Employee created successfully'), 'success')
      closeModal()
      triggerRefresh()
    }
  } else {
    const resp = await apiFetch(`/employees/${form.value.id}`, {
      method: 'PUT',
      body: buildPayload(),
    })
    if (resp.success) {
      show(uiText('Employee updated successfully'), 'success')
      closeModal()
      triggerRefresh()
    }
  }

  submitLoading.value = false
}

const handleInviteEmployee = async () => {
  if (!inviteEmployee.value?.id || !inviteEmployee.value.email.trim()) {
    show(uiText('Employee invitation requires a valid employee email'), 'error')
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
  show(uiText('Employee invitation created successfully'), 'success')
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
        @click="openCreateModal"
      >
        + {{ uiText('Add Employee') }}
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openInviteModal(row)"
      >
        {{ uiText('Invite Access') }}
      </button>
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        {{ uiText('Edit') }}
      </button>
    </template>
  </ResourceList>

  <!-- Create / Edit Modal -->
  <div
    v-if="modalOpen"
  >
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="modalMode === 'create' ? uiText('Add Employee') : uiText('Edit Employee')"
      :description="uiText('Keep employee identity, assignment, and attendance setup aligned.')"
      @close="closeModal"
    >
      <div
        v-if="modalLoading"
        class="text-sm text-muted-foreground"
      >
        {{ uiText('Loading...') }}
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

        <div>
          <Label for="emp-password">
            {{ modalMode === 'create' ? uiText('Password') : uiText('Reset Password') }}
          </Label>
          <Input
            id="emp-password"
            v-model="form.password"
            type="password"
            :placeholder="modalMode === 'create' ? uiText('Optional, min. 8 characters') : uiText('Optional, leave blank to keep current password')"
            class="mt-1"
          />
        </div>

        <!-- Org Unit -->
        <div>
          <Label>{{ uiText('Organization Unit') }}</Label>
          <SearchableTreeSelect
            v-model="form.org_unit_id"
            :items="orgUnits"
            :placeholder="uiText('Not assigned')"
            search-placeholder="Search org units..."
            class="mt-1"
          />
        </div>

        <!-- Job Position -->
        <div>
          <Label>{{ uiText('Job Position') }}</Label>
          <SearchableSelect
            v-model="form.job_position_id"
            :options="jobPositionOptions"
            :placeholder="uiText('Not assigned')"
            search-placeholder="Search job positions..."
            class="mt-1"
          />
        </div>

        <!-- Work Location -->
        <div>
          <Label>{{ uiText('Work Location') }}</Label>
          <SearchableSelect
            v-model="form.location_id"
            :options="workLocationOptions"
            :placeholder="uiText('Not assigned')"
            search-placeholder="Search work locations..."
            class="mt-1"
          />
        </div>

        <!-- Work Shift -->
        <div>
          <Label>{{ uiText('Work Shift') }} *</Label>
          <SearchableSelect
            v-model="form.shift_id"
            :options="workShiftOptions"
            :placeholder="uiText('Select work shift')"
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
            :placeholder="uiText('Select status')"
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
            {{ uiText('Cancel') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="submitLoading"
            type="submit"
          >
            {{ submitLoading ? uiText('Saving...') : (modalMode === 'create' ? uiText('Create') : uiText('Update')) }}
          </Button>
        </div>
      </form>
    </FormDialogShell>
  </div>

  <div v-if="inviteModalOpen">
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="uiText('Invite Employee Access')"
      :description="uiText('Create a login invitation for this employee without opening the generic users menu.')"
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
          v-if="inviteResult"
          class="space-y-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/20"
        >
          <div class="font-medium text-emerald-900 dark:text-emerald-100">
            {{ uiText('Invitation token is ready') }}
          </div>
          <div class="text-emerald-800 dark:text-emerald-200">
            {{ uiText('Email delivery is not wired yet, so keep this token for the acceptance flow.') }}
          </div>
          <div class="space-y-1">
            <Label for="employee-invitation-token">{{ uiText('Invitation token') }}</Label>
            <Input
              id="employee-invitation-token"
              :model-value="inviteResult.accept_token"
              readonly
            />
          </div>
          <div class="space-y-1">
            <Label for="employee-invitation-link">{{ uiText('Invitation link') }}</Label>
            <Input
              id="employee-invitation-link"
              :model-value="invitationLink"
              readonly
            />
          </div>
          <div class="text-xs text-emerald-800/80 dark:text-emerald-200/80">
            {{ uiText('Expires at') }}: {{ inviteResult.expires_at }}
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              class="rounded-xl"
              @click="copyToClipboard(inviteResult.accept_token, 'Invitation token copied')"
            >
              {{ uiText('Copy token') }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              class="rounded-xl"
              @click="copyToClipboard(invitationLink, 'Invitation link copied')"
            >
              {{ uiText('Copy invitation link') }}
            </Button>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="inviteLoading"
            @click="closeInviteModal"
          >
            {{ uiText('Close') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="inviteLoading"
            @click="handleInviteEmployee"
          >
            {{ inviteLoading ? uiText('Sending...') : uiText('Create Invitation') }}
          </Button>
        </div>
      </div>
    </FormDialogShell>
  </div>
</template>
