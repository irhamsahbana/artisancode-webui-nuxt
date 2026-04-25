<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from '#app'
import { useApi } from '~/composables/useApi'
import { useBanner } from '~/composables/useBanner'

defineOptions({ name: 'OrgUnitDetailPage' })

const route = useRoute()
const router = useRouter()
const { apiFetch } = useApi()
const { show } = useBanner()
const { locale, text: uiText } = useLocale()
const localePath = useLocalePath()

const orgUnitId = computed(() => String(route.params.id))

const categoryOptions = ['company', 'division', 'department', 'unit']
const categoryOptionList = categoryOptions.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}))

const parentOptions = ref<{ value: string, label: string }[]>([])
const loading = ref(false)
const saveLoading = ref(false)
type OrgUnitDetail = {
  name?: string
  category?: string
  parent_id?: string | null
}
const editForm = reactive({
  name: '',
  category: 'company',
  parent_id: '',
})

const fetchParentOptions = async () => {
  const response = await apiFetch<any>('/org-units?limit=1000')

  if (response.success && response.data?.items) {
    parentOptions.value = response.data.items
      .filter((item: any) => item.id !== orgUnitId.value)
      .map((item: any) => ({
        value: item.id,
        label: item.name,
      }))
  }
}

const fetchOrgUnit = async () => {
  loading.value = true

  const response = await apiFetch<OrgUnitDetail>(`/org-units/${orgUnitId.value}`)

  if (response.success && response.data) {
    editForm.name = response.data.name ?? ''
    editForm.category = response.data.category && categoryOptions.includes(response.data.category)
      ? response.data.category
      : 'company'
    editForm.parent_id = response.data.parent_id ?? ''
  }

  loading.value = false
}

const goBack = async () => {
  await router.push(localePath('/app/resources/org-units'))
}

const saveChanges = async () => {
  const name = editForm.name.trim()

  if (!name) {
    show('Name is required.', 'error')
    return
  }

  const payload: Record<string, unknown> = {
    name,
    category: editForm.category,
    parent_id: editForm.parent_id || null,
  }

  saveLoading.value = true
  const response = await apiFetch(`/org-units/${orgUnitId.value}`, {
    method: 'PUT',
    body: payload,
  })
  saveLoading.value = false

  if (response.success) {
    show('Org Unit updated.', 'success')
  }
}

onMounted(() => {
  fetchParentOptions()
  fetchOrgUnit()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <Button
          variant="outline"
          size="sm"
          @click="goBack"
        >
          ← Back to Org Units
        </Button>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ uiText('Edit Organization Unit') }}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          v-if="loading"
          class="py-8 text-center text-muted-foreground"
        >
          {{ uiText('Loading org unit...') }}
        </div>

        <div
          v-else
          class="grid max-w-xl gap-4"
        >
          <div class="grid gap-2">
            <Label for="org-name">Name</Label>
            <Input
              id="org-name"
              v-model="editForm.name"
              placeholder="Org Unit Name"
            />
          </div>

          <div class="grid gap-2">
            <Label for="org-category">Category</Label>
            <SearchableSelect
              id="org-category"
              v-model="editForm.category"
              :options="categoryOptionList"
              placeholder="Select category"
            />
          </div>

          <div class="grid gap-2">
            <Label for="org-parent">Parent Org Unit (Optional)</Label>
            <SearchableSelect
              id="org-parent"
              v-model="editForm.parent_id"
              :options="parentOptions"
              placeholder="Select parent org unit"
            />
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          :disabled="saveLoading"
          @click="goBack"
        >
          {{ uiText('Cancel') }}
        </Button>
        <Button
          size="sm"
          :disabled="saveLoading || loading"
          @click="saveChanges"
        >
          {{ saveLoading ? uiText('Saving...') : uiText('Save Changes') }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
