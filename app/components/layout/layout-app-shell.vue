<script setup lang="ts">
import type { Component } from 'vue'
import { Menu, X } from 'lucide-vue-next'

type LayoutNavItem = {
  label: string
  to: string
  icon: Component
}

type LayoutNavGroup = {
  title: string
  items: LayoutNavItem[]
}

defineProps<{
  appName: string
  currentLocaleBadge: string
  currentPageGroup: string
  currentPageTitle: string
  currentThemeIcon: Component
  currentThemeLabel: string
  desktopAccountMenuOpen: boolean
  isInternalRoute: boolean
  isNavItemActive: (path: string) => boolean
  isSwitchingLocale: boolean
  mobileAccountMenuOpen: boolean
  mobileNavOpen: boolean
  navGroups: LayoutNavGroup[]
  sessionActive: boolean
  userDisplayName: string
  userTenantName: string
}>()

defineEmits<{
  closeMobileNav: []
  logout: []
  openMobileNav: []
  switchLocale: []
  toggleDesktopAccountMenu: []
  toggleMobileAccountMenu: []
  toggleTheme: []
}>()

const { t } = useLocale()
</script>

<template>
  <div class="h-screen overflow-hidden">
    <div class="flex h-screen w-full items-stretch overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--background))_72%,hsl(var(--muted)/0.4))] text-foreground">
      <aside
        class="hidden h-screen w-80 shrink-0 flex-col self-stretch overflow-hidden border-r border-sidebar-border/70 bg-[linear-gradient(180deg,hsl(var(--sidebar-background))_0%,hsl(var(--sidebar-background))_62%,hsl(var(--sidebar-accent)/0.42)_100%)] text-sidebar-foreground md:flex"
      >
        <div class="border-b border-sidebar-border/70 px-5 pb-5 pt-6">
          <div class="rounded-3xl border border-sidebar-border/60 bg-sidebar-accent/50 p-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.9)]">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center overflow-hidden rounded-2xl shadow-sm ring-1 ring-sidebar-border/60">
                <img
                  src="/brand/presense-app-icon.svg"
                  :alt="`${appName} logo`"
                  class="size-full object-cover"
                >
              </div>
              <div class="grid text-sm leading-tight">
                <span class="font-semibold text-sidebar-foreground">{{ appName }}</span>
                <span class="text-xs text-sidebar-foreground/70">{{ t("layout.adminConsole") }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-4 py-4">
          <LayoutNavGroups
            :groups="navGroups"
            :is-item-active="isNavItemActive"
          />
        </div>

        <div class="border-t border-sidebar-border/70 bg-sidebar/92 px-4 pb-5 pt-4">
          <LayoutAccountMenu
            :current-locale-badge="currentLocaleBadge"
            :display-name="userDisplayName"
            :expanded="desktopAccountMenuOpen"
            :is-internal-route="isInternalRoute"
            :is-switching-locale="isSwitchingLocale"
            :session-active="sessionActive"
            :tenant-name="userTenantName"
            @logout="$emit('logout')"
            @switch-locale="$emit('switchLocale')"
            @toggle="$emit('toggleDesktopAccountMenu')"
          />
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div class="sticky top-0 z-30 border-b border-border/70 bg-background/92 backdrop-blur-xl">
          <div class="flex min-h-[76px] items-center justify-between gap-4 px-4 py-4 md:px-6">
            <div class="flex items-center gap-3">
              <Button
                class="md:hidden"
                variant="outline"
                size="icon"
                :aria-expanded="mobileNavOpen"
                aria-label="Toggle navigation"
                @click="$emit('openMobileNav')"
              >
                <Menu class="h-4 w-4" />
              </Button>
              <div class="space-y-1">
                <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {{ currentPageGroup }}
                </div>
                <div class="text-lg font-semibold tracking-tight">
                  {{ currentPageTitle }}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              class="shrink-0 rounded-2xl border-border/70 bg-background/88 px-3 shadow-sm backdrop-blur-xl"
              :aria-label="t('layout.preferences')"
              @click="$emit('toggleTheme')"
            >
              <component
                :is="currentThemeIcon"
                class="h-4 w-4"
              />
              <span class="hidden sm:inline">
                {{ currentThemeLabel }}
              </span>
            </Button>
          </div>
        </div>

        <main class="flex-1 overflow-x-hidden overflow-y-auto px-4 py-5 md:px-6 md:py-6">
          <div class="mx-auto w-full max-w-7xl">
            <slot />
          </div>
        </main>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileNavOpen"
        class="fixed inset-0 z-[90] bg-slate-950/72 backdrop-blur-[2px] md:hidden"
        @click="$emit('closeMobileNav')"
      />
    </Transition>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="mobileNavOpen"
        class="fixed inset-y-0 left-0 z-[95] flex w-[min(92vw,22rem)] max-w-sm flex-col overflow-hidden border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-[0_32px_90px_-48px_rgba(2,6,23,0.95)] md:hidden"
      >
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--sidebar-primary)/0.18),transparent_34%),linear-gradient(180deg,hsl(var(--sidebar-background))_0%,hsl(var(--sidebar-background))_58%,hsl(var(--sidebar-accent)/0.82)_100%)]" />
        <div class="relative flex h-full flex-col">
          <div class="flex items-center justify-between border-b border-sidebar-border/70 px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center overflow-hidden rounded-2xl ring-1 ring-sidebar-border/60">
                <img
                  src="/brand/presense-app-icon.svg"
                  :alt="`${appName} logo`"
                  class="size-full object-cover"
                >
              </div>
              <div class="grid text-sm leading-tight">
                <span class="font-semibold">{{ appName }}</span>
                <span class="text-xs text-sidebar-foreground/68">{{ t("layout.adminConsole") }}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              class="rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/55 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              aria-label="Close navigation"
              @click="$emit('closeMobileNav')"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>

          <div class="flex-1 overflow-y-auto px-3 py-4">
            <LayoutNavGroups
              :groups="navGroups"
              :is-item-active="isNavItemActive"
              item-key-prefix="mobile"
            />
          </div>

          <div class="border-t border-sidebar-border/70 bg-sidebar/96 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
            <LayoutAccountMenu
              :current-locale-badge="currentLocaleBadge"
              :display-name="userDisplayName"
              :expanded="mobileAccountMenuOpen"
              :is-internal-route="isInternalRoute"
              :is-switching-locale="isSwitchingLocale"
              :session-active="sessionActive"
              :tenant-name="userTenantName"
              @logout="$emit('logout')"
              @switch-locale="$emit('switchLocale')"
              @toggle="$emit('toggleMobileAccountMenu')"
            />
          </div>
        </div>
      </aside>
    </Transition>
  </div>
</template>
