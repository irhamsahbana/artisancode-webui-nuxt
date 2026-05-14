<script setup lang="ts">
defineOptions({ name: 'EmployeeAccessDialog' })

defineProps<{
  open: boolean
  loading: boolean
  metaLoading: boolean
  employee: { full_name: string; email: string } | null
  result: { accept_token: string; expires_at: string; email_sent: boolean } | null
  summary: { id: string; last_sent_at: string; expires_at: string } | null
  source: 'manual' | 'after-create' | 'manage'
  invitationLink: string
  invitationMessage: string
  inviteEmailSent: boolean
  showManualInviteFallback: boolean
  primaryActionLabel: string
  formatInvitationDateTime: (value: string | null | undefined) => string
}>()

const emit = defineEmits<{
  close: []
  copy: [value: string, successMessageKey: string]
  primaryAction: []
  revoke: []
}>()

const { t } = useLocale()
</script>

<template>
  <div v-if="open">
    <FormDialogShell
      max-width-class="max-w-lg"
      :title="source === 'manage' ? t('ui.manageAccess') : t('ui.sendAccess')"
      :description="''"
      @close="emit('close')"
    >
      <div class="space-y-4">
        <div class="rounded-2xl border border-border/70 bg-muted/30 px-4 py-4 text-sm">
          <div class="font-medium text-foreground">
            {{ employee?.full_name || '-' }}
          </div>
          <div class="mt-1 text-muted-foreground">
            {{ employee?.email || '-' }}
          </div>
        </div>

        <div
          v-if="source === 'manage'"
          class="rounded-2xl border border-border/70 bg-background/90 px-4 py-4 text-sm"
        >
          <div
            v-if="metaLoading"
            class="text-muted-foreground"
          >
            {{ t('ui.loadingInvitationStatus') }}
          </div>
          <div
            v-else-if="summary"
            class="space-y-2"
          >
            <div class="font-medium text-foreground">
              {{ t('ui.invitationEmailIsPending') }}
            </div>
            <div class="text-muted-foreground">
              {{ t('ui.resendTheEmailToDeliverAFreshAccessLinkOrRevokeItIfThisEmployeeShouldNotReceiveAccessRightNow') }}
            </div>
            <div class="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div>{{ t('ui.lastSentAt') }}: {{ formatInvitationDateTime(summary.last_sent_at) }}</div>
              <div>{{ t('ui.expiresAt2') }}: {{ formatInvitationDateTime(summary.expires_at) }}</div>
            </div>
          </div>
          <div
            v-else
            class="text-muted-foreground"
          >
            {{ t('ui.noActiveInvitationWasFoundForThisEmployee') }}
          </div>
        </div>

        <div
          v-if="result"
          class="space-y-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm dark:border-emerald-900/60 dark:bg-emerald-950/20"
        >
          <div class="font-medium text-emerald-900 dark:text-emerald-100">
            {{ inviteEmailSent ? t('ui.invitationEmailIsOnItsWay') : t('ui.activationLinkIsReady') }}
          </div>
          <div
            v-if="inviteEmailSent"
            class="text-emerald-800 dark:text-emerald-200"
          >
            {{ t('ui.weSentTheActivationEmailToThisEmployeeTheyCanSetTheirPasswordDirectlyFromTheirInbox') }}
          </div>
          <div
            v-else
            class="text-emerald-800 dark:text-emerald-200"
          >
            {{ t('ui.emailCouldNotBeSentAutomaticallyYetUseTheBackupLinkBelowIfYouStillNeedToShareAccessManually') }}
          </div>
          <div class="text-xs text-emerald-800/80 dark:text-emerald-200/80">
            {{ t('ui.expiresAt2') }}: {{ formatInvitationDateTime(result.expires_at) }}
          </div>
          <div
            v-if="showManualInviteFallback"
            class="space-y-3"
          >
            <div class="space-y-1">
              <Label for="employee-invitation-token">{{ t('ui.invitationToken') }}</Label>
              <Input
                id="employee-invitation-token"
                :model-value="result.accept_token"
                readonly
              />
            </div>
            <div class="space-y-1">
              <Label for="employee-invitation-link">{{ t('ui.invitationLink') }}</Label>
              <Input
                id="employee-invitation-link"
                :model-value="invitationLink"
                readonly
              />
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button
              v-if="showManualInviteFallback"
              size="sm"
              class="rounded-xl"
              @click="emit('copy', invitationLink, 'ui.invitationLinkCopied')"
            >
              {{ t('ui.copyActivationLink') }}
            </Button>
            <Button
              v-if="showManualInviteFallback"
              variant="outline"
              size="sm"
              class="rounded-xl"
              @click="emit('copy', invitationMessage, 'ui.invitationMessageCopied')"
            >
              {{ t('ui.copyInvitationMessage') }}
            </Button>
            <Button
              v-if="showManualInviteFallback"
              variant="outline"
              size="sm"
              class="rounded-xl"
              @click="emit('copy', result.accept_token, 'ui.invitationTokenCopied')"
            >
              {{ t('ui.copyToken') }}
            </Button>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <Button
            v-if="source === 'manage' && summary"
            variant="destructive"
            size="sm"
            class="mr-auto rounded-xl"
            :disabled="loading || metaLoading"
            @click="emit('revoke')"
          >
            {{ t('ui.revokeInvitation') }}
          </Button>
          <Button
            variant="outline"
            size="sm"
            class="rounded-xl"
            :disabled="loading"
            @click="emit('close')"
          >
            {{ t('ui.close') }}
          </Button>
          <Button
            size="sm"
            class="rounded-xl"
            :disabled="loading || (source === 'manage' && !summary)"
            @click="emit('primaryAction')"
          >
            {{ loading ? t('ui.sending') : primaryActionLabel }}
          </Button>
        </div>
      </div>
    </FormDialogShell>
  </div>
</template>
