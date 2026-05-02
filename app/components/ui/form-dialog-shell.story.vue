<script setup lang="ts">
import '~/assets/css/main.css'
import { reactive } from 'vue'
import Badge from './badge.vue'
import Button from './button.vue'
import FormDialogShell from './form-dialog-shell.vue'
import Input from './input.vue'
import Label from './label.vue'

defineOptions({ name: 'UiFormDialogShellStory' })

const state = reactive({
  description: 'Review the invitation details before sending access to the branch admin.',
  open: true,
  showFooter: true,
  theme: 'light' as 'light' | 'dark',
  title: 'Invite admin',
})
</script>

<template>
  <Story
    title="UI/Form Dialog Shell"
    :layout="{ type: 'single', iframe: false }"
  >
    <Variant title="Default">
      <div
        class="flex min-h-[42rem] items-center justify-center rounded-3xl p-6 transition-colors"
        :class="state.theme === 'dark' ? 'dark bg-slate-950' : 'bg-slate-100'"
      >
        <FormDialogShell
          v-if="state.open"
          :description="state.description"
          :title="state.title"
          @close="state.open = false"
        >
          <div class="space-y-5">
            <div class="flex items-center gap-3">
              <Badge>Pending review</Badge>
              <span class="text-sm text-muted-foreground">Only company admins can send invites.</span>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="dialog-admin-name">Name</Label>
                <Input
                  id="dialog-admin-name"
                  model-value="Alya Maharani"
                />
              </div>
              <div class="space-y-2">
                <Label for="dialog-admin-role">Role</Label>
                <Input
                  id="dialog-admin-role"
                  model-value="Branch supervisor"
                />
              </div>
            </div>

            <div class="space-y-2">
              <Label for="dialog-admin-email">Email</Label>
              <Input
                id="dialog-admin-email"
                model-value="alya@example.com"
              />
            </div>
          </div>

          <template
            v-if="state.showFooter"
            #footer
          >
            <div class="flex justify-end gap-3">
              <Button
                variant="outline"
                @click="state.open = false"
              >
                Cancel
              </Button>
              <Button>
                Send invite
              </Button>
            </div>
          </template>
        </FormDialogShell>

        <Button
          v-else
          @click="state.open = true"
        >
          Reopen dialog
        </Button>
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
        <HstCheckbox
          v-model="state.showFooter"
          title="Show footer"
        />
      </template>
    </Variant>
  </Story>
</template>
