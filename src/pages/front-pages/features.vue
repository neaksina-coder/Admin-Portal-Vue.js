<script setup lang="ts">
import Footer from '@/views/front-pages/front-page-footer.vue'
import Navbar from '@/views/front-pages/front-page-navbar.vue'
import { useConfigStore } from '@core/stores/config'

const store = useConfigStore()

store.skin = 'default'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const featureGroups = [
  {
    title: 'CRM Tools',
    desc: 'Manage customers, segments, and engagement history with clarity.',
    icon: 'tabler-users',
  },
  {
    title: 'Marketing Tools',
    desc: 'Create campaigns, send emails, track delivery logs, and optimize results.',
    icon: 'tabler-bullhorn',
  },
  {
    title: 'HR Tools',
    desc: 'Organize staff data, roles, and internal workflows in one place.',
    icon: 'tabler-id-badge',
  },
  {
    title: 'POS Tools',
    desc: 'Track sales, discounts, and invoices with real-time reporting.',
    icon: 'tabler-cash',
  },
  {
    title: 'AI Analytics',
    desc: 'Get AI-powered insights to improve decisions and grow faster.',
    icon: 'tabler-chart-line',
  },
]

const integrations = [
  {
    title: 'Authentication System',
    desc: 'Secure login and role-based access for admins and customers.',
    icon: 'tabler-shield-check',
  },
  {
    title: 'Payment System',
    desc: 'Built-in billing flow for subscriptions and invoices.',
    icon: 'tabler-credit-card',
  },
  {
    title: 'Customer Portal',
    desc: 'Self-service access for customers before and after signup.',
    icon: 'tabler-user-circle',
  },
]
</script>

<template>
  <div class="public-page">
    <Navbar />

    <VContainer class="page-section">
      <div class="text-center mb-12">
        <VChip label color="primary" size="small" class="mb-4">
          Features
        </VChip>
        <h1 class="text-h3 font-weight-bold mb-3">
          Business Tools Built for Growth
        </h1>
        <p class="text-body-1 text-medium-emphasis mx-auto" style="max-inline-size: 720px;">
          AI Business Platform brings CRM, marketing, HR, POS, and AI analytics together so teams can move faster
          with fewer tools.
        </p>
      </div>

      <VRow>
        <VCol
          v-for="feature in featureGroups"
          :key="feature.title"
          cols="12"
          md="4"
          sm="6"
        >
          <VCard class="feature-card" variant="tonal">
            <VCardText>
              <VAvatar color="primary" variant="tonal" size="52" class="mb-4">
                <VIcon :icon="feature.icon" size="28" />
              </VAvatar>
              <h5 class="text-h5 mb-2">
                {{ feature.title }}
              </h5>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ feature.desc }}
              </p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>

    <VContainer class="page-section">
      <div class="text-center mb-10">
        <VChip label color="primary" size="small" class="mb-4">
          Integrations
        </VChip>
        <h2 class="text-h4 font-weight-bold mb-3">
          Connected to Your Business System
        </h2>
        <p class="text-body-1 text-medium-emphasis mx-auto" style="max-inline-size: 720px;">
          The public website is integrated with core systems for authentication, billing, and the customer portal.
        </p>
      </div>

      <VRow>
        <VCol
          v-for="item in integrations"
          :key="item.title"
          cols="12"
          md="4"
        >
          <VCard class="integration-card" variant="outlined">
            <VCardText>
              <VAvatar color="primary" variant="tonal" size="48" class="mb-4">
                <VIcon :icon="item.icon" size="24" />
              </VAvatar>
              <h6 class="text-h6 mb-2">
                {{ item.title }}
              </h6>
              <p class="text-body-2 text-medium-emphasis mb-0">
                {{ item.desc }}
              </p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <div class="d-flex justify-center mt-10">
        <VBtn color="primary" :to="{ name: 'front-pages-ai-guide' }">
          Open AI Smart Guide
        </VBtn>
      </div>
    </VContainer>

    <Footer />
  </div>
</template>

<style scoped lang="scss">
.public-page {
  padding-block-start: 6rem;
}

.page-section {
  padding-block: 4rem;
}

.feature-card,
.integration-card {
  border-radius: 18px;
}
</style>
