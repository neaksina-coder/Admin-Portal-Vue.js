<script setup lang="ts">
import Footer from '@/views/front-pages/front-page-footer.vue'
import Navbar from '@/views/front-pages/front-page-navbar.vue'

import paypalDark from '@images/icons/payments/img/paypal-dark.png'
import paypalLight from '@images/icons/payments/img/paypal-light.png'
import visaDark from '@images/icons/payments/img/visa-dark.png'
import visaLight from '@images/icons/payments/img/visa-light.png'

import { useConfigStore } from '@core/stores/config'
import type { CustomInputContent } from '@core/types'

const route = useRoute()
const router = useRouter()

const visa = useGenerateImageVariant(visaLight, visaDark)
const paypal = useGenerateImageVariant(paypalLight, paypalDark)
const store = useConfigStore()

store.skin = 'default'
definePage({
  meta: {
    layout: 'blank',
    public: true,
  },
})

const radioContent: CustomInputContent[] = [
  {
    title: 'Credit Card',
    value: 'credit card',
    images: visa.value,
  },
  {
    title: 'PayPal',
    value: 'paypal',
    images: paypal.value,
  },
]

const selectedRadio = ref('paypal')
const selectedCountry = ref('USA')
const isPricingPlanDialogVisible = ref(false)

const plans = ref<{ id: number; name: string; price: number }[]>([])
const selectedPlan = ref<string>((route.query.plan as string) || '')
const billingCycle = ref<'monthly' | 'yearly'>((route.query.cycle as 'monthly' | 'yearly') || 'monthly')
const paypalConfig = ref<{ clientId: string; currency: string } | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const form = reactive({
  businessName: '',
  email: '',
  password: '',
  zip: '',
})

const normalizedPlan = computed(() => {
  const raw = selectedPlan.value.trim().toLowerCase()
  if (!raw) return ''
  if (raw === 'starter') return 'basic'
  return raw
})

const planPrice = computed(() => {
  const match = plans.value.find(p => p.name.toLowerCase() === normalizedPlan.value)
  if (!match) return 0
  return billingCycle.value === 'yearly' ? match.price * 12 : match.price
})

const totalPrice = computed(() => planPrice.value)

const loadPlans = async () => {
  try {
    const response = await $api('/public/plans')
    const payload = response?.data ? response : response ?? {}
    const list = payload?.data ?? []
    plans.value = Array.isArray(list)
      ? list.map((plan: any) => ({
          id: Number(plan.id),
          name: String(plan.name),
          price: Number(plan.price || 0),
        }))
      : []
    if (!selectedPlan.value && plans.value.length)
      selectedPlan.value = plans.value[0].name
  }
  catch (error) {
    console.error(error)
  }
}

const loadPayPalConfig = async () => {
  const response = await $api('/public/paypal/config')
  paypalConfig.value = response
}

const loadPayPalSdk = async () => {
  if (!paypalConfig.value) return
  if ((window as any).paypal) return

  await new Promise<void>((resolve, reject) => {
    const scriptId = 'paypal-sdk'
    if (document.getElementById(scriptId)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalConfig.value!.clientId}&currency=${paypalConfig.value!.currency}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'))
    document.body.appendChild(script)
  })
}

const validateForm = () => {
  if (!form.businessName || !form.email || !form.password || !selectedPlan.value)
    return false
  return true
}

const renderPayPalButtons = async () => {
  if (selectedRadio.value !== 'paypal') return
  if (!validateForm()) return
  await loadPayPalSdk()
  const paypalWindow = (window as any).paypal
  if (!paypalWindow) return

  const container = document.getElementById('paypal-button-container')
  if (!container) return
  container.innerHTML = ''

  paypalWindow.Buttons({
    createOrder: async () => {
      errorMessage.value = ''
      try {
        const payload = {
          planName: selectedPlan.value,
          billingCycle: billingCycle.value,
          businessName: form.businessName,
          email: form.email,
          password: form.password,
        }
        const res = await $api('/public/paypal/orders', { method: 'POST', body: payload })
        return res.orderId
      }
      catch (error: any) {
        const detail = error?.data?.detail || error?.detail || error?.message
        errorMessage.value = detail || 'Unable to start payment. Please try another email.'
        throw error
      }
    },
    onApprove: async (data: any) => {
      isLoading.value = true
      try {
        await $api('/public/paypal/capture', {
          method: 'POST',
          body: { orderId: data.orderID },
        })
        router.push({ name: 'login' })
      }
      catch (error) {
        console.error(error)
        errorMessage.value = 'Payment failed. Please try again.'
      }
      finally {
        isLoading.value = false
      }
    },
  }).render('#paypal-button-container')
}

watch([selectedRadio, selectedPlan, billingCycle], () => {
  if (selectedRadio.value === 'paypal')
    renderPayPalButtons()
})

watch(
  () => [form.businessName, form.email, form.password],
  () => {
    if (selectedRadio.value === 'paypal')
      renderPayPalButtons()
  },
)

onMounted(async () => {
  await loadPlans()
  await loadPayPalConfig()
  if (selectedRadio.value === 'paypal')
    renderPayPalButtons()
})
</script>

<template>
  <!-- eslint-disable vue/attribute-hyphenation -->

  <div class="payment-page">
    <!-- 👉 Navbar -->
    <Navbar />

    <!-- 👉 Payment card  -->
    <VContainer>
      <div class="d-flex justify-center align-center payment-card">
        <VCard width="100%">
          <VRow>
            <VCol
              cols="12"
              md="7"
              :class="$vuetify.display.mdAndUp ? 'border-e' : 'border-b'"
            >
              <VCardText class="pa-8 pe-5">
                <!-- Checkout header -->
                <div>
                  <h4 class="text-h4 mb-2">
                    Checkout
                  </h4>
                  <div class="text-body-1">
                    All plans include 40+ advanced tools and features to boost your product. Choose the best plan to fit your needs.
                  </div>
                </div>

                <CustomRadios
                  v-model:selected-radio="selectedRadio"
                  :radio-content="radioContent"
                  :grid-column="{ cols: '12', sm: '6' }"
                  class="my-8"
                >
                  <template #default="{ item }">
                    <div class="d-flex align-center gap-x-4 ms-3">
                      <img
                        :src="item.images"
                        height="34"
                      >
                      <h6 class="text-h6">
                        {{ item.title }}
                      </h6>
                    </div>
                  </template>
                </CustomRadios>

                <!-- billing Details -->
                <div class="mb-8">
                  <h4 class="text-h4 mb-6">
                    Billing Details
                  </h4>
                  <VForm>
                    <VRow>
                      <VCol cols="12">
                        <AppTextField
                          v-model="form.businessName"
                          label="Business Name"
                          placeholder="Your company name"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="form.email"
                          label="Email Address"
                          type="email"
                          placeholder="johndoe@email.com"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="form.password"
                          label="Password"
                          type="password"
                          placeholder="············"
                          autocomplete="on"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppSelect
                          v-model="selectedCountry"
                          label="Billing Country"
                          :items="['USA', 'Canada', 'UK', 'AUS']"
                        />
                      </VCol>
                      <VCol
                        cols="12"
                        md="6"
                      >
                        <AppTextField
                          v-model="form.zip"
                          label="Billing Zip/Postal Code"
                          type="number"
                          placeholder="129211"
                        />
                      </VCol>
                    </VRow>
                  </VForm>
                </div>

                <!-- Credit card info -->
                <div
                  class="mb-8"
                  :class="selectedRadio === 'paypal' ? 'd-none' : 'd-block'"
                >
                  <h4 class="text-h4 mb-6">
                    Credit Card Info
                  </h4>
                  <VRow>
                    <VCol cols="12">
                      <AppTextField
                        label="Card Number"
                        placeholder="8787 2345 3458"
                        type="number"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="4"
                    >
                      <AppTextField
                        label="Card Holder"
                        placeholder="John Doe"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="4"
                    >
                      <AppTextField
                        label="Exp. date"
                        placeholder="05/2020"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="4"
                    >
                      <AppTextField
                        label="CVV"
                        type="number"
                        placeholder="784"
                      />
                    </VCol>
                  </VRow>
                </div>
              </VCardText>
            </VCol>

            <VCol
              cols="12"
              md="5"
            >
              <VCardText class="pa-8 ps-5">
                <!-- order summary -->
                <div class="mb-8">
                  <h4 class="text-h4 mb-2">
                    Order Summary
                  </h4>
                  <div class="text-body-1">
                    It can help you manage and service orders before, during, and after fulfillment.
                  </div>
                </div>

                <VCard
                  flat
                  color="rgba(var(--v-theme-on-surface), var(--v-hover-opacity))"
                >
                  <VCardText>
                    <div class="text-body-1">
                      {{ selectedPlan || 'Choose a plan' }}
                    </div>
                    <h1 class="text-h1 my-4">
                      ${{ planPrice.toFixed(2) }}<span class="text-body-1 font-weight-medium">/{{ billingCycle === 'yearly' ? 'year' : 'month' }}</span>
                    </h1>
                    <VBtn
                      variant="tonal"
                      block
                      @click="isPricingPlanDialogVisible = !isPricingPlanDialogVisible"
                    >
                      Change Plan
                    </VBtn>
                  </VCardText>
                </VCard>

                <div class="my-5">
                  <div class="d-flex justify-space-between mb-2">
                    <span>Subscription</span>
                    <h6 class="text-h6">
                      {{ planPrice.toFixed(2) }}
                    </h6>
                  </div>
<VDivider class="my-4" />
                  <div class="d-flex justify-space-between">
                    <span>Total</span>
                    <h6 class="text-h6">
                      {{ totalPrice.toFixed(2) }}
                    </h6>
                  </div>
                </div>

                <div v-if="errorMessage" class="text-error mb-4">
                  {{ errorMessage }}
                </div>

                <div v-if="selectedRadio === 'paypal'">
                  <div id="paypal-button-container" class="mb-6" />
                </div>
                <VBtn
                  v-else
                  block
                  color="success"
                  class="mb-8"
                  :disabled="true"
                >
                  Credit card checkout not enabled
                </VBtn>

                <div class="text-body-1">
                  By continuing, you accept to our Terms of Services and Privacy Policy. Please note that payments are non-refundable.
                </div>
              </VCardText>
            </VCol>
          </VRow>
        </VCard>
      </div>
    </VContainer>

    <!-- 👉 Footer -->
    <Footer />

    <PricingPlanDialog v-model:is-dialog-visible="isPricingPlanDialogVisible" />
  </div>
</template>

<style lang="scss" scoped>
.footer {
  position: static !important;
  inline-size: 100%;
  inset-block-end: 0;
}

.payment-card {
  margin-block: 10.5rem 5.25rem;
}

.payment-page {
  @media (min-width: 600px) and (max-width: 960px) {
    .v-container {
      padding-inline: 2rem !important;
    }
  }
}
</style>

<style lang="scss">
.payment-card {
  .custom-radio {
    .v-radio {
      margin-block-start: 0 !important;
    }
  }
}
</style>
