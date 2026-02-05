<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()

// Animated stats
const stats = ref([
  { value: 0, target: 50, suffix: 'K+', label: 'Active Users' },
  { value: 0, target: 99, suffix: '%', label: 'Satisfaction' },
  { value: 0, target: 24, suffix: '/7', label: 'Support' }
])

// Floating elements animation
const floatingElements = ref([
  { icon: 'mdi-chart-line', color: 'success', delay: 0 },
  { icon: 'mdi-shield-check', color: 'primary', delay: 0.5 },
  { icon: 'mdi-lightning-bolt', color: 'warning', delay: 1 },
  { icon: 'mdi-heart', color: 'error', delay: 1.5 }
])

// Animate numbers on mount
onMounted(() => {
  stats.value.forEach((stat) => {
    const increment = stat.target / 50
    const timer = setInterval(() => {
      if (stat.value < stat.target) {
        stat.value = Math.min(stat.value + increment, stat.target)
      } else {
        clearInterval(timer)
      }
    }, 30)
  })
})
</script>

<template>
  <div
    id="home"
    class="hero-section"
    :class="theme.current.value.dark ? 'hero-dark' : 'hero-light'"
  >
    <VContainer class="hero-container">
      <!-- Floating Background Elements -->
      <div class="floating-elements">
        <div
          v-for="(element, index) in floatingElements"
          :key="index"
          class="floating-element"
          :class="`floating-${index}`"
          :style="{ animationDelay: `${element.delay}s` }"
        >
          <VIcon
            :icon="element.icon"
            :color="element.color"
            size="40"
          />
        </div>
      </div>

      <!-- Main Content -->
      <VRow class="align-center justify-center hero-content">
        <VCol
          cols="12"
          lg="10"
          xl="8"
        >
          <!-- Badge -->
          <div class="text-center mb-4">
            <VChip
              color="primary"
              variant="tonal"
              size="small"
              class="hero-badge"
            >
              <VIcon
                icon="mdi-sparkles"
                start
              />
              New Feature Available
            </VChip>
          </div>

          <!-- Main Title -->
          <div class="text-center hero-text-box">
            <h1 class="hero-title mb-6">
              Transform Your Business
              <span class="gradient-text">With AI-Powered</span>
              Solutions
            </h1>
            
            <p class="hero-subtitle text-h6 text-medium-emphasis mb-8">
              Streamline operations, boost productivity, and scale your business 
              with our cutting-edge platform designed for modern teams.
            </p>

            <!-- CTA Buttons -->
            <div class="hero-actions d-flex flex-wrap gap-4 justify-center mb-12">
              <VBtn
                size="x-large"
                color="primary"
                class="hero-btn-primary"
                :to="{ name: 'front-pages-landing-page', hash: `#pricing-plan` }"
              >
                <VIcon
                  icon="mdi-rocket-launch"
                  start
                />
                Get Started Free
              </VBtn>
              
              <VBtn
                size="x-large"
                variant="outlined"
                color="primary"
                class="hero-btn-secondary"
              >
                <VIcon
                  icon="mdi-play-circle"
                  start
                />
                Watch Demo
              </VBtn>
            </div>

            <!-- Stats -->
            <VRow class="hero-stats">
              <VCol
                v-for="(stat, index) in stats"
                :key="index"
                cols="12"
                sm="4"
              >
                <VCard
                  class="stat-card"
                  variant="tonal"
                  :color="theme.current.value.dark ? 'surface' : 'primary'"
                >
                  <VCardText class="text-center">
                    <h2 class="stat-value">
                      {{ Math.floor(stat.value) }}{{ stat.suffix }}
                    </h2>
                    <p class="stat-label text-medium-emphasis">
                      {{ stat.label }}
                    </p>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </div>
        </VCol>
      </VRow>

      <!-- Feature Highlights -->
      <VRow class="feature-highlights mt-16">
        <VCol
          v-for="(feature, index) in [
            { icon: 'mdi-chart-timeline-variant', title: 'Advanced Analytics', color: 'primary' },
            { icon: 'mdi-shield-lock', title: 'Bank-Level Security', color: 'success' },
            { icon: 'mdi-lightning-bolt', title: 'Lightning Fast', color: 'warning' },
            { icon: 'mdi-account-group', title: 'Team Collaboration', color: 'info' }
          ]"
          :key="index"
          cols="6"
          md="3"
        >
          <div class="feature-item text-center">
            <VAvatar
              :color="feature.color"
              size="64"
              class="mb-4"
              variant="tonal"
            >
              <VIcon
                :icon="feature.icon"
                size="32"
              />
            </VAvatar>
            <h6 class="text-h6 font-weight-medium">
              {{ feature.title }}
            </h6>
          </div>
        </VCol>
      </VRow>

      <!-- Trust Badges -->
      <div class="trust-section text-center mt-16">
        <p class="text-body-2 text-medium-emphasis mb-6">
          TRUSTED BY LEADING COMPANIES WORLDWIDE
        </p>
        <div class="trust-badges d-flex flex-wrap gap-8 justify-center align-center">
          <div
            v-for="i in 5"
            :key="i"
            class="trust-badge"
          >
            <VIcon
              icon="mdi-domain"
              size="40"
              color="medium-emphasis"
            />
          </div>
        </div>
      </div>
    </VContainer>

    <!-- Decorative Elements -->
    <div class="gradient-blur gradient-blur-1" />
    <div class="gradient-blur gradient-blur-2" />
    <div class="gradient-blur gradient-blur-3" />
  </div>
</template>

<style lang="scss" scoped>
.hero-section {
  position: relative;
  min-block-size: 100vh;
  overflow: hidden;
  padding-block: 6rem 4rem;
  display: flex;
  align-items: center;
}

.hero-light {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 50%, #f0f4ff 100%);
}

.hero-dark {
  background: linear-gradient(135deg, #1a1d2e 0%, #16213e 50%, #1a1a2e 100%);
}

.hero-container {
  position: relative;
  z-index: 2;
}

// Floating background elements
.floating-elements {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.floating-element {
  position: absolute;
  opacity: 0.1;
  animation: float 6s ease-in-out infinite;
  
  &.floating-0 {
    inset-block-start: 10%;
    inset-inline-start: 10%;
  }
  
  &.floating-1 {
    inset-block-start: 20%;
    inset-inline-end: 15%;
    animation-duration: 7s;
  }
  
  &.floating-2 {
    inset-block-end: 30%;
    inset-inline-start: 15%;
    animation-duration: 8s;
  }
  
  &.floating-3 {
    inset-block-end: 20%;
    inset-inline-end: 10%;
    animation-duration: 9s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-30px) rotate(180deg);
  }
}

// Gradient blur decorations
.gradient-blur {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.3;
  pointer-events: none;
}

.gradient-blur-1 {
  inline-size: 400px;
  block-size: 400px;
  background: rgb(var(--v-theme-primary));
  inset-block-start: -200px;
  inset-inline-start: -200px;
}

.gradient-blur-2 {
  inline-size: 300px;
  block-size: 300px;
  background: rgb(var(--v-theme-success));
  inset-block-start: 50%;
  inset-inline-end: -150px;
}

.gradient-blur-3 {
  inline-size: 350px;
  block-size: 350px;
  background: rgb(var(--v-theme-warning));
  inset-block-end: -175px;
  inset-inline-start: 50%;
}

// Hero content
.hero-content {
  min-block-size: 60vh;
}

.hero-text-box {
  max-inline-size: 900px;
  margin-inline: auto;
}

.hero-badge {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.hero-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.2;
  margin-block-end: 1.5rem;
  animation: fadeInUp 1s ease-out;
}

.gradient-text {
  display: block;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 50%, rgb(var(--v-theme-success)) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: gradientShift 3s ease infinite;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-subtitle {
  max-inline-size: 700px;
  margin-inline: auto;
  animation: fadeInUp 1s ease-out 0.2s backwards;
}

.hero-actions {
  animation: fadeInUp 1s ease-out 0.4s backwards;
}

.hero-btn-primary {
  box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(var(--v-theme-primary), 0.4);
  }
}

.hero-btn-secondary {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}

// Stats cards
.hero-stats {
  animation: fadeInUp 1s ease-out 0.6s backwards;
}

.stat-card {
  border-radius: 16px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 800;
  color: rgb(var(--v-theme-primary));
  margin-block-end: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  margin: 0;
}

// Feature highlights
.feature-highlights {
  animation: fadeInUp 1s ease-out 0.8s backwards;
}

.feature-item {
  padding: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    
    .v-avatar {
      transform: scale(1.1);
    }
  }
  
  .v-avatar {
    transition: transform 0.3s ease;
  }
}

// Trust section
.trust-section {
  animation: fadeInUp 1s ease-out 1s backwards;
}

.trust-badges {
  opacity: 0.6;
}

.trust-badge {
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}

// Responsive adjustments
@media (max-width: 960px) {
  .hero-section {
    padding-block: 4rem 3rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-actions {
    flex-direction: column;
    
    .v-btn {
      inline-size: 100%;
    }
  }
  
  .feature-highlights {
    margin-block-start: 3rem;
  }
  
  .trust-section {
    margin-block-start: 3rem;
  }
}

@media (max-width: 600px) {
  .hero-section {
    min-block-size: auto;
  }
  
  .hero-title {
    font-size: 1.75rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .stat-value {
    font-size: 2rem;
  }
  
  .gradient-blur {
    display: none;
  }
}
</style>
