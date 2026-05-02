<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Button from './button.vue'
import FloatingFilterPanel from './floating-filter-panel.vue'
import Input from './input.vue'
import Label from './label.vue'
import Select from './select.vue'

defineOptions({ name: 'UiFloatingFilterPanelStory' })

const state = reactive({
  open: true,
  selectedStatus: 'all',
  theme: 'light' as 'light' | 'dark',
  widthClass: 'w-[min(1120px,calc(100vw-4rem))]',
})

const statusOptions = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
]
</script>

<template>
  <Story
    title="UI/Floating Filter Panel"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Open state">
      <div
        class="min-h-[34rem] rounded-3xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-100'"
      >
        <div class="relative mx-auto flex min-h-[28rem] max-w-6xl justify-center rounded-3xl border border-dashed border-border/80 bg-background/80 px-6 py-8">
          <div class="absolute left-1/2 top-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-full border bg-background px-4 py-2 shadow-sm">
            <div class="text-sm font-medium">
              User filters
            </div>
            <Button
              size="sm"
              variant="outline"
              @click="state.open = !state.open"
            >
              {{ state.open ? 'Hide panel' : 'Show panel' }}
            </Button>
          </div>

          <FloatingFilterPanel
            :open="state.open"
            :width-class="state.widthClass"
            @close="state.open = false"
          >
            <div class="grid gap-4 p-5 md:grid-cols-3">
              <div class="space-y-2">
                <Label for="floating-filter-search">Search</Label>
                <Input
                  id="floating-filter-search"
                  model-value="Bandung"
                />
              </div>
              <div class="space-y-2">
                <Label for="floating-filter-status">Status</Label>
                <Select
                  id="floating-filter-status"
                  :model-value="state.selectedStatus"
                  :options="statusOptions"
                />
              </div>
              <div class="space-y-2">
                <Label for="floating-filter-manager">Manager</Label>
                <Input
                  id="floating-filter-manager"
                  model-value="Nadia Putri"
                />
              </div>
            </div>
          </FloatingFilterPanel>
        </div>
      </div>

      <template #controls>
        <HstSelect
          v-model="state.theme"
          title="Theme"
          :options="[
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]"
        />
        <HstCheckbox
          v-model="state.open"
          title="Open"
        />
        <HstSelect
          v-model="state.selectedStatus"
          title="Status"
          :options="statusOptions"
        />
        <HstText
          v-model="state.widthClass"
          title="Width class"
        />
      </template>
    </Variant>
  </Story>
</template>
