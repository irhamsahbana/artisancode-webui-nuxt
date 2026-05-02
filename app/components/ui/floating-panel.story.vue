<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Button from './button.vue'
import FloatingPanel from './floating-panel.vue'
import Input from './input.vue'
import Label from './label.vue'

defineOptions({ name: 'UiFloatingPanelStory' })

const state = reactive({
  description: 'Use a side panel when the user should keep list context visible while editing details.',
  open: true,
  theme: 'light' as 'light' | 'dark',
  title: 'Edit branch notes',
})
</script>

<template>
  <Story
    title="UI/Floating Panel"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Right drawer">
      <div
        class="min-h-[40rem] rounded-3xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-950 text-slate-50' : 'bg-slate-100'"
      >
        <div class="relative mx-auto flex min-h-[34rem] max-w-6xl items-start rounded-3xl border border-dashed border-border/80 bg-background/70 p-6">
          <div class="max-w-xl space-y-4">
            <div class="text-sm font-medium text-muted-foreground">
              Branch summary
            </div>
            <div class="text-2xl font-semibold tracking-tight">
              Makassar Site
            </div>
            <p class="text-sm leading-6 text-muted-foreground">
              This canvas simulates a resource page where the drawer opens without replacing the current list or page shell.
            </p>
            <Button @click="state.open = true">
              Open panel
            </Button>
          </div>

          <FloatingPanel
            v-model:open="state.open"
            :description="state.description"
            :title="state.title"
            :teleport-to="null"
          >
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="floating-panel-owner">Owner</Label>
                <Input
                  id="floating-panel-owner"
                  model-value="Dian Kusuma"
                />
              </div>
              <div class="space-y-2">
                <Label for="floating-panel-notes">Notes</Label>
                <textarea
                  id="floating-panel-notes"
                  class="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >Needs approval before shift reassignment.</textarea>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-end gap-3">
                <Button
                  variant="outline"
                  @click="state.open = false"
                >
                  Cancel
                </Button>
                <Button>
                  Save changes
                </Button>
              </div>
            </template>
          </FloatingPanel>
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
        <HstText
          v-model="state.title"
          title="Title"
        />
        <HstText
          v-model="state.description"
          title="Description"
        />
        <HstCheckbox
          v-model="state.open"
          title="Open"
        />
      </template>
    </Variant>
  </Story>
</template>
