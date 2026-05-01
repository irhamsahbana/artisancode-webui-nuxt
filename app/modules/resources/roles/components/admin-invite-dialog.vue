<script setup lang="ts">
import type { InvitationResponse } from '../types'

defineOptions({ name: 'AdminInviteDialog' })

defineProps<{
  open: boolean
  loading: boolean
  email: string
  result: InvitationResponse | null
  invitationLink: string
  formatExpiresAt: (value: string | null | undefined) => string
}>()

const emit = defineEmits<{
  close: []
  submit: []
  copy: [value: string, successMessageKey: string]
  'update:email': [value: string]
}>()

const { t } = useLocale()
</script>

<template>
  <div
    v-if="open"
    data-testid="admin-invite-dialog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
  >
    <div class="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="text-lg font-semibold">
          {{ t('ui.inviteAdminAccess') }}
        </div>
        <Button
          variant="outline"
          size="sm"
          data-testid="admin-invite-close"
          :disabled="loading"
          @click="emit('close')"
        >
          {{ t('ui.close') }}
        </Button>
      </div>
      <div class="mt-2 text-sm text-muted-foreground">
        {{ t('ui.useThisFlowForAdminAccountAccessWhileUsersStayHiddenFromTheMainProductNavigation') }}
      </div>
      <div class="mt-4 grid gap-4">
        <div class="grid gap-2">
          <Label for="admin-invite-email">{{ t('ui.adminEmail') }}</Label>
          <Input
            id="admin-invite-email"
            data-testid="admin-invite-email"
            :model-value="email"
            type="email"
            :placeholder="t('ui.eGAdminExampleCom')"
            @update:model-value="emit('update:email', String($event))"
          />
        </div>
        <div
          v-if="result"
          class="space-y-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/20"
        >
          <div class="font-medium text-emerald-900 dark:text-emerald-100">
            {{ t('ui.invitationTokenIsReady') }}
          </div>
          <div class="text-emerald-800 dark:text-emerald-200">
            {{ t('ui.emailDeliveryIsNotWiredYetSoKeepThisTokenForTheAcceptanceFlow') }}
          </div>
          <div class="space-y-1">
            <Label for="admin-invitation-token">{{ t('ui.invitationToken') }}</Label>
            <Input
              id="admin-invitation-token"
              :model-value="result.accept_token"
              readonly
            />
          </div>
          <div class="space-y-1">
            <Label for="admin-invitation-link">{{ t('ui.invitationLink') }}</Label>
            <Input
              id="admin-invitation-link"
              :model-value="invitationLink"
              readonly
            />
          </div>
          <div class="text-xs text-emerald-800/80 dark:text-emerald-200/80">
            {{ t('ui.expiresAt2') }}: {{ formatExpiresAt(result.expires_at) }}
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              data-testid="admin-copy-token"
              @click="emit('copy', result.accept_token, 'ui.invitationTokenCopied')"
            >
              {{ t('ui.copyToken') }}
            </Button>
            <Button
              variant="outline"
              size="sm"
              data-testid="admin-copy-link"
              @click="emit('copy', invitationLink, 'ui.invitationLinkCopied')"
            >
              {{ t('ui.copyInvitationLink') }}
            </Button>
          </div>
        </div>
      </div>
      <div class="mt-6 flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          data-testid="admin-invite-cancel"
          :disabled="loading"
          @click="emit('close')"
        >
          {{ t('ui.cancel') }}
        </Button>
        <Button
          size="sm"
          data-testid="admin-invite-submit"
          :disabled="loading"
          @click="emit('submit')"
        >
          {{ loading ? t('ui.sending') : t('ui.createInvitation') }}
        </Button>
      </div>
    </div>
  </div>
</template>
