<script setup lang="ts">
import Footer from '@/views/front-pages/front-page-footer.vue'
import Navbar from '@/views/front-pages/front-page-navbar.vue'
import ContactUs from '@/views/front-pages/landing-page/contact-us.vue'
import { useConfigStore } from '@core/stores/config'

const store = useConfigStore()

store.skin = 'default'

definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})
</script>

<template>
  <div class="public-page">
    <Navbar />
    <ContactUs />
    <Footer />
  </div>
</template>

<style scoped lang="scss">
.public-page {
  padding-block-start: 6rem;
}
</style>
