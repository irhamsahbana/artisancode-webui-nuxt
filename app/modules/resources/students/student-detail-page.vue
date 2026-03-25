<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from '#app'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { z } from 'zod'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'
import type { ListResponse } from '~/types/api'

defineOptions({ name: 'StudentDetailPage' })

const deleteLabelFormatter = (row: Record<string, unknown>) => {
  const firstName = row.first_name
  const lastName = row.last_name
  if (typeof firstName === 'string' || typeof lastName === 'string') {
    return [firstName, lastName].filter((value) => typeof value === 'string' && value.length > 0).join(' ')
  }
  return String(row.id ?? '-')
}

const columns = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
]

const genderOptions = ['Male', 'Female'] as const
const bloodTypeOptions = [
  '',
  'Unknown',
  'A',
  'B',
  'AB',
  'O',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
] as const
const statusOptions = ['active', 'inactive', 'graduated', 'suspended', 'dropped', 'pending', 'on_leave'] as const
const genderOptionList = genderOptions.map((value) => ({ value, label: value }))
const statusOptionList = statusOptions.map((value) => ({ value, label: value }))
const bloodTypeOptionList = bloodTypeOptions
  .filter((value) => value !== '')
  .map((value) => ({
    value,
    label: value,
  }))
const listKey = ref(0)
const detailId = ref<string | null>(null)
const detailData = ref<Record<string, unknown> | null>(null)
const detailLoading = ref(false)
const saveLoading = ref(false)
const branchesLoading = ref(false)

type BranchItem = {
  id: string
  name?: string
  city?: string
}

type StudentFormValues = z.infer<typeof studentSchema>

const emptyValues: StudentFormValues = {
  branch_id: '',
  first_name: '',
  last_name: '',
  gender: 'Male',
  date_of_birth: '',
  birth_place: '',
  email: '',
  address: '',
  photo_url: '',
  parent_name: '',
  parent_phone: '',
  parent_email: '',
  emergency_contact_phone: '',
  blood_type: '',
  medical_notes: '',
  status: 'active',
}

const studentSchema = z.object({
  branch_id: z.string().uuid().optional().or(z.literal('')),
  first_name: z.string().min(2).max(100).optional().or(z.literal('')),
  last_name: z.string().min(2).max(100).optional().or(z.literal('')),
  gender: z.enum(genderOptions).optional().or(z.literal('')),
  date_of_birth: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), {
      message: 'Invalid date',
    }),
  birth_place: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  photo_url: z.string().optional().or(z.literal('')),
  parent_name: z.string().max(100).optional().or(z.literal('')),
  parent_phone: z.string().max(20).optional().or(z.literal('')),
  parent_email: z.string().email().optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(20).optional().or(z.literal('')),
  blood_type: z.enum(bloodTypeOptions).optional(),
  medical_notes: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(statusOptions).optional().or(z.literal('')),
})

const { handleSubmit, errors, defineField, resetForm, setValues } = useForm<StudentFormValues>({
  validationSchema: toTypedSchema(studentSchema),
  initialValues: emptyValues,
})

const [branchId, branchIdAttrs] = defineField('branch_id')
const [firstName, firstNameAttrs] = defineField('first_name')
const [lastName, lastNameAttrs] = defineField('last_name')
const [gender, genderAttrs] = defineField('gender')
const [dateOfBirth, dateOfBirthAttrs] = defineField('date_of_birth')
const [birthPlace, birthPlaceAttrs] = defineField('birth_place')
const [email, emailAttrs] = defineField('email')
const [address, addressAttrs] = defineField('address')
const [photoUrl, photoUrlAttrs] = defineField('photo_url')
const [parentName, parentNameAttrs] = defineField('parent_name')
const [parentPhone, parentPhoneAttrs] = defineField('parent_phone')
const [parentEmail, parentEmailAttrs] = defineField('parent_email')
const [emergencyContactPhone, emergencyContactPhoneAttrs] = defineField('emergency_contact_phone')
const [bloodType, bloodTypeAttrs] = defineField('blood_type')
const [medicalNotes, medicalNotesAttrs] = defineField('medical_notes')
const [status, statusAttrs] = defineField('status')

const { apiFetch } = useApi()
const { show } = useBanner()
const route = useRoute()
const branches = ref<BranchItem[]>([])

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

const formatBranchLabel = (branch: BranchItem) => {
  const name = typeof branch.name === 'string' ? branch.name : ''
  const city = typeof branch.city === 'string' ? branch.city : ''
  if (name && city) {
    return `${name} - ${city}`
  }
  if (name) {
    return name
  }
  return branch.id
}

const branchOptions = computed(() => {
  const options = branches.value.map((branch) => ({
    value: branch.id,
    label: formatBranchLabel(branch),
  }))
  const currentValue = branchId.value
  if (currentValue && !options.some((option) => option.value === currentValue)) {
    options.unshift({ value: currentValue, label: currentValue })
  }
  return options
})

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

const fillForm = (row: Record<string, unknown>) => {
  const genderValue = typeof row.gender === 'string' ? row.gender : ''
  const statusValue = typeof row.status === 'string' ? row.status : ''
  const bloodTypeValue = typeof row.blood_type === 'string' ? row.blood_type : ''
  const resolvedGender = genderOptions.includes(genderValue as (typeof genderOptions)[number])
    ? (genderValue as (typeof genderOptions)[number])
    : 'Male'
  const resolvedStatus = statusOptions.includes(statusValue as (typeof statusOptions)[number])
    ? (statusValue as (typeof statusOptions)[number])
    : 'active'
  const resolvedBloodType = bloodTypeOptions.includes(bloodTypeValue as (typeof bloodTypeOptions)[number])
    ? (bloodTypeValue as (typeof bloodTypeOptions)[number])
    : ''

  setValues({
    branch_id: typeof row.branch_id === 'string' ? row.branch_id : '',
    first_name: typeof row.first_name === 'string' ? row.first_name : '',
    last_name: typeof row.last_name === 'string' ? row.last_name : '',
    gender: resolvedGender,
    date_of_birth: toDateInput(row.date_of_birth),
    birth_place: typeof row.birth_place === 'string' ? row.birth_place : '',
    email: typeof row.email === 'string' ? row.email : '',
    address: typeof row.address === 'string' ? row.address : '',
    photo_url: typeof row.photo_url === 'string' ? row.photo_url : '',
    parent_name: typeof row.parent_name === 'string' ? row.parent_name : '',
    parent_phone: typeof row.parent_phone === 'string' ? row.parent_phone : '',
    parent_email: typeof row.parent_email === 'string' ? row.parent_email : '',
    emergency_contact_phone:
      typeof row.emergency_contact_phone === 'string' ? row.emergency_contact_phone : '',
    blood_type: resolvedBloodType,
    medical_notes: typeof row.medical_notes === 'string' ? row.medical_notes : '',
    status: resolvedStatus,
  })
}

const loadDetail = async (id: string) => {
  detailLoading.value = true
  const response = await apiFetch<Record<string, unknown>>(`/students/${id}`)
  detailLoading.value = false
  if (response.success && response.data) {
    detailData.value = response.data
    return
  }
  detailData.value = null
}

watch(
  () => route.params.id,
  (value) => {
    const idParam = typeof value === 'string' ? value : null
    detailId.value = idParam
    if (idParam) {
      loadDetail(idParam)
      return
    }
    detailData.value = null
  },
  { immediate: true },
)

watch(
  () => detailData.value,
  (value) => {
    if (!value) {
      resetForm({ values: emptyValues })
      return
    }
    fillForm(value)
  },
  { immediate: true },
)

onMounted(() => {
  loadBranches()
})

const submitUpdate = handleSubmit(async (values) => {
  if (!detailId.value) {
    return
  }
  const payload: Record<string, unknown> = {
    birth_place: values.birth_place ?? '',
    address: values.address ?? '',
    photo_url: values.photo_url ?? '',
    parent_name: values.parent_name ?? '',
    parent_phone: values.parent_phone ?? '',
    parent_email: values.parent_email ?? '',
    emergency_contact_phone: values.emergency_contact_phone ?? '',
    blood_type: values.blood_type ?? '',
    medical_notes: values.medical_notes ?? '',
  }
  const branchId = (values.branch_id ?? '').trim()
  if (branchId.length > 0) {
    payload.branch_id = branchId
  }
  const firstNameValue = (values.first_name ?? '').trim()
  if (firstNameValue.length > 0) {
    payload.first_name = firstNameValue
  }
  const lastNameValue = (values.last_name ?? '').trim()
  if (lastNameValue.length > 0) {
    payload.last_name = lastNameValue
  }
  if (genderOptions.includes(values.gender as (typeof genderOptions)[number])) {
    payload.gender = values.gender
  }
  if (values.date_of_birth) {
    payload.date_of_birth = values.date_of_birth
  }
  const emailValue = (values.email ?? '').trim()
  if (emailValue.length > 0) {
    payload.email = emailValue
  }
  if (statusOptions.includes(values.status as (typeof statusOptions)[number])) {
    payload.status = values.status
  }
  saveLoading.value = true
  const response = await apiFetch<Record<string, unknown>>(`/students/${detailId.value}`, {
    method: 'PUT',
    body: payload,
  })
  saveLoading.value = false
  if (response.success) {
    show('Student updated.', 'success')
    if (response.data) {
      detailData.value = response.data
    }
    listKey.value += 1
  }
})
</script>

<template>
  <ResourceList
    :key="listKey"
    title="Students"
    endpoint="/students"
    :columns="columns"
    loading-variant="skeleton"
    :delete-label-formatter="deleteLabelFormatter"
  >
    <template #detail="{ loading, close }">
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
        <div class="w-full max-w-4xl rounded-lg border bg-card p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="text-lg font-semibold">
              Student detail
            </div>
            <Button
              variant="outline"
              size="sm"
              :disabled="saveLoading"
              @click="close"
            >
              Close
            </Button>
          </div>
          <div class="mt-4 grid gap-4">
            <div
              v-if="loading || detailLoading"
              class="text-muted-foreground"
            >
              Loading...
            </div>
            <div
              v-else-if="!detailData"
              class="text-muted-foreground"
            >
              No detail available.
            </div>
            <div
              v-else
              class="grid gap-4 sm:grid-cols-2"
            >
              <div class="grid gap-2">
                <Label for="student-first-name">First name</Label>
                <Input
                  id="student-first-name"
                  v-model="firstName"
                  v-bind="firstNameAttrs"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.first_name"
                  class="text-xs text-destructive"
                >
                  {{ errors.first_name }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-last-name">Last name</Label>
                <Input
                  id="student-last-name"
                  v-model="lastName"
                  v-bind="lastNameAttrs"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.last_name"
                  class="text-xs text-destructive"
                >
                  {{ errors.last_name }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-email">Email</Label>
                <Input
                  id="student-email"
                  v-model="email"
                  v-bind="emailAttrs"
                  type="email"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.email"
                  class="text-xs text-destructive"
                >
                  {{ errors.email }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-branch">Branch</Label>
                <SearchableSelect
                  id="student-branch"
                  v-model="branchId"
                  v-bind="branchIdAttrs"
                  :disabled="saveLoading || branchesLoading"
                  :options="branchOptions"
                  placeholder="Select branch"
                  search-placeholder="Search branch"
                />
                <p
                  v-if="errors.branch_id"
                  class="text-xs text-destructive"
                >
                  {{ errors.branch_id }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-gender">Gender</Label>
                <SearchableSelect
                  id="student-gender"
                  v-model="gender"
                  v-bind="genderAttrs"
                  :disabled="saveLoading"
                  :options="genderOptionList"
                  placeholder="Select gender"
                  search-placeholder="Search gender"
                />
                <p
                  v-if="errors.gender"
                  class="text-xs text-destructive"
                >
                  {{ errors.gender }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-date-of-birth">Date of birth</Label>
                <Input
                  id="student-date-of-birth"
                  v-model="dateOfBirth"
                  v-bind="dateOfBirthAttrs"
                  type="date"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.date_of_birth"
                  class="text-xs text-destructive"
                >
                  {{ errors.date_of_birth }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-birth-place">Birth place</Label>
                <Input
                  id="student-birth-place"
                  v-model="birthPlace"
                  v-bind="birthPlaceAttrs"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.birth_place"
                  class="text-xs text-destructive"
                >
                  {{ errors.birth_place }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-status">Status</Label>
                <SearchableSelect
                  id="student-status"
                  v-model="status"
                  v-bind="statusAttrs"
                  :disabled="saveLoading"
                  :options="statusOptionList"
                  placeholder="Select status"
                  search-placeholder="Search status"
                />
                <p
                  v-if="errors.status"
                  class="text-xs text-destructive"
                >
                  {{ errors.status }}
                </p>
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="student-address">Address</Label>
                <Input
                  id="student-address"
                  v-model="address"
                  v-bind="addressAttrs"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.address"
                  class="text-xs text-destructive"
                >
                  {{ errors.address }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-photo">Photo URL</Label>
                <Input
                  id="student-photo"
                  v-model="photoUrl"
                  v-bind="photoUrlAttrs"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.photo_url"
                  class="text-xs text-destructive"
                >
                  {{ errors.photo_url }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-blood-type">Blood type</Label>
                <SearchableSelect
                  id="student-blood-type"
                  v-model="bloodType"
                  v-bind="bloodTypeAttrs"
                  :disabled="saveLoading"
                  :options="bloodTypeOptionList"
                  placeholder="Select blood type"
                  search-placeholder="Search blood type"
                />
                <p
                  v-if="errors.blood_type"
                  class="text-xs text-destructive"
                >
                  {{ errors.blood_type }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-parent-name">Parent name</Label>
                <Input
                  id="student-parent-name"
                  v-model="parentName"
                  v-bind="parentNameAttrs"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.parent_name"
                  class="text-xs text-destructive"
                >
                  {{ errors.parent_name }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-parent-phone">Parent phone</Label>
                <Input
                  id="student-parent-phone"
                  v-model="parentPhone"
                  v-bind="parentPhoneAttrs"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.parent_phone"
                  class="text-xs text-destructive"
                >
                  {{ errors.parent_phone }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-parent-email">Parent email</Label>
                <Input
                  id="student-parent-email"
                  v-model="parentEmail"
                  v-bind="parentEmailAttrs"
                  type="email"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.parent_email"
                  class="text-xs text-destructive"
                >
                  {{ errors.parent_email }}
                </p>
              </div>
              <div class="grid gap-2">
                <Label for="student-emergency-phone">Emergency phone</Label>
                <Input
                  id="student-emergency-phone"
                  v-model="emergencyContactPhone"
                  v-bind="emergencyContactPhoneAttrs"
                  :disabled="saveLoading"
                />
                <p
                  v-if="errors.emergency_contact_phone"
                  class="text-xs text-destructive"
                >
                  {{ errors.emergency_contact_phone }}
                </p>
              </div>
              <div class="grid gap-2 sm:col-span-2">
                <Label for="student-medical-notes">Medical notes</Label>
                <textarea
                  id="student-medical-notes"
                  v-model="medicalNotes"
                  v-bind="medicalNotesAttrs"
                  :disabled="saveLoading"
                  class="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p
                  v-if="errors.medical_notes"
                  class="text-xs text-destructive"
                >
                  {{ errors.medical_notes }}
                </p>
              </div>
            </div>
          </div>
          <div
            v-if="detailData"
            class="mt-6 flex justify-end gap-2"
          >
            <Button
              size="sm"
              :disabled="saveLoading || detailLoading"
              @click="submitUpdate"
            >
              {{ saveLoading ? 'Saving...' : 'Save changes' }}
            </Button>
          </div>
        </div>
      </div>
    </template>
  </ResourceList>
</template>
