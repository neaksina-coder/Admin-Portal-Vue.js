<script setup lang="ts">
import Footer from '@/views/front-pages/front-page-footer.vue'
import Navbar from '@/views/front-pages/front-page-navbar.vue'
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

const quickActions = [
  { id: 1, label: 'Recommend a plan', icon: 'M4 8h16M6 8v8M18 8v8M4 16h16' },
  { id: 2, label: 'Explain CRM tools', icon: 'M6 9h12M8 13h8M9 17h6' },
  { id: 3, label: 'Explain AI analytics', icon: 'M4 6h16M4 12h10M4 18h14' },
  { id: 4, label: 'Help me sign up', icon: 'M12 5v14M5 12h14' },
]
</script>

<template>
  <div class="public-page">
    <Navbar />

    <VContainer class="page-section">
      <div class="text-center mb-12">
        <VChip label color="primary" size="small" class="mb-4">
          AI Smart Guide
        </VChip>
        <h1 class="text-h3 font-weight-bold mb-3">
          Let AI Guide You to the Right Plan
        </h1>
        <p class="text-body-1 text-medium-emphasis mx-auto" style="max-inline-size: 760px;">
          The AI Smart Guide helps visitors understand our products, choose the right plan, and start quickly.
        </p>
      </div>

      <VRow class="mb-10">
        <VCol cols="12" md="6">
          <VCard class="flow-card" variant="tonal">
            <VCardText>
              <h5 class="text-h5 mb-4">How It Works</h5>
              <ol class="flow-list">
                <li>Visitor opens the website</li>
                <li>AI asks business type</li>
                <li>AI suggests tools</li>
                <li>AI recommends a pricing plan</li>
                <li>Visitor signs up</li>
              </ol>
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="6">
          <VCard class="flow-card" variant="outlined">
            <VCardText>
              <h5 class="text-h5 mb-4">What the AI Can Do</h5>
              <ul class="feature-list">
                <li>Product Q&A chatbot</li>
                <li>Plan recommendation assistant</li>
                <li>Feature explanation assistant</li>
                <li>Signup guidance</li>
              </ul>
              <VBtn class="mt-6" color="primary" :to="{ name: 'front-pages-pricing' }">
                View Pricing Plans
              </VBtn>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>

    <AIChatWidget
      ai-name="Sina AI"
      :ai-avatar="aiAvatar"
      welcome-message="Tell me your business type and I'll recommend the best tools and plan."
      :quick-actions="quickActions"
    />

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

.flow-card {
  border-radius: 18px;
}

.flow-list,
.feature-list {
  margin: 0;
  padding-inline-start: 1.25rem;
  display: grid;
  gap: 0.5rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
</style>
