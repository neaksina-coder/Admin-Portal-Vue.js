<script setup lang="ts">
const highlights = [
  { label: 'Instant answers', value: '< 2s' },
  { label: 'Saved time', value: '4.8h/wk' },
  { label: 'User satisfaction', value: '98%' },
]
</script>

<template>
  <div class="landing-cta">
    <VContainer>
      <div class="cta-grid">
        <div class="cta-copy">
          <VChip
            color="primary"
            variant="tonal"
            class="mb-4"
            size="small"
          >
            AI Assistant, built in
          </VChip>
          <h3 class="cta-title">
            Turn every page into a guided experience.
          </h3>
          <p class="cta-subtitle">
            Replace static help with a responsive AI assistant that answers,
            summarizes, and nudges users to the right action.
          </p>
          <div class="cta-actions">
            <VBtn
              color="primary"
              :to="{ name: 'front-pages-payment' }"
              :size="$vuetify.display.smAndUp ? 'large' : 'default'"
            >
              Start Free Trial
            </VBtn>
            <VBtn
              variant="outlined"
              color="primary"
              :size="$vuetify.display.smAndUp ? 'large' : 'default'"
            >
              Book a Demo
            </VBtn>
          </div>
        </div>

        <div class="cta-panel">
          <div class="cta-panel-header">
            <div>
              <p class="cta-panel-title">
                Live AI insights
              </p>
              <p class="cta-panel-subtitle">
                Real-time guidance for every visitor.
              </p>
            </div>
            <VAvatar
              size="36"
              color="primary"
              variant="tonal"
            >
              <VIcon icon="tabler-sparkles" />
            </VAvatar>
          </div>

          <div class="cta-panel-body">
            <div
              v-for="item in highlights"
              :key="item.label"
              class="cta-metric"
            >
              <p class="cta-metric-value">
                {{ item.value }}
              </p>
              <p class="cta-metric-label">
                {{ item.label }}
              </p>
            </div>
          </div>

          <div class="cta-panel-footer">
            <p class="cta-panel-note">
              Deploy in minutes, customize in seconds.
            </p>
            <VBtn
              density="compact"
              variant="text"
              color="primary"
            >
              View setup guide
            </VBtn>
          </div>
        </div>
      </div>
    </VContainer>
  </div>
</template>

<style lang="scss">
.landing-cta {
  margin-block: auto;
  padding-block: 4.5rem;
  background:
    radial-gradient(circle at 15% 20%, rgba(99, 102, 241, 0.16), transparent 55%),
    radial-gradient(circle at 85% 10%, rgba(14, 165, 233, 0.2), transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(245, 158, 11, 0.18), transparent 55%),
    rgb(var(--v-theme-surface));
}

.cta-grid {
  display: grid;
  gap: 2.5rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  align-items: center;
}

.cta-copy {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cta-title {
  font-size: clamp(1.8rem, 2vw + 1.2rem, 2.6rem);
  font-weight: 700;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.cta-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 1rem;
  line-height: 1.7;
  margin: 0;
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.cta-panel {
  background: rgba(var(--v-theme-surface), 0.9);
  border-radius: 24px;
  padding: 1.75rem;
  box-shadow: 0 30px 60px rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  backdrop-filter: blur(8px);
}

.cta-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-block-end: 1.5rem;
}

.cta-panel-title {
  font-weight: 600;
  margin: 0;
}

.cta-panel-subtitle {
  margin: 0.2rem 0 0;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 0.9rem;
}

.cta-panel-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.cta-metric {
  padding: 1rem;
  border-radius: 16px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.cta-metric-value {
  margin: 0;
  font-weight: 700;
  font-size: 1.4rem;
}

.cta-metric-label {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.cta-panel-footer {
  margin-block-start: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.cta-panel-note {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
