<script setup lang="ts">
import { computed, ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'EmployeesPage' })

const { apiFetch } = useApi()
const { show } = useBanner()
const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

const formatJoinDateForTable = (value: unknown) => {
  if (value == null) {
    return '-'
  }

  const raw = String(value).trim()
  if (!raw) {
    return '-'
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!dateOnlyMatch) {
    return raw
  }

  const [, year, month, day] = dateOnlyMatch
  const utcDate = new Date(`${year}-${month}-${day}T00:00:00Z`)

  try {
    return utcDate.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })
  }
  catch {
    return `${day}/${month}/${year}`
  }
}

const normalizeJoinDateForInput = (value: unknown) => {
  if (value == null) {
    return ''
  }

  const raw = String(value).trim()
  if (!raw) {
    return ''
  }

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!dateOnlyMatch) {
    return ''
  }

  return `${dateOnlyMatch[1]}-${dateOnlyMatch[2]}-${dateOnlyMatch[3]}`
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
    show('Employee number is required', 'error')
    return
  }
  if (!form.value.full_name.trim()) {
    show('Full name is required', 'error')
    return
  }
  if (!form.value.email.trim()) {
    show('Email is required', 'error')
    return
  }
  if (modalMode.value === 'create' && form.value.password.trim() && form.value.password.trim().length < 8) {
    show('Password must be at least 8 characters', 'error')
    return
  }
  if (modalMode.value === 'edit' && form.value.password.trim() && form.value.password.trim().length < 8) {
    show('Password must be at least 8 characters', 'error')
    return
  }

  submitLoading.value = true

  if (modalMode.value === 'create') {
    const resp = await apiFetch('/employees', {
      method: 'POST',
      body: buildPayload(),
    })
    if (resp.success) {
      show('Employee created successfully', 'success')
      closeModal()
      triggerRefresh()
    }
  } else {
    const resp = await apiFetch(`/employees/${form.value.id}`, {
      method: 'PUT',
      body: buildPayload(),
    })
    if (resp.success) {
      show('Employee updated successfully', 'success')
      closeModal()
      triggerRefresh()
    }
  }

  submitLoading.value = false
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
        + Add Employee
      </Button>
    </template>

    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent"
        @click="close(); openEditModal(row)"
      >
        Edit
      </button>
    </template>
  </ResourceList>

  <!-- Create / Edit Modal -->
  <div
    v-if="modalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
    @click.self="closeModal"
  >
    <div class="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ modalMode === 'create' ? 'Add Employee' : 'Edit Employee' }}
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="closeModal"
        >
          ✕
        </Button>
      </div>

      <div
        v-if="modalLoading"
        class="mt-6 text-sm text-muted-foreground"
      >
        Loading...
      </div>

      <form
        v-else
        class="mt-4 space-y-4"
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
            {{ modalMode === 'create' ? 'Password' : 'Reset Password' }}
          </Label>
          <Input
            id="emp-password"
            v-model="form.password"
            type="password"
            :placeholder="modalMode === 'create' ? 'Optional, min. 8 characters' : 'Optional, leave blank to keep current password'"
            class="mt-1"
          />
        </div>

        <!-- Org Unit -->
        <div>
          <Label>Organization Unit</Label>
          <SearchableTreeSelect
            v-model="form.org_unit_id"
            :items="orgUnits"
            placeholder="Not assigned"
            search-placeholder="Search org units..."
            class="mt-1"
          />
        </div>

        <!-- Job Position -->
        <div>
          <Label>Job Position</Label>
          <SearchableSelect
            v-model="form.job_position_id"
            :options="jobPositionOptions"
            placeholder="Not assigned"
            search-placeholder="Search job positions..."
            class="mt-1"
          />
        </div>

        <!-- Work Location -->
        <div>
          <Label>Work Location</Label>
          <SearchableSelect
            v-model="form.location_id"
            :options="workLocationOptions"
            placeholder="Not assigned"
            search-placeholder="Search work locations..."
            class="mt-1"
          />
        </div>

        <!-- Work Shift -->
        <div>
          <Label>Work Shift</Label>
          <SearchableSelect
            v-model="form.shift_id"
            :options="workShiftOptions"
            placeholder="Not assigned"
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
            placeholder="Select status"
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
            :disabled="submitLoading"
            @click="closeModal"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            :disabled="submitLoading"
            type="submit"
          >
            {{ submitLoading ? 'Saving...' : (modalMode === 'create' ? 'Create' : 'Update') }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
