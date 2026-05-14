<script setup lang="ts">
import type { BranchFormState } from '../branch-form'

defineOptions({ name: 'BranchManageForm' })

defineProps<{
  disabled?: boolean
  idPrefix: string
  statusOptions: Array<{ value: string; label: string }>
}>()

const form = defineModel<BranchFormState>('form', { required: true })
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <div class="grid gap-2">
      <Label :for="`${idPrefix}-name`">
        Name
      </Label>
      <Input
        :id="`${idPrefix}-name`"
        v-model="form.name"
        :disabled="disabled"
        placeholder="Branch name"
      />
    </div>
    <div class="grid gap-2">
      <Label :for="`${idPrefix}-city`">
        City
      </Label>
      <Input
        :id="`${idPrefix}-city`"
        v-model="form.city"
        :disabled="disabled"
        placeholder="City"
      />
    </div>
    <div class="grid gap-2">
      <Label :for="`${idPrefix}-capacity`">
        Capacity
      </Label>
      <Input
        :id="`${idPrefix}-capacity`"
        v-model="form.capacity"
        :disabled="disabled"
        type="number"
        min="1"
        placeholder="Capacity"
      />
    </div>
    <div class="grid gap-2">
      <Label :for="`${idPrefix}-status`">
        Status
      </Label>
      <SearchableSelect
        :id="`${idPrefix}-status`"
        v-model="form.status"
        :disabled="disabled"
        :options="statusOptions"
        placeholder="Select status"
      />
    </div>
    <div class="grid gap-2 sm:col-span-2">
      <Label :for="`${idPrefix}-description`">
        Description
      </Label>
      <Input
        :id="`${idPrefix}-description`"
        v-model="form.description"
        :disabled="disabled"
        placeholder="Description"
      />
    </div>
    <div class="grid gap-2 sm:col-span-2">
      <Label :for="`${idPrefix}-address`">
        Address
      </Label>
      <Input
        :id="`${idPrefix}-address`"
        v-model="form.address"
        :disabled="disabled"
        placeholder="Address"
      />
    </div>
    <div class="grid gap-2">
      <Label :for="`${idPrefix}-phone`">
        Phone
      </Label>
      <Input
        :id="`${idPrefix}-phone`"
        v-model="form.phone"
        :disabled="disabled"
        placeholder="Phone"
      />
    </div>
    <div class="grid gap-2">
      <Label :for="`${idPrefix}-email`">
        Email
      </Label>
      <Input
        :id="`${idPrefix}-email`"
        v-model="form.email"
        :disabled="disabled"
        type="email"
        placeholder="Email"
      />
    </div>
    <div class="grid gap-2 sm:col-span-2">
      <Label :for="`${idPrefix}-head-coach`">
        Head coach
      </Label>
      <Input
        :id="`${idPrefix}-head-coach`"
        v-model="form.headCoach"
        :disabled="disabled"
        placeholder="Head coach"
      />
    </div>
  </div>
</template>
