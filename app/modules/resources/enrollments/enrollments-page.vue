<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import type { ListResponse } from '~/types/api'

defineOptions({ name: 'EnrollmentsPage' })

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const student = row.student as { first_name?: string; last_name?: string } | undefined
  const program = row.program as { name?: string } | undefined
  const studentName = student ? [student.first_name, student.last_name].filter(Boolean).join(' ') : ''
  const programName = program?.name ?? ''
  if (studentName && programName) {
    return `${studentName} - ${programName}`
  }
  if (studentName) {
    return studentName
  }
  if (programName) {
    return programName
  }
  return String(row.id ?? '-')
}

type BranchItem = {
  id: string
  name?: string
  city?: string
}

type StudentItem = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
}

type ProgramItem = {
  id: string
  name?: string
}

type PricingItem = {
  id: string
  name?: string
  description?: string
  prices?: PricingPrice[]
}

type ProgramDetail = {
  pricings?: PricingItem[]
}

type PricingPrice = {
  currency?: string
  price?: number
  started_at?: string
  ended_at?: string | null
}

type InvoiceItem = {
  id: string
  status?: string
  payment_url?: string | null
  created_at?: string
  issued_date?: string
  due_date?: string
}

const statusOptions = ['active', 'inactive']
const billingOptions = ['one_time', 'monthly', 'quarterly', 'annually']
const statusOptionList = statusOptions.map((status) => ({
  value: status,
  label: status,
}))
const billingOptionList = billingOptions.map((option) => ({
  value: option,
  label: option,
}))
const listKey = ref(0)
const createOpen = ref(false)
const createLoading = ref(false)
const editLoading = ref(false)
const createInvoiceLoading = ref(false)
const editId = ref<string | null>(null)
const branchesLoading = ref(false)
const studentsLoading = ref(false)
const programsLoading = ref(false)
const pricingsLoading = ref(false)
const branches = ref<BranchItem[]>([])
const students = ref<StudentItem[]>([])
const programs = ref<ProgramItem[]>([])
const pricings = ref<PricingItem[]>([])
const createForm = reactive({
  branchId: null as string | null,
  studentId: null as string | null,
  programId: null as string | null,
  pricingId: null as string | null,
  currency: '',
  enrollmentDate: '',
  nextPaymentDate: '',
  status: 'active',
  billingCycle: 'monthly',
})
const editForm = reactive({
  branchId: null as string | null,
  studentId: null as string | null,
  programId: null as string | null,
  pricingId: null as string | null,
  currency: '',
  enrollmentDate: '',
  nextPaymentDate: '',
  status: 'active',
  billingCycle: 'monthly',
})

const { apiFetch } = useApi()
const { show } = useBanner()

const formatBranchLabel = (branch: BranchItem) => {
  const name = typeof branch.name === 'string' ? branch.name : ''
  const city = typeof branch.city === 'string' ? branch.city : ''
  if (name && city) {
    return `${name} - ${city}`
  }
  if (name) {
    return name
  }
  return 'Unknown branch'
}

const formatStudentLabel = (student: StudentItem) => {
  const name = [student.first_name, student.last_name].filter(Boolean).join(' ')
  if (name) {
    return name
  }
  if (student.email) {
    return student.email
  }
  return 'Unknown student'
}

const formatProgramLabel = (program: ProgramItem) => {
  if (program.name) {
    return program.name
  }
  return 'Unknown program'
}

const formatAmount = (amount: number, currency?: string) => {
  if (!Number.isFinite(amount)) {
    return ''
  }
  const resolvedCurrency = currency ? currency.toUpperCase() : undefined
  if (resolvedCurrency) {
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: resolvedCurrency,
      }).format(amount)
    } catch {
      return new Intl.NumberFormat('id-ID').format(amount)
    }
  }
  return new Intl.NumberFormat('id-ID').format(amount)
}

const activePricingCurrency = computed(() => editForm.currency.trim() || createForm.currency.trim())

const resolvePricingPrice = (pricing: PricingItem, currency?: string) => {
  const prices = Array.isArray(pricing.prices) ? pricing.prices : []
  if (currency) {
    const match = prices.find((price) => price.currency === currency)
    if (match && typeof match.price === 'number') {
      return match
    }
  }
  const fallback = prices.find((price) => typeof price.price === 'number')
  return fallback ?? null
}

const formatPricingLabel = (pricing: PricingItem) => {
  const name = pricing.name || 'Unknown pricing'
  const priceInfo = resolvePricingPrice(pricing, activePricingCurrency.value)
  if (priceInfo && typeof priceInfo.price === 'number') {
    const formatted = formatAmount(priceInfo.price, priceInfo.currency ?? activePricingCurrency.value)
    return formatted ? `${name} - ${formatted}` : name
  }
  return name
}

const formatPricingDisplay = (value: unknown, row: Record<string, unknown>) => {
  const pricing = value as PricingItem | undefined
  if (!pricing) {
    return '-'
  }
  const currency = typeof row.currency === 'string' ? row.currency : activePricingCurrency.value
  const priceInfo = resolvePricingPrice(pricing, currency)
  const name = pricing.name || 'Unknown pricing'
  if (priceInfo && typeof priceInfo.price === 'number') {
    const formatted = formatAmount(priceInfo.price, priceInfo.currency ?? currency)
    return formatted ? `${name} - ${formatted}` : name
  }
  return name
}

const columns = [
  {
    key: 'student',
    label: 'Student',
    format: (value: unknown) => {
      const student = value as { first_name?: string; last_name?: string } | undefined
      if (!student) return '-'
      return [student.first_name, student.last_name].filter(Boolean).join(' ')
    },
  },
  {
    key: 'program',
    label: 'Program',
    format: (value: unknown) => {
      const program = value as { name?: string } | undefined
      return program?.name || '-'
    },
  },
  {
    key: 'pricing',
    label: 'Pricing',
    format: (value: unknown, row: Record<string, unknown>) => formatPricingDisplay(value, row),
  },
  { key: 'status', label: 'Status' },
  { key: 'billing_cycle', label: 'Billing' },
  { key: 'currency', label: 'Currency' },
]

const branchOptions = computed(() => {
  const options = branches.value.map((branch) => ({
    value: branch.id,
    label: formatBranchLabel(branch),
  }))
  const currentValue = editForm.branchId
  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.unshift({ value: currentValue, label: 'Selected branch' })
  }
  return options
})

const studentOptions = computed(() => {
  const options = students.value.map((student) => ({
    value: student.id,
    label: formatStudentLabel(student),
  }))
  const currentValue = editForm.studentId
  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.unshift({ value: currentValue, label: 'Selected student' })
  }
  return options
})

const programOptions = computed(() => {
  const options = programs.value.map((program) => ({
    value: program.id,
    label: formatProgramLabel(program),
  }))
  const currentValue = editForm.programId
  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.unshift({ value: currentValue, label: 'Selected program' })
  }
  return options
})

const pricingOptions = computed(() => {
  const options = pricings.value.map((pricing) => ({
    value: pricing.id,
    label: formatPricingLabel(pricing),
  }))
  const currentValue = editForm.pricingId
  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.unshift({ value: currentValue, label: 'Selected pricing' })
  }
  return options
})

const toDateInput = (value: unknown) => {
  if (!value) {
    return ''
  }
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString().slice(0, 10)
}

const resetEdit = () => {
  editLoading.value = false
  createInvoiceLoading.value = false
  editId.value = null
  editForm.branchId = null
  editForm.studentId = null
  editForm.programId = null
  editForm.pricingId = null
  editForm.currency = ''
  editForm.enrollmentDate = ''
  editForm.nextPaymentDate = ''
  editForm.status = 'active'
  editForm.billingCycle = 'monthly'
}

const resetCreate = () => {
  createOpen.value = false
  createLoading.value = false
  createForm.branchId = null
  createForm.studentId = null
  createForm.programId = null
  createForm.pricingId = null
  createForm.currency = ''
  createForm.enrollmentDate = ''
  createForm.nextPaymentDate = ''
  createForm.status = 'active'
  createForm.billingCycle = 'monthly'
}

const openCreate = () => {
  createOpen.value = true
}

const loadBranches = async () => {
  branchesLoading.value = true
  const items: BranchItem[] = []
  let page = 1
  let lastPage = 1
  do {
    const response = await apiFetch<ListResponse<BranchItem>>('/branches', {
      query: { page, limit: 100 },
    })
    if (!response.success || !response.data) {
      break
    }
    items.push(...response.data.items)
    lastPage = response.data.pagination.last_page
    page += 1
  } while (page <= lastPage)
  branches.value = items
  branchesLoading.value = false
}

const loadStudents = async () => {
  studentsLoading.value = true
  const items: StudentItem[] = []
  let page = 1
  let lastPage = 1
  do {
    const response = await apiFetch<ListResponse<StudentItem>>('/students', {
      query: { page, limit: 100 },
    })
    if (!response.success || !response.data) {
      break
    }
    items.push(...response.data.items)
    lastPage = response.data.pagination.last_page
    page += 1
  } while (page <= lastPage)
  students.value = items
  studentsLoading.value = false
}

const loadPrograms = async () => {
  programsLoading.value = true
  const items: ProgramItem[] = []
  let page = 1
  let lastPage = 1
  do {
    const response = await apiFetch<ListResponse<ProgramItem>>('/programs', {
      query: { page, limit: 100 },
    })
    if (!response.success || !response.data) {
      break
    }
    items.push(...response.data.items)
    lastPage = response.data.pagination.last_page
    page += 1
  } while (page <= lastPage)
  programs.value = items
  programsLoading.value = false
}

const loadProgramPricings = async (programId: string) => {
  pricingsLoading.value = true
  const response = await apiFetch<ProgramDetail>(`/programs/${programId}`)
  pricingsLoading.value = false
  if (!response.success || !response.data) {
    pricings.value = []
    return
  }
  pricings.value = response.data.pricings ?? []
  const currentPricing = editForm.pricingId ?? createForm.pricingId
  if (currentPricing && !pricings.value.some((pricing) => pricing.id === currentPricing)) {
    if (editForm.pricingId) {
      editForm.pricingId = null
    }
    if (createForm.pricingId) {
      createForm.pricingId = null
    }
  }
}

const syncEditForm = (row: Record<string, unknown> | null) => {
  if (!row) {
    return false
  }
  const id = row.id ?? row.uuid ?? row.code
  if (id === undefined || id === null) {
    show('Edit failed: missing id.', 'error')
    return false
  }
  const idValue = String(id)
  if (editId.value === idValue) {
    return true
  }
  editId.value = idValue
  createInvoiceLoading.value = false
  editForm.branchId = typeof row.branch_id === 'string' ? row.branch_id : null
  editForm.studentId = typeof row.student_id === 'string' ? row.student_id : null
  editForm.programId = typeof row.program_id === 'string' ? row.program_id : null
  editForm.pricingId = typeof row.pricing_id === 'string' ? row.pricing_id : null
  editForm.currency = typeof row.currency === 'string' ? row.currency : ''
  editForm.enrollmentDate = toDateInput(row.enrollment_date)
  editForm.nextPaymentDate = toDateInput(row.next_billing_date ?? row.next_payment_date)
  const status = typeof row.status === 'string' ? row.status : ''
  editForm.status = statusOptions.includes(status) ? status : 'active'
  const billing = typeof row.billing_cycle === 'string' ? row.billing_cycle : ''
  editForm.billingCycle = billingOptions.includes(billing) ? billing : 'monthly'
  return true
}

watch(
  () => editForm.programId,
  (value) => {
    if (!value) {
      pricings.value = []
      editForm.pricingId = null
      return
    }
    loadProgramPricings(value)
  },
)

watch(
  () => createForm.programId,
  (value) => {
    if (!value) {
      pricings.value = []
      createForm.pricingId = null
      return
    }
    loadProgramPricings(value)
  },
)

onMounted(() => {
  loadBranches()
  loadStudents()
  loadPrograms()
})

const submitCreate = async () => {
  const studentId = (createForm.studentId ?? '').trim()
  const programId = (createForm.programId ?? '').trim()
  const pricingId = (createForm.pricingId ?? '').trim()
  const currency = createForm.currency.trim()
  if (!studentId || !programId || !pricingId || !currency || !createForm.enrollmentDate) {
    show('Student, program, pricing, currency, and enrollment date are required.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    student_id: studentId,
    program_id: programId,
    pricing_id: pricingId,
    currency,
    enrollment_date: createForm.enrollmentDate,
  }
  const branchId = (createForm.branchId ?? '').trim()
  if (branchId) {
    payload.branch_id = branchId
  }
  if (createForm.nextPaymentDate) {
    payload.next_payment_date = createForm.nextPaymentDate
  }
  if (statusOptions.includes(createForm.status)) {
    payload.status = createForm.status
  }
  if (billingOptions.includes(createForm.billingCycle)) {
    payload.billing_cycle = createForm.billingCycle
  }
  createLoading.value = true
  const response = await apiFetch('/enrollments', {
    method: 'POST',
    body: payload,
  })
  createLoading.value = false
  if (response.success) {
    show('Enrollment created.', 'success')
    resetCreate()
    listKey.value += 1
  }
}
const submitEdit = async (refreshList: () => Promise<void>, close: () => void) => {
  if (!editId.value) {
    show('Enrollment id is missing.', 'error')
    return
  }
  const payload: Record<string, unknown> = {
    currency: editForm.currency.trim(),
  }
  const branchId = (editForm.branchId ?? '').trim()
  if (branchId) {
    payload.branch_id = branchId
  }
  const studentId = (editForm.studentId ?? '').trim()
  if (studentId) {
    payload.student_id = studentId
  }
  const programId = (editForm.programId ?? '').trim()
  if (programId) {
    payload.program_id = programId
  }
  const pricingId = (editForm.pricingId ?? '').trim()
  if (pricingId) {
    payload.pricing_id = pricingId
  }
  if (editForm.enrollmentDate) {
    payload.enrollment_date = editForm.enrollmentDate
  }
  if (editForm.nextPaymentDate) {
    payload.next_payment_date = editForm.nextPaymentDate
  } else if (editForm.nextPaymentDate === '') {
    payload.next_payment_date = null
  }
  if (statusOptions.includes(editForm.status)) {
    payload.status = editForm.status
  }
  if (billingOptions.includes(editForm.billingCycle)) {
    payload.billing_cycle = editForm.billingCycle
  }
  editLoading.value = true
  const response = await apiFetch(`/enrollments/${editId.value}`, {
    method: 'PUT',
    body: payload,
  })
  editLoading.value = false
  if (response.success) {
    show('Enrollment updated.', 'success')
    await refreshList()
    resetEdit()
    close()
  }
}

const resolveRowId = (row: Record<string, unknown>) => {
  const id = row.id ?? row.uuid ?? row.code
  if (id === undefined || id === null) {
    return null
  }
  return String(id)
}

const createInvoiceForRow = async (row: Record<string, unknown>) => {
  const id = resolveRowId(row)
  if (!id) {
    show('Enrollment id is missing.', 'error')
    return
  }
  createInvoiceLoading.value = true
  const response = await apiFetch<InvoiceItem>(`/enrollments/${id}/invoices`, {
    method: 'POST',
  })
  createInvoiceLoading.value = false
  if (response.success) {
    show('Invoice ready.', 'success')
    const paymentLink = response.data?.payment_url ?? ''
    if (paymentLink && import.meta.client) {
      window.open(paymentLink, '_blank', 'noopener')
    }
  }
}

const handleCreateInvoice = (row: Record<string, unknown>, close: () => void) => {
  close()
  createInvoiceForRow(row)
}
</script>

<template>
  <ResourceList
    :key="listKey"
    title="Enrollments"
    endpoint="/enrollments"
    :columns="columns"
    :search-key="null"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #header-actions>
      <Button
        size="sm"
        @click="openCreate"
      >
        Create enrollment
      </Button>
    </template>
    <template #row-actions="{ row, close }">
      <button
        class="w-full rounded px-3 py-2 text-left hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="createInvoiceLoading"
        @click="handleCreateInvoice(row, close)"
      >
        {{ createInvoiceLoading ? 'Creating...' : 'Generate invoice' }}
      </button>
    </template>
    <template #detail="{ row, loading, close, refresh: refreshList }">
      <div
        v-if="syncEditForm(row)"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
        @click.self="close"
      >
        <div class="w-full max-w-4xl rounded-lg border bg-card p-6 shadow-lg">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="text-lg font-semibold">
              Edit enrollment
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="editLoading || loading"
                @click="close"
              >
                Close
              </Button>
            </div>
          </div>
          <div class="mt-4 grid gap-4 text-sm">
            <div
              v-if="loading"
              class="text-muted-foreground"
            >
              Loading...
            </div>
            <div
              v-else
              class="grid gap-4 sm:grid-cols-2"
            >
              <div class="grid gap-2">
                <Label for="enrollment-branch">Branch</Label>
                <SearchableSelect
                  id="enrollment-branch"
                  v-model="editForm.branchId"
                  :options="branchOptions"
                  placeholder="Select branch"
                  search-placeholder="Search branch"
                  :disabled="branchesLoading || loading"
                />
              </div>
              <div class="grid gap-2">
                <Label for="enrollment-student">Student</Label>
                <SearchableSelect
                  id="enrollment-student"
                  v-model="editForm.studentId"
                  :options="studentOptions"
                  placeholder="Select student"
                  search-placeholder="Search student"
                  :disabled="studentsLoading || loading"
                />
              </div>
              <div class="grid gap-2">
                <Label for="enrollment-program">Program</Label>
                <SearchableSelect
                  id="enrollment-program"
                  v-model="editForm.programId"
                  :options="programOptions"
                  placeholder="Select program"
                  search-placeholder="Search program"
                  :disabled="programsLoading || loading"
                />
              </div>
              <div class="grid gap-2">
                <Label for="enrollment-pricing">Pricing</Label>
                <SearchableSelect
                  id="enrollment-pricing"
                  v-model="editForm.pricingId"
                  :options="pricingOptions"
                  placeholder="Select pricing"
                  search-placeholder="Search pricing"
                  :disabled="pricingsLoading || loading || !editForm.programId"
                />
              </div>
              <div class="grid gap-2">
                <Label for="enrollment-currency">Currency</Label>
                <Input
                  id="enrollment-currency"
                  v-model="editForm.currency"
                  placeholder="Currency"
                />
              </div>
              <div class="grid gap-2">
                <Label for="enrollment-status">Status</Label>
                <SearchableSelect
                  id="enrollment-status"
                  v-model="editForm.status"
                  :options="statusOptionList"
                  placeholder="Select status"
                />
              </div>
              <div class="grid gap-2">
                <Label for="enrollment-billing">Billing cycle</Label>
                <SearchableSelect
                  id="enrollment-billing"
                  v-model="editForm.billingCycle"
                  :options="billingOptionList"
                  placeholder="Select billing"
                />
              </div>
              <div class="grid gap-2">
                <Label for="enrollment-date">Enrollment date</Label>
                <Input
                  id="enrollment-date"
                  v-model="editForm.enrollmentDate"
                  type="date"
                />
              </div>
              <div class="grid gap-2">
                <Label for="enrollment-next-payment">Next payment date</Label>
                <Input
                  id="enrollment-next-payment"
                  v-model="editForm.nextPaymentDate"
                  type="date"
                />
              </div>
            </div>
          </div>
          <div class="mt-6 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              :disabled="editLoading || loading"
              @click="close"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              :disabled="editLoading || loading"
              @click="submitEdit(refreshList, close)"
            >
              {{ editLoading ? 'Saving...' : 'Save changes' }}
            </Button>
          </div>
        </div>
      </div>
    </template>
  </ResourceList>
  <div
    v-if="createOpen"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6 py-8"
    @click.self="resetCreate"
  >
    <div class="w-full max-w-4xl rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-lg font-semibold">
          Create enrollment
        </div>
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="resetCreate"
        >
          Close
        </Button>
      </div>
      <div class="mt-4 grid gap-4 text-sm">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="grid gap-2">
            <Label for="create-enrollment-branch">Branch</Label>
            <SearchableSelect
              id="create-enrollment-branch"
              v-model="createForm.branchId"
              :options="branchOptions"
              placeholder="Select branch"
              search-placeholder="Search branch"
              :disabled="branchesLoading || createLoading"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-enrollment-student">Student</Label>
            <SearchableSelect
              id="create-enrollment-student"
              v-model="createForm.studentId"
              :options="studentOptions"
              placeholder="Select student"
              search-placeholder="Search student"
              :disabled="studentsLoading || createLoading"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-enrollment-program">Program</Label>
            <SearchableSelect
              id="create-enrollment-program"
              v-model="createForm.programId"
              :options="programOptions"
              placeholder="Select program"
              search-placeholder="Search program"
              :disabled="programsLoading || createLoading"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-enrollment-pricing">Pricing</Label>
            <SearchableSelect
              id="create-enrollment-pricing"
              v-model="createForm.pricingId"
              :options="pricingOptions"
              placeholder="Select pricing"
              search-placeholder="Search pricing"
              :disabled="pricingsLoading || createLoading || !createForm.programId"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-enrollment-currency">Currency</Label>
            <Input
              id="create-enrollment-currency"
              v-model="createForm.currency"
              placeholder="Currency"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-enrollment-status">Status</Label>
            <SearchableSelect
              id="create-enrollment-status"
              v-model="createForm.status"
              :options="statusOptionList"
              placeholder="Select status"
              :disabled="createLoading"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-enrollment-billing">Billing cycle</Label>
            <SearchableSelect
              id="create-enrollment-billing"
              v-model="createForm.billingCycle"
              :options="billingOptionList"
              placeholder="Select billing"
              :disabled="createLoading"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-enrollment-date">Enrollment date</Label>
            <Input
              id="create-enrollment-date"
              v-model="createForm.enrollmentDate"
              type="date"
            />
          </div>
          <div class="grid gap-2">
            <Label for="create-enrollment-next-payment">Next payment date</Label>
            <Input
              id="create-enrollment-next-payment"
              v-model="createForm.nextPaymentDate"
              type="date"
            />
          </div>
        </div>
      </div>
      <div class="mt-6 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="createLoading"
          @click="resetCreate"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          :disabled="createLoading"
          @click="submitCreate"
        >
          {{ createLoading ? 'Saving...' : 'Create enrollment' }}
        </Button>
      </div>
    </div>
  </div>
</template>
