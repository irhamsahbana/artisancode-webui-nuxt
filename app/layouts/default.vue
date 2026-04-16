<script setup lang="ts">
defineOptions({ name: 'DefaultLayout' })

const route = useRoute()
const isAuthPage = computed(() => route.path === '/login' || route.path === '/register')
const { locale, options: localeOptions, setLocale, t } = useLocale()

// Check if a sidebar link is active (exact match or sub-page)
const isActive = (path: string) => route.path === path || route.path.startsWith(path + '/')

const { visible, message, variant, hide } = useBanner()
const colorMode = useColorMode()

const toggleTheme = () => {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div
      v-if="visible"
      class="fixed left-1/2 top-4 z-[100] w-[90vw] max-w-2xl -translate-x-1/2 rounded-md border px-4 py-3 text-sm shadow-lg"
      :class="variant === 'error' ? 'border-destructive bg-destructive text-white' : (variant === 'success' ? 'border-primary bg-primary text-primary-foreground' : 'border-accent bg-accent text-accent-foreground')"
      role="alert"
    >
      <div class="flex items-center justify-between gap-3">
        <div class="font-medium">
          {{ message }}
        </div>
        <button
          type="button"
          class="shrink-0 rounded-md px-2 py-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
          @click="hide"
        >
          {{ t('layout.close') }}
        </button>
      </div>
    </div>
    <div
      v-if="isAuthPage"
      class="min-h-screen"
    >
      <slot />
    </div>
    <div
      v-else
      class="min-h-screen"
    >
      <div class="flex min-h-screen w-full bg-background text-foreground">
        <aside class="hidden h-svh w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
          <div class="flex items-center gap-3 px-4 py-4">
            <div class="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
              AC
            </div>
            <div class="grid text-sm leading-tight">
              <span class="font-semibold">Academy</span>
              <span class="text-xs text-muted-foreground">{{ t('layout.adminConsole') }}</span>
            </div>
          </div>
          <div class="flex-1 px-2">
            <div class="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {{ t('layout.main') }}
            </div>
            <nav class="space-y-1 text-sm">
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/') && route.path === '/' }"
                to="/"
              >
                {{ t('layout.dashboard') }}
              </NuxtLink>
            </nav>
            <div class="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {{ t('layout.resources') }}
            </div>
            <nav class="space-y-1 text-sm">
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/users') }"
                to="/resources/users"
              >
                {{ t('layout.users') }}
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/companies') }"
                to="/resources/companies"
              >
                {{ t('layout.companies') }}
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/employees') }"
                to="/resources/employees"
              >
                {{ t('layout.employees') }}
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/attendance-logs') }"
                to="/resources/attendance-logs"
              >
                {{ t('layout.attendanceLogs') }}
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/job-positions') }"
                to="/resources/job-positions"
              >
                {{ t('layout.jobPositions') }}
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/work-locations') }"
                to="/resources/work-locations"
              >
                {{ t('layout.workLocations') }}
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/work-shifts') }"
                to="/resources/work-shifts"
              >
                {{ t('layout.workShifts') }}
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/roles') }"
                to="/resources/roles"
              >
                {{ t('layout.rolesPermissions') }}
              </NuxtLink>
            </nav>
          </div>
          <div class="mt-auto border-t border-sidebar-border px-4 py-4">
            <div class="text-xs text-muted-foreground">
              {{ t('layout.signedIn') }}
            </div>
            <div class="mt-1 text-sm font-medium">
              <AuthMenu />
            </div>
          </div>
        </aside>
        <div class="flex min-h-screen flex-1 flex-col">
          <div class="border-b bg-card">
            <div class="flex h-14 items-center justify-between px-6">
              <div class="text-sm font-semibold">
                Academy
              </div>
              <div class="flex items-center gap-2">
                <select
                  :value="locale"
                  class="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  @change="setLocale(($event.target as HTMLSelectElement).value as 'id' | 'en')"
                >
                  <option
                    v-for="option in localeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  @click="toggleTheme"
                >
                  {{ colorMode.preference === 'dark' ? t('layout.themeLight') : t('layout.themeDark') }}
                </Button>
                <div class="md:hidden">
                  <AuthMenu />
                </div>
              </div>
            </div>
          </div>
          <main class="flex-1 px-6 py-6">
            <div class="mx-auto w-full max-w-7xl">
              <slot />
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>
