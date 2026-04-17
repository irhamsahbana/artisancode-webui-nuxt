<script setup lang="ts">
defineOptions({ name: "DefaultLayout" });

const route = useRoute();
const isAuthPage = computed(
  () => route.path === "/login" || route.path === "/register"
);
const { locale, options: localeOptions, setLocale, t } = useLocale();
const mobileNavOpen = ref(false);

const navGroups = computed(() => [
  {
    title: t("layout.main"),
    items: [{ label: t("layout.dashboard"), to: "/" }],
  },
  {
    title: t("layout.resources"),
    items: [
      { label: t("layout.users"), to: "/resources/users" },
      { label: t("layout.companies"), to: "/resources/companies" },
      { label: t("layout.employees"), to: "/resources/employees" },
      { label: t("layout.attendanceLogs"), to: "/resources/attendance-logs" },
      { label: t("layout.jobPositions"), to: "/resources/job-positions" },
      { label: t("layout.workLocations"), to: "/resources/work-locations" },
      { label: t("layout.workShifts"), to: "/resources/work-shifts" },
      { label: t("layout.rolesPermissions"), to: "/resources/roles" },
    ],
  },
]);

// Check if a sidebar link is active (exact match or sub-page)
const isActive = (path: string) =>
  route.path === path || route.path.startsWith(path + "/");

const { visible, message, variant, hide } = useBanner();
const colorMode = useColorMode();

const toggleTheme = () => {
  colorMode.preference = colorMode.preference === "dark" ? "light" : "dark";
};

watch(
  () => route.fullPath,
  () => {
    mobileNavOpen.value = false;
  }
);
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <div
      v-if="visible"
      class="fixed left-1/2 top-4 z-[100] w-[90vw] max-w-2xl -translate-x-1/2 rounded-md border px-4 py-3 text-sm shadow-lg"
      :class="
        variant === 'error'
          ? 'border-destructive bg-destructive text-white'
          : variant === 'success'
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-accent bg-accent text-accent-foreground'
      "
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
          {{ t("layout.close") }}
        </button>
      </div>
    </div>
    <div v-if="isAuthPage" class="min-h-screen">
      <slot />
    </div>
    <div v-else class="min-h-screen">
      <div class="flex min-h-screen w-full bg-background text-foreground">
        <aside
          class="hidden h-svh w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex"
        >
          <div class="flex items-center gap-3 px-4 py-4">
            <div
              class="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground"
            >
              AC
            </div>
            <div class="grid text-sm leading-tight">
              <span class="font-semibold">Academy</span>
              <span class="text-xs text-muted-foreground">{{
                t("layout.adminConsole")
              }}</span>
            </div>
          </div>
          <div class="flex-1 px-2">
            <section v-for="group in navGroups" :key="group.title">
              <div
                class="px-3 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {{ group.title }}
              </div>
              <nav class="space-y-1 text-sm">
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.to"
                  class="flex items-center rounded-md px-3 py-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  :class="{
                    'bg-sidebar-accent text-sidebar-accent-foreground font-medium':
                      isActive(item.to) &&
                      (item.to !== '/' || route.path === '/'),
                  }"
                  :to="item.to"
                >
                  {{ item.label }}
                </NuxtLink>
              </nav>
            </section>
          </div>
          <div class="mt-auto border-t border-sidebar-border px-4 py-4">
            <div class="text-xs text-muted-foreground">
              {{ t("layout.signedIn") }}
            </div>
            <div class="mt-1 text-sm font-medium">
              <AuthMenu />
            </div>
          </div>
        </aside>
        <div class="flex min-h-screen flex-1 flex-col">
          <div class="border-b bg-card">
            <div
              class="flex min-h-14 items-center justify-between gap-3 px-4 py-3 md:px-6"
            >
              <div class="flex items-center gap-3">
                <Button
                  class="md:hidden"
                  variant="outline"
                  size="icon"
                  :aria-expanded="mobileNavOpen"
                  aria-label="Toggle navigation"
                  @click="mobileNavOpen = true"
                >
                  <span class="text-lg leading-none">☰</span>
                </Button>
                <div>
                  <div class="text-sm font-semibold">Academy</div>
                  <div class="text-xs text-muted-foreground md:hidden">
                    {{
                      route.path === "/"
                        ? t("layout.dashboard")
                        : t("layout.resources")
                    }}
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-end gap-2">
                <select
                  :value="locale"
                  class="h-9 max-w-28 rounded-md border border-input bg-background px-3 text-sm sm:max-w-none"
                  @change="
                    setLocale(
                      ($event.target as HTMLSelectElement).value as 'id' | 'en'
                    )
                  "
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
                  class="hidden sm:inline-flex"
                  @click="toggleTheme"
                >
                  {{
                    colorMode.preference === "dark"
                      ? t("layout.themeLight")
                      : t("layout.themeDark")
                  }}
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
          class="fixed inset-0 z-[90] bg-black/40 md:hidden"
          @click="mobileNavOpen = false"
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
          class="fixed inset-y-0 left-0 z-[95] flex w-[88vw] max-w-sm flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl md:hidden"
        >
          <div
            class="flex items-center justify-between border-b border-sidebar-border px-4 py-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground"
              >
                AC
              </div>
              <div class="grid text-sm leading-tight">
                <span class="font-semibold">Academy</span>
                <span class="text-xs text-muted-foreground">{{
                  t("layout.adminConsole")
                }}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              @click="mobileNavOpen = false"
            >
              <span class="text-lg leading-none">×</span>
            </Button>
          </div>
          <div class="flex-1 overflow-y-auto px-3 py-3">
            <section
              v-for="group in navGroups"
              :key="`mobile-${group.title}`"
              class="pb-4"
            >
              <div
                class="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {{ group.title }}
              </div>
              <nav class="space-y-1 text-sm">
                <NuxtLink
                  v-for="item in group.items"
                  :key="`mobile-${item.to}`"
                  class="flex items-center rounded-md px-3 py-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  :class="{
                    'bg-sidebar-accent text-sidebar-accent-foreground font-medium':
                      isActive(item.to) &&
                      (item.to !== '/' || route.path === '/'),
                  }"
                  :to="item.to"
                >
                  {{ item.label }}
                </NuxtLink>
              </nav>
            </section>
          </div>
          <div class="border-t border-sidebar-border px-4 py-4">
            <div class="mb-3 text-xs text-muted-foreground">
              {{ t("layout.signedIn") }}
            </div>
            <AuthMenu />
          </div>
        </aside>
      </Transition>
    </div>
  </div>
</template>
