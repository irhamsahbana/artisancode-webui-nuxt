<script setup lang="ts">
import { Building2, ClipboardList, LayoutGrid, MapPin, Menu, MoonStar, ShieldCheck, SunMedium, UserRound, Users, BriefcaseBusiness, Clock3, X } from 'lucide-vue-next'

defineOptions({ name: "DefaultLayout" });

const route = useRoute();
const { user, token, logout } = useAuth();
const isAuthPage = computed(
  () => route.path === "/login" || route.path === "/register"
);
const { locale, options: localeOptions, setLocale, t } = useLocale();
const mobileNavOpen = ref(false);

const navGroups = computed(() => [
  {
    title: t("layout.main"),
    items: [{ label: t("layout.dashboard"), to: "/", icon: LayoutGrid }],
  },
  {
    title: t("layout.resources"),
    items: [
      { label: t("layout.users"), to: "/resources/users", icon: UserRound },
      { label: t("layout.companies"), to: "/resources/companies", icon: Building2 },
      { label: t("layout.employees"), to: "/resources/employees", icon: Users },
      { label: t("layout.attendanceLogs"), to: "/resources/attendance-logs", icon: ClipboardList },
      { label: t("layout.jobPositions"), to: "/resources/job-positions", icon: BriefcaseBusiness },
      { label: t("layout.workLocations"), to: "/resources/work-locations", icon: MapPin },
      { label: t("layout.workShifts"), to: "/resources/work-shifts", icon: Clock3 },
      { label: t("layout.rolesPermissions"), to: "/resources/roles", icon: ShieldCheck },
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

const currentPageTitle = computed(() => {
  for (const group of navGroups.value) {
    const activeItem = group.items.find(item => isActive(item.to) && (item.to !== "/" || route.path === "/"))
    if (activeItem) {
      return activeItem.label
    }
  }

  return "Academy"
})

const currentPageGroup = computed(() => {
  for (const group of navGroups.value) {
    const activeItem = group.items.find(item => isActive(item.to) && (item.to !== "/" || route.path === "/"))
    if (activeItem) {
      return group.title
    }
  }

  return t("layout.main")
})

const localeBadge = (value: "id" | "en") =>
  value === "id" ? "🇮🇩 ID" : "🇬🇧 EN";

const currentLocaleBadge = computed(() => localeBadge(locale.value));

const switchLocale = (value: "id" | "en") => {
  if (locale.value !== value) {
    setLocale(value);
  }
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
    <div
      v-if="isAuthPage"
      class="min-h-screen"
    >
      <slot />
    </div>
    <div
      v-else
      class="h-screen overflow-hidden"
    >
      <div class="flex h-screen w-full items-stretch overflow-hidden bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--background))_72%,hsl(var(--muted)/0.4))] text-foreground">
        <aside
          class="hidden h-screen w-80 shrink-0 flex-col self-stretch overflow-hidden border-r border-sidebar-border/70 bg-[linear-gradient(180deg,hsl(var(--sidebar))_0%,hsl(var(--sidebar))_62%,hsl(var(--sidebar-accent)/0.42)_100%)] text-sidebar-foreground md:flex"
        >
          <div class="border-b border-sidebar-border/70 px-5 pb-5 pt-6">
            <div class="rounded-3xl border border-sidebar-border/60 bg-sidebar-accent/50 p-4 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.9)]">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground shadow-sm"
                >
                  AC
                </div>
                <div class="grid text-sm leading-tight">
                  <span class="font-semibold text-sidebar-foreground">Academy</span>
                  <span class="text-xs text-sidebar-foreground/70">{{
                    t("layout.adminConsole")
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto px-4 py-4">
            <section
              v-for="group in navGroups"
              :key="group.title"
              class="pb-4"
            >
              <div
                class="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45"
              >
                {{ group.title }}
              </div>
              <nav class="space-y-1.5 text-sm">
                <NuxtLink
                  v-for="item in group.items"
                  :key="item.to"
                  class="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sidebar-foreground/78 transition hover:border-sidebar-border/60 hover:bg-sidebar-accent/75 hover:text-sidebar-accent-foreground"
                  :class="{
                    'border-sidebar-border/70 bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_18px_36px_-30px_rgba(15,23,42,0.85)] font-medium':
                      isActive(item.to) &&
                      (item.to !== '/' || route.path === '/'),
                  }"
                  :to="item.to"
                >
                  <component
                    :is="item.icon"
                    class="h-4 w-4 shrink-0"
                    :class="{
                      'text-sidebar-primary': isActive(item.to) && (item.to !== '/' || route.path === '/'),
                      'text-sidebar-foreground/55 group-hover:text-sidebar-foreground/80': !isActive(item.to) || (item.to === '/' && route.path !== '/'),
                    }"
                  />
                  {{ item.label }}
                </NuxtLink>
              </nav>
            </section>
          </div>
        </aside>
        <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div class="sticky top-0 z-30 border-b border-border/70 bg-background/92 backdrop-blur-xl">
            <div
              class="flex min-h-[76px] items-center justify-between gap-4 px-4 py-4 md:px-6"
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
              <div class="flex items-center justify-end gap-2">
                <div class="hidden items-center gap-1 rounded-2xl border border-border/70 bg-card/80 p-1 shadow-sm sm:flex">
                  <Button
                    v-for="option in localeOptions"
                    :key="option.value"
                    variant="ghost"
                    size="sm"
                    class="h-8 rounded-xl px-3 text-xs font-semibold"
                    :class="locale === option.value ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground'"
                    @click="switchLocale(option.value)"
                  >
                    {{ localeBadge(option.value) }}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  class="hidden h-10 rounded-xl px-3 sm:inline-flex"
                  @click="toggleTheme"
                >
                  <SunMedium
                    v-if="colorMode.preference === 'dark'"
                    class="mr-2 h-4 w-4"
                  />
                  <MoonStar
                    v-else
                    class="mr-2 h-4 w-4"
                  />
                  {{
                    colorMode.preference === "dark"
                      ? t("layout.themeLight")
                      : t("layout.themeDark")
                  }}
                </Button>
                <div
                  v-if="token"
                  class="hidden items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-3 py-2 shadow-sm lg:flex"
                >
                  <div class="grid text-right leading-tight">
                    <span class="text-sm font-semibold">{{ user?.name || user?.username }}</span>
                    <span class="text-xs text-muted-foreground">{{ user?.tenant_name }}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-9 rounded-xl px-3"
                    @click="logout"
                  >
                    Logout
                  </Button>
                </div>
                <div class="flex items-center gap-2 sm:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-10 rounded-xl px-3 text-xs font-semibold"
                    @click="switchLocale(locale === 'id' ? 'en' : 'id')"
                  >
                    {{ currentLocaleBadge }}
                  </Button>
                  <div v-if="token">
                    <AuthMenu />
                  </div>
                </div>
              </div>
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
          class="fixed inset-y-0 left-0 z-[95] flex w-[min(92vw,22rem)] max-w-sm flex-col overflow-hidden border-r border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-[0_32px_90px_-48px_rgba(2,6,23,0.95)] md:hidden"
        >
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--sidebar-primary)/0.18),transparent_34%),linear-gradient(180deg,hsl(var(--sidebar))_0%,hsl(var(--sidebar))_58%,hsl(var(--sidebar-accent)/0.82)_100%)]" />
          <div class="relative flex h-full flex-col">
            <div
              class="flex items-center justify-between border-b border-sidebar-border/70 px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)]"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex size-10 items-center justify-center rounded-2xl bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground"
                >
                  AC
                </div>
                <div class="grid text-sm leading-tight">
                  <span class="font-semibold">Academy</span>
                  <span class="text-xs text-sidebar-foreground/68">{{
                    t("layout.adminConsole")
                  }}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/55 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                aria-label="Close navigation"
                @click="mobileNavOpen = false"
              >
                <X class="h-4 w-4" />
              </Button>
            </div>
            <div class="flex-1 overflow-y-auto px-3 py-4">
              <section
                v-for="group in navGroups"
                :key="`mobile-${group.title}`"
                class="pb-4"
              >
                <div
                  class="px-3 pb-2 pt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45"
                >
                  {{ group.title }}
                </div>
                <nav class="space-y-1.5 text-sm">
                  <NuxtLink
                    v-for="item in group.items"
                    :key="`mobile-${item.to}`"
                    class="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3.5 text-sidebar-foreground/86 transition hover:border-sidebar-border/70 hover:bg-sidebar-accent/88 hover:text-sidebar-accent-foreground"
                    :class="{
                      'border-sidebar-border/80 bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-[0_18px_34px_-28px_rgba(2,6,23,0.95)]':
                        isActive(item.to) &&
                        (item.to !== '/' || route.path === '/'),
                    }"
                    :to="item.to"
                  >
                    <component
                      :is="item.icon"
                      class="h-4 w-4 shrink-0"
                      :class="{
                        'text-sidebar-primary': isActive(item.to) && (item.to !== '/' || route.path === '/'),
                        'text-sidebar-foreground/55 group-hover:text-sidebar-foreground/80': !isActive(item.to) || (item.to === '/' && route.path !== '/'),
                      }"
                    />
                    {{ item.label }}
                  </NuxtLink>
                </nav>
              </section>
            </div>
            <div class="border-t border-sidebar-border/70 bg-sidebar/96 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
              <div class="rounded-3xl border border-sidebar-border/60 bg-sidebar-accent/70 p-4 shadow-[0_18px_40px_-34px_rgba(2,6,23,0.95)]">
                <div class="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                  {{ t("layout.signedIn") }}
                </div>
                <AuthMenu />
              </div>
            </div>
          </div>
        </aside>
      </Transition>
    </div>
  </div>
</template>
