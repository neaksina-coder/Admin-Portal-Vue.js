<script setup lang="ts">
import { useWindowScroll } from '@vueuse/core'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useDisplay } from 'vuetify'

import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { useAbility } from '@/plugins/casl/composables/useAbility'

const props = defineProps({
  activeId: String,
})

const display = useDisplay()
const { y } = useWindowScroll()

const router = useRouter()
const ability = useAbility()
const userData = useCookie<any>('userData')
const accessToken = useCookie<string>('accessToken')
const userAbilityRules = useCookie('userAbilityRules')
const isLoggedIn = computed(() => !!(userData.value && accessToken.value))
const role = computed(() => userData.value?.role)
const showAdminPortal = computed(() => isLoggedIn.value && role.value !== 'user')

const sidebar = ref(false)

watch(() => display, () => {
  return display.mdAndUp ? sidebar.value = false : sidebar.value
}, { deep: true })

const navSections = ['Home', 'Features', 'Team', 'FAQ', 'Contact us']

const logout = () => {
  userData.value = null
  accessToken.value = null
  userAbilityRules.value = null
  ability.update([])
  router.push({ name: 'front-pages-landing-page' })
}
</script>

<template>
  <!-- Navigation drawer for mobile devices -->
  <VNavigationDrawer
    v-model="sidebar"
    width="275"
    data-allow-mismatch
    disable-resize-watcher
  >
    <PerfectScrollbar
      :options="{ wheelPropagation: false }"
      class="h-100"
    >
      <div class="d-flex flex-column gap-y-4 pa-4">
        <RouterLink
          v-for="(item, index) in navSections"
          :key="index"
          :to="{ name: 'front-pages-landing-page', hash: `#${item.toLowerCase().replace(' ', '-')}` }"
          class="nav-link font-weight-medium"
          :class="[props.activeId?.toLocaleLowerCase().replace('-', ' ') === item.toLocaleLowerCase() ? 'active-link' : '']"
        >
          {{ item }}
        </RouterLink>

        <VDivider class="my-2" />

        <RouterLink
          v-if="showAdminPortal"
          :to="{ name: 'dashboards-crm' }"
          class="font-weight-medium nav-link"
        >
          Admin Portal
        </RouterLink>

        <VBtn
          v-if="!isLoggedIn"
          :to="{ name: 'login' }"
          variant="tonal"
          color="primary"
        >
          Sign in
        </VBtn>

        <VBtn
          v-else
          variant="text"
          color="secondary"
          @click="logout"
        >
          Logout
        </VBtn>
      </div>

      <VIcon
        id="navigation-drawer-close-btn"
        icon="tabler-x"
        size="20"
        @click="sidebar = !sidebar"
      />
    </PerfectScrollbar>
  </VNavigationDrawer>

  <!-- Navbar for desktop devices -->
  <div class="front-page-navbar">
    <div class="front-page-navbar">
      <VAppBar
        :color="$vuetify.theme.current.dark ? 'rgba(var(--v-theme-surface),0.38)' : 'rgba(var(--v-theme-surface), 0.38)'"
        :class="y > 10 ? 'app-bar-scrolled' : [$vuetify.theme.current.dark ? 'app-bar-dark' : 'app-bar-light', 'elevation-0']"
        class="navbar-blur"
      >
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n3 me-2 d-inline-block d-md-none"
          @click="sidebar = !sidebar"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
            color="rgba(var(--v-theme-on-surface))"
          />
        </IconBtn>

        <div class="d-flex align-center">
          <VAppBarTitle class="me-6">
            <RouterLink
              to="/"
              class="d-flex gap-x-4"
              :class="$vuetify.display.mdAndUp ? 'd-none' : 'd-block'"
            >
              <div class="app-logo">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title">
                  {{ themeConfig.app.title }}
                </h1>
              </div>
            </RouterLink>
          </VAppBarTitle>

          <div class="text-base align-center d-none d-md-flex">
            <RouterLink
              v-for="(item, index) in navSections"
              :key="index"
              :to="{ name: 'front-pages-landing-page', hash: `#${item.toLowerCase().replace(' ', '-')}` }"
              class="nav-link font-weight-medium py-2 px-2 px-lg-4"
              :class="[props.activeId?.toLocaleLowerCase().replace('-', ' ') === item.toLocaleLowerCase() ? 'active-link' : '']"
            >
              {{ item }}
            </RouterLink>
          </div>
        </div>

        <VSpacer />

        <div class="d-flex gap-x-3">
          <NavbarThemeSwitcher />

          <VBtn
            v-if="showAdminPortal"
            :to="{ name: 'dashboards-crm' }"
            variant="tonal"
            color="primary"
          >
            Admin Portal
          </VBtn>

          <VBtn
            v-if="!isLoggedIn"
            :to="{ name: 'login' }"
            variant="elevated"
            color="primary"
          >
            Sign in
          </VBtn>

          <VBtn
            v-else
            variant="text"
            color="secondary"
            @click="logout"
          >
            Logout
          </VBtn>
        </div>
      </VAppBar>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.nav-link {
  &:not(:hover) {
    color: rgb(var(--v-theme-on-surface));
  }
}

@media (min-width: 1920px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(1440px - 32px);
    }
  }
}

@media (min-width: 1280px) and (max-width: 1919px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(1200px - 32px);
    }
  }
}

@media (min-width: 960px) and (max-width: 1279px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(900px - 32px);
    }
  }
}

@media (min-width: 600px) and (max-width: 959px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 64px);
    }
  }
}

@media (max-width: 600px) {
  .front-page-navbar {
    .v-toolbar {
      max-inline-size: calc(100% - 32px);
    }
  }
}

.active-link {
  color: rgb(var(--v-theme-primary)) !important;
}

.app-bar-light {
  border: 2px solid rgba(var(--v-theme-surface), 68%);
  border-radius: 0.5rem;
  background-color: rgba(var(--v-theme-surface), 38%);
  transition: all 0.1s ease-in-out;
}

.app-bar-dark {
  border: 2px solid rgba(var(--v-theme-surface), 68%);
  border-radius: 0.5rem;
  background-color: rgba(255, 255, 255, 4%);
  transition: all 0.1s ease-in-out;
}

.app-bar-scrolled {
  border: 2px solid rgb(var(--v-theme-surface));
  border-radius: 0.5rem;
  background-color: rgb(var(--v-theme-surface)) !important;
  transition: all 0.1s ease-in-out;
}

.front-page-navbar::after {
  position: fixed;
  z-index: 2;
  backdrop-filter: saturate(100%) blur(6px);
  block-size: 5rem;
  content: "";
  inline-size: 100%;
}
</style>

<style lang="scss">
@use "@layouts/styles/mixins" as layoutMixins;

.front-page-navbar {
  .v-toolbar__content {
    padding-inline: 30px !important;
  }

  .v-toolbar {
    inset-inline: 0 !important;
    margin-block-start: 1rem !important;
    margin-inline: auto !important;
  }
}

#navigation-drawer-close-btn {
  position: absolute;
  cursor: pointer;
  inset-block-start: 0.5rem;
  inset-inline-end: 1rem;
}
</style>
