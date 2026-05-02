<script setup lang="ts">
import { ChevronRight, Languages, LogOut, Settings } from 'lucide-vue-next'
import { useLocale } from '~/composables/useLocale'

const props = withDefaults(defineProps<{
  currentLocaleBadge: string
  displayName: string
  expanded: boolean
  isInternalRoute: boolean
  isSwitchingLocale: boolean
  sessionActive: boolean
  settingsPath?: string
  tenantName: string
}>(), {
  settingsPath: '/app/settings/tenant',
})

defineEmits<{
  logout: []
  switchLocale: []
  toggle: []
}>()

const { t } = useLocale()
</script>

<template>
  <div
    v-if="sessionActive"
    class="relative"
  >
    <Transition
      enter-active-class="transition duration-250 ease-out"
      enter-from-class="translate-y-3 scale-95 opacity-0"
      enter-to-class="translate-y-0 scale-100 opacity-100"
      leave-active-class="transition duration-180 ease-in"
      leave-from-class="translate-y-0 scale-100 opacity-100"
      leave-to-class="translate-y-2 scale-[0.98] opacity-0"
    >
      <div
        v-if="expanded"
        class="absolute inset-x-0 bottom-full z-20 mb-2 origin-bottom rounded-[28px] border border-sidebar-border/60 bg-[linear-gradient(180deg,hsl(var(--sidebar-accent)/0.92),hsl(var(--sidebar-background)))] p-2 shadow-[0_28px_60px_-38px_rgba(2,6,23,0.98)] backdrop-blur-xl"
      >
        <div class="space-y-1.5">
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/84 transition hover:bg-sidebar hover:text-sidebar-foreground"
            :disabled="isSwitchingLocale"
            @click="$emit('switchLocale')"
          >
            <span class="flex items-center gap-3">
              <Languages class="h-4 w-4 text-sidebar-foreground/55" />
              {{ t("layout.language") }}
            </span>
            <span class="text-xs text-sidebar-foreground/55">{{ currentLocaleBadge }}</span>
          </button>
          <NuxtLink
            v-if="!props.isInternalRoute"
            :to="props.settingsPath"
            class="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/84 transition hover:bg-sidebar hover:text-sidebar-foreground"
          >
            <span class="flex items-center gap-3">
              <Settings class="h-4 w-4 text-sidebar-foreground/55" />
              {{ t("settings.tenant.title") }}
            </span>
          </NuxtLink>
          <button
            type="button"
            class="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/84 transition hover:bg-sidebar hover:text-sidebar-foreground"
            @click="$emit('logout')"
          >
            <span class="flex items-center gap-3">
              <LogOut class="h-4 w-4 text-sidebar-foreground/55" />
              {{ t("layout.logout") }}
            </span>
          </button>
        </div>
      </div>
    </Transition>

    <div class="rounded-[28px] border border-sidebar-border/60 bg-sidebar-accent/72 p-2 shadow-[0_18px_40px_-34px_rgba(2,6,23,0.95)]">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-3xl bg-sidebar/92 px-3 py-3 text-left text-sidebar-foreground transition hover:bg-sidebar"
        :aria-expanded="expanded"
        @click="$emit('toggle')"
      >
        <div class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sidebar-primary/14 text-sm font-semibold text-sidebar-primary ring-1 ring-sidebar-border/50">
          {{ displayName.slice(0, 1).toUpperCase() }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold">
            {{ displayName }}
          </div>
          <div class="truncate text-xs text-sidebar-foreground/65">
            {{ tenantName }}
          </div>
        </div>
        <ChevronRight
          class="h-4 w-4 shrink-0 text-sidebar-foreground/55 transition-transform duration-200"
          :class="{ '-rotate-90': expanded }"
        />
      </button>
    </div>
  </div>
</template>
