<script setup lang="ts">
import dashboardPreview from '@images/front-pages/landing-page/cta-dashboard.png'

const faqData = [
  {
    question: 'What does the AI Business Platform include?',
    answer: 'CRM, Marketing, HR, POS, and AI Analytics in one platform, plus the AI Smart Guide for plan selection.',
  },
  {
    question: 'Can I start with a basic plan and upgrade later?',
    answer: 'Yes. You can upgrade anytime as your team or business grows.',
  },
  {
    question: 'How does the AI Smart Guide help?',
    answer: 'It asks about your business type and goals, then recommends tools and the best pricing plan.',
  },
  {
    question: 'Does the platform connect to billing and customer portal?',
    answer: 'Yes. It integrates with authentication, payment, and the customer portal for a complete workflow.',
  },
  {
    question: 'Is my business data secure?',
    answer: 'We use secure authentication and role-based access to protect your data.',
  },
]
</script>

<template>
  <div id="faq">
    <VContainer>
      <!-- ?? Header  -->
      <div class="faq-section">
        <div class="headers d-flex justify-center flex-column align-center">
          <VChip
            label
            color="primary"
            size="small"
            class="mb-4"
          >
            FAQ
          </VChip>
          <h4 class="d-flex align-center text-h4 mb-1 flex-wrap justify-center">
            Frequently Asked
            <div class="position-relative ms-2">
              <div class="section-title">
                questions
              </div>
            </div>
          </h4>
          <p class="text-body-1 mb-0">
            Browse through these FAQs to find answers to commonly asked questions.
          </p>
        </div>
        <VRow>
          <VCol
            cols="12"
            md="5"
          >
            <div class="pt-10 d-flex align-center justify-center h-100">
              <VImg
                :src="dashboardPreview"
                height="330"
                width="330"
              />
            </div>
          </VCol>
          <VCol
            cols="12"
            md="7"
          >
            <VExpansionPanels class="pt-16">
              <VExpansionPanel
                v-for="faq in faqData"
                :key="faq.question"
              >
                <VExpansionPanelTitle>
                  {{ faq.question }}
                </VExpansionPanelTitle>
                <VExpansionPanelText>
                  {{ faq.answer }}
                </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>
          </VCol>
        </VRow>
      </div>
    </VContainer>
  </div>
</template>

<style lang="scss" scoped>
.faq-section {
  margin-block: 5.25rem;
}

@media (max-width: 600px) {
  .faq-section {
    margin-block: 4rem;
  }
}

#faq {
  border-radius: 3.75rem 3.75rem 0 0;
  background-color: rgba(var(--v-theme-background));
}

.section-title {
  font-size: 24px;
  font-weight: 800;
  line-height: 36px;
}

.section-title::after {
  position: absolute;
  background: url("../../../assets/images/front-pages/icons/section-title-icon.png") no-repeat left bottom;
  background-size: contain;
  block-size: 100%;
  content: "";
  font-weight: 800;
  inline-size: 130%;
  inset-block-end: 12%;
  inset-inline-start: -12%;
}
</style>
