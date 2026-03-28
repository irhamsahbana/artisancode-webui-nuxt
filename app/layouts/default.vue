<script setup lang="ts">
defineOptions({ name: 'DefaultLayout' })

const route = useRoute()
const isAuthPage = computed(() => route.path === '/login' || route.path === '/register')

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
          Close
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
              <span class="text-xs text-muted-foreground">Admin Console</span>
            </div>
          </div>
          <div class="flex-1 px-2">
            <div class="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Main
            </div>
            <nav class="space-y-1 text-sm">
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/') && route.path === '/' }"
                to="/"
              >
                Dashboard
              </NuxtLink>
            </nav>
            <div class="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Resources
            </div>
            <nav class="space-y-1 text-sm">
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/users') }"
                to="/resources/users"
              >
                Users
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/companies') }"
                to="/resources/companies"
              >
                Companies
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/employees') }"
                to="/resources/employees"
              >
                Employees
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/job-positions') }"
                to="/resources/job-positions"
              >
                Job Positions
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/work-locations') }"
                to="/resources/work-locations"
              >
                Work Locations
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/work-shifts') }"
                to="/resources/work-shifts"
              >
                Work Shifts
              </NuxtLink>
              <NuxtLink
                class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                :class="{ 'bg-sidebar-accent text-sidebar-accent-foreground font-medium': isActive('/resources/roles') }"
                to="/resources/roles"
              >
                Roles & Permissions
              </NuxtLink>
            </nav>
          </div>
          <div class="mt-auto border-t border-sidebar-border px-4 py-4">
            <div class="text-xs text-muted-foreground">
              Signed in
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
                <Button
                  variant="outline"
                  size="sm"
                  @click="toggleTheme"
                >
                  {{ colorMode.preference === 'dark' ? 'Light' : 'Dark' }}
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
