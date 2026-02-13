<script setup lang="ts">
import Footer from '@/views/front-pages/front-page-footer.vue'
import Navbar from '@/views/front-pages/front-page-navbar.vue'
import Banner from '@/views/front-pages/landing-page/banner.vue'
import ContactUs from '@/views/front-pages/landing-page/contact-us.vue'
import CustomersReview from '@/views/front-pages/landing-page/customers-review.vue'
import FaqSection from '@/views/front-pages/landing-page/faq-section.vue'
import Features from '@/views/front-pages/landing-page/features.vue'
import HeroSection from '@/views/front-pages/landing-page/hero-section.vue'
import OurTeam from '@/views/front-pages/landing-page/our-team.vue'
import PricingPlans from '@/views/front-pages/landing-page/pricing-plans.vue'
import ProductStats from '@/views/front-pages/landing-page/product-stats.vue'
import AIChatWidget from '@/components/ai-chat/AIChatWidget.vue'
import aiAvatar from '@images/avatars/avatar-8.png'
import { useConfigStore } from '@core/stores/config'

const store = useConfigStore()

store.skin = 'default'
definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const activeSectionId = ref()

const refHome = ref()
const refFeatures = ref()
const refAiGuide = ref()
const refTeam = ref()
const refContact = ref()
const refFaq = ref()

const quickActions = [
  {
    id: 1,
    label: 'Recommend a plan',
    icon: 'M4 8h16M6 8v8M18 8v8M4 16h16',
  },
  {
    id: 2,
    label: 'Explain CRM tools',
    icon: 'M6 9h12M8 13h8M9 17h6',
  },
  {
    id: 3,
    label: 'Explain AI analytics',
    icon: 'M4 6h16M4 12h10M4 18h14',
  },
  {
    id: 4,
    label: 'Help me sign up',
    icon: 'M12 5v14M5 12h14',
  },
]

useIntersectionObserver(
  [refHome, refFeatures, refAiGuide, refTeam, refContact, refFaq],
  ([{ isIntersecting, target }]) => {
    if (isIntersecting)
      activeSectionId.value = target.id
  },
  {
    threshold: 0.25,
  },
)
</script>

<template>
  <div class="landing-page-wrapper">
    <Navbar :active-id="activeSectionId" />

    <!-- 👉 Hero Section  -->
    <HeroSection ref="refHome" />

    <!-- 👉 Useful features  -->
    <div :style="{ 'background-color': 'rgb(var(--v-theme-surface))' }">
      <Features ref="refFeatures" />
    </div>

    <div :style="{ 'background-color': 'rgb(var(--v-theme-background))' }">
      <VContainer
        id="ai-guide"
        ref="refAiGuide"
        class="py-16"
      >
        <VRow align="center">
          <VCol cols="12" md="7">
            <VChip label color="primary" size="small" class="mb-4">
              AI Smart Guide
            </VChip>
            <h3 class="text-h4 font-weight-bold mb-3">
              Get the Right Plan in Minutes
            </h3>
            <p class="text-body-1 text-medium-emphasis mb-6">
              Ask our AI Smart Guide about features, pricing, and setup. It recommends tools and
              a plan based on your business type.
            </p>
            <div class="d-flex gap-3 flex-wrap">
              <VBtn color="primary" :to="{ name: 'front-pages-ai-guide' }">
                Open AI Guide
              </VBtn>
              <VBtn variant="tonal" color="secondary" :to="{ name: 'front-pages-pricing' }">
                View Pricing
              </VBtn>
            </div>
          </VCol>
          <VCol cols="12" md="5">
            <VCard variant="tonal" class="pa-6 rounded-lg">
              <h5 class="text-h5 mb-4">AI Flow</h5>
              <VList density="compact">
                <VListItem title="Business type →" />
                <VListItem title="Suggested tools →" />
                <VListItem title="Recommended plan →" />
                <VListItem title="Signup guidance" />
              </VList>
            </VCard>
          </VCol>
        </VRow>
      </VContainer>
    </div>

    <!-- 👉 Customer Review -->
    <div :style="{ 'background-color': 'rgb(var(--v-theme-surface))' }">
      <CustomersReview />
    </div>

    <!-- 👉 Our Team -->
    <div :style="{ 'background-color': 'rgb(var(--v-theme-surface))' }">
      <OurTeam ref="refTeam" />
    </div>

    <!-- 👉 Pricing Plans -->
    <div :style="{ 'background-color': 'rgb(var(--v-theme-surface))' }">
      <PricingPlans />
    </div>

    <!-- 👉 Product stats -->
    <ProductStats />

    <!-- 👉 FAQ Section -->
    <div :style="{ 'background-color': 'rgb(var(--v-theme-surface))' }">
      <FaqSection ref="refFaq" />
    </div>

    <!-- 👉 Banner  -->
    <Banner />

    <!-- 👉 Contact Us  -->
    <ContactUs ref="refContact" />

    <AIChatWidget
      ai-name="Smart  AI"
      :ai-avatar="aiAvatar"
      welcome-message="Ask anything about our platform, plans, or setup."
      :quick-actions="quickActions"
    />

    <!-- 👉 Footer -->
    <Footer />
  </div>
</template>

<style lang="scss">
@media (max-width: 960px) and (min-width: 600px) {
  .landing-page-wrapper {
    .v-container {
      padding-inline: 2rem !important;
    }
  }
}
</style>

