<script setup lang="ts">
defineOptions({ name: 'DefaultLayout' })

const {
  activeSessionToken,
  appName,
  currentLocaleBadge,
  currentPageGroup,
  currentPageTitle,
  currentThemeIcon,
  currentThemeLabel,
  desktopAccountMenuOpen,
  handleLogout,
  hide,
  isAuthPage,
  isInternalRoute,
  isNavItemActive,
  isSwitchingLocale,
  message,
  mobileAccountMenuOpen,
  mobileNavOpen,
  navGroups,
  switchLocale,
  t,
  toggleDesktopAccountMenu,
  toggleMobileAccountMenu,
  toggleTheme,
  userDisplayName,
  userTenantName,
  variant,
  visible,
} = useDefaultLayout()
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <LayoutBanner
      :close-label="t('layout.close')"
      :message="message"
      :variant="variant"
      :visible="visible"
      @close="hide"
    />

    <LayoutAuthShell
      v-if="isAuthPage"
      :current-locale-badge="currentLocaleBadge"
      :current-theme-icon="currentThemeIcon"
      :current-theme-label="currentThemeLabel"
      :is-switching-locale="isSwitchingLocale"
      :language-label="t('layout.language')"
      :preferences-label="t('layout.preferences')"
      @switch-locale="switchLocale()"
      @toggle-theme="toggleTheme"
    >
      <slot />
    </LayoutAuthShell>

    <LayoutAppShell
      v-else
      :app-name="appName"
      :current-locale-badge="currentLocaleBadge"
      :current-page-group="currentPageGroup"
      :current-page-title="currentPageTitle"
      :current-theme-icon="currentThemeIcon"
      :current-theme-label="currentThemeLabel"
      :desktop-account-menu-open="desktopAccountMenuOpen"
      :is-internal-route="isInternalRoute"
      :is-nav-item-active="isNavItemActive"
      :is-switching-locale="isSwitchingLocale"
      :mobile-account-menu-open="mobileAccountMenuOpen"
      :mobile-nav-open="mobileNavOpen"
      :nav-groups="navGroups"
      :session-active="Boolean(activeSessionToken)"
      :user-display-name="userDisplayName"
      :user-tenant-name="userTenantName"
      @close-mobile-nav="mobileNavOpen = false"
      @logout="handleLogout"
      @open-mobile-nav="mobileNavOpen = true"
      @switch-locale="switchLocale()"
      @toggle-desktop-account-menu="toggleDesktopAccountMenu"
      @toggle-mobile-account-menu="toggleMobileAccountMenu"
      @toggle-theme="toggleTheme"
    >
      <slot />
    </LayoutAppShell>
  </div>
</template>
