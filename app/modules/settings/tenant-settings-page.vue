<script setup lang="ts">
import { Building2, KeyRound, LockKeyhole, RefreshCw } from 'lucide-vue-next'
import { computed, onMounted, shallowRef } from 'vue'

defineOptions({ name: 'TenantSettingsPage' })

type TenantProfile = {
  tenant_id: string
  tenant_name: string
  tenant_code: string
  can_change_tenant_code: boolean
}

const { apiFetch } = useApi()
const { t } = useLocale()
const isLoading = shallowRef(false)
const errorMessage = shallowRef('')
const tenantProfile = shallowRef<TenantProfile | null>(null)

const tenantCodeStatus = computed(() => {
  if (!tenantProfile.value) {
    return ''
  }

  return tenantProfile.value.can_change_tenant_code
    ? t('settings.tenant.changeUnavailable')
    : t('settings.tenant.finalCode')
})

const fetchTenantProfile = async () => {
  errorMessage.value = ''
  isLoading.value = true
  try {
    const response = await apiFetch<TenantProfile>('/tenant/profile')
    if (!response.success || !response.data) {
      errorMessage.value = response.message || t('settings.tenant.loadFailed')
      return
    }

    tenantProfile.value = response.data
  } catch {
    errorMessage.value = t('settings.tenant.loadFailed')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  void fetchTenantProfile()
})
</script>

<template>
  <section class="max-w-4xl space-y-6">
    <div class="space-y-2">
      <p class="text-sm font-medium text-primary">
        {{ t('layout.preferences') }}
      </p>
      <h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">
        {{ t('settings.tenant.title') }}
      </h1>
      <p class="max-w-3xl text-sm leading-6 text-muted-foreground">
        {{ t('settings.tenant.description') }}
      </p>
    </div>

    <Card class="overflow-hidden">
      <CardHeader class="space-y-3 border-b bg-muted/25">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div class="space-y-1">
            <CardTitle>
              {{ t('settings.tenant.cardTitle') }}
            </CardTitle>
            <p class="text-sm leading-6 text-muted-foreground">
              {{ t('settings.tenant.cardDescription') }}
            </p>
          </div>
          <Badge
            variant="outline"
            class="w-fit bg-background"
          >
            {{ t('settings.tenant.readOnlyBadge') }}
          </Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-5 p-5 sm:p-6">
        <div
          v-if="isLoading"
          class="grid gap-4 sm:grid-cols-2"
        >
          <div class="h-36 rounded-lg bg-muted" />
          <div class="h-36 rounded-lg bg-muted" />
          <div class="h-24 rounded-lg bg-muted sm:col-span-2" />
        </div>

        <div
          v-else-if="tenantProfile"
          class="space-y-5"
        >
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-lg border bg-background p-4">
              <div class="mb-4 flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2
                    class="size-5"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    {{ t('settings.tenant.organizationNameLabel') }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ t('settings.tenant.organizationNameHint') }}
                  </p>
                </div>
              </div>
              <p class="break-words text-lg font-semibold">
                {{ tenantProfile.tenant_name }}
              </p>
            </div>

            <div class="rounded-lg border bg-background p-4">
              <div class="mb-4 flex items-center gap-3">
                <div class="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <KeyRound
                    class="size-5"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-muted-foreground">
                    {{ t('settings.tenant.loginCodeLabel') }}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    {{ t('settings.tenant.loginCodeHint') }}
                  </p>
                </div>
              </div>
              <p class="font-mono text-2xl font-semibold tracking-wide">
                {{ tenantProfile.tenant_code }}
              </p>
            </div>
          </div>

          <div class="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div class="flex gap-3">
              <LockKeyhole
                class="mt-0.5 size-5 shrink-0 text-primary"
                aria-hidden="true"
              />
              <div class="space-y-1">
                <p class="text-sm font-medium">
                  {{ t('settings.tenant.lockedTitle') }}
                </p>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ tenantCodeStatus }}
                </p>
                <p class="text-sm leading-6 text-muted-foreground">
                  {{ t('settings.tenant.lockedDescription') }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200"
        >
          {{ errorMessage }}
        </div>
      </CardContent>
      <CardFooter class="border-t bg-muted/20 px-5 py-4 sm:px-6">
        <Button
          variant="outline"
          :disabled="isLoading"
          @click="fetchTenantProfile"
        >
          <RefreshCw
            class="size-4"
            :class="{ 'animate-spin': isLoading }"
            aria-hidden="true"
          />
          {{ isLoading ? t('common.loading') : t('settings.tenant.refreshAction') }}
        </Button>
      </CardFooter>
    </Card>
  </section>
</template>
