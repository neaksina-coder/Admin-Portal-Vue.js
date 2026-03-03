<script setup lang="ts">
import ConnectImg from '@images/front-pages/landing-page/contact-customer-service.png'

const BUSINESS_ID = Number(import.meta.env.VITE_BUSINESS_ID ?? 1)

const name = ref('')
const email = ref('')
const phone = ref('')
const company = ref('')
const serviceInterest = ref('')
const subject = ref('')
const message = ref('')

const isSubmitting = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const submitInquiry = async () => {
  if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
    showSnackbar('Please provide your name, email, and message.', 'error')
    return
  }

  const payload: Record<string, any> = {
    businessId: BUSINESS_ID,
    name: name.value.trim(),
    email: email.value.trim(),
    message: message.value.trim(),
  }

  if (phone.value.trim())
    payload.phone = phone.value.trim()
  if (company.value.trim())
    payload.company = company.value.trim()
  if (serviceInterest.value.trim())
    payload.serviceInterest = serviceInterest.value.trim()
  if (subject.value.trim())
    payload.subject = subject.value.trim()

  try {
    isSubmitting.value = true
    await $api('/public/contact-inquiries', {
      method: 'POST',
      body: payload,
    })
    showSnackbar('Thanks! Your inquiry was sent.')
    name.value = ''
    email.value = ''
    phone.value = ''
    company.value = ''
    serviceInterest.value = ''
    subject.value = ''
    message.value = ''
  }
  catch (error) {
    showSnackbar('Failed to send inquiry. Please try again later.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <VContainer id="contact-us">
    <!-- 👉 Headers  -->
    <div class="contact-us-section">
      <div class="headers d-flex justify-center flex-column align-center pb-16">
        <VChip
          label
          color="primary"
          class="mb-4"
          size="small"
        >
          Contact Us
        </VChip>
        <h4 class="d-flex align-center text-h4 mb-1 flex-wrap justify-center">
          <div class="position-relative me-2">
            <div class="section-title">
              let's work
            </div>
          </div>
          together
        </h4>
        <p class="text-body-1 mb-0">
          Any question or remark? just write us a message
        </p>
      </div>

      <div class="mb-15">
        <VRow class="match-height">
          <VCol
            cols="12"
            md="5"
          >
            <div class="contact-card h-100">
              <VCard
                variant="outlined"
                border
                class="pa-2"
                :style="{ borderRadius: '3.75rem 0.375rem 0.375rem 0.375rem' }"
              >
                <VImg
                  :src="ConnectImg"
                  :style="{ borderRadius: '3.75rem 0.375rem 0.375rem 0.375rem' }"
                />
                <VCardText class="pa-4 pb-1">
                  <div class="d-flex justify-space-between flex-wrap gap-y-4">
                    <div
                      v-for="(item, index) in [
                        { title: 'Email', icon: 'tabler-mail', color: 'primary', value: 'example@gmail.com' },
                        { title: 'Phone', icon: 'tabler-phone-call', color: 'success', value: '+1234 568 963' },
                      ]"
                      :key="index"
                      class="d-flex gap-x-3 align-center"
                    >
                      <div>
                        <VAvatar
                          size="36"
                          :color="item.color"
                          variant="tonal"
                          class="rounded-sm"
                        >
                          <VIcon
                            :icon="item.icon"
                            size="24"
                          />
                        </VAvatar>
                      </div>

                      <div>
                        <div class="text-body-1">
                          {{ item .title }}
                        </div>
                        <h6 class="text-h6">
                          {{ item.value }}
                        </h6>
                      </div>
                    </div>
                  </div>
                </VCardText>
              </VCard>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="7"
          >
            <VCard>
              <VCardItem class="pb-0">
                <h4 class="text-h4 mb-1">
                  Send a message
                </h4>
              </VCardItem>

              <VCardText>
                <p class="mb-6">
                  If you would like to discuss anything related to payment, account, licensing, partnerships, or have pre-sales questions, you’re at the right place.
                </p>
                <VForm @submit.prevent="submitInquiry">
                  <VRow>
                    <VCol
                      cols="12"
                      md="6"
                    >
                      <AppTextField
                        v-model="name"
                        placeholder="John Doe"
                        label="Full Name"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <AppTextField
                        v-model="email"
                        placeholder="johndoe@gmail.com"
                        label="Email address"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <AppTextField
                        v-model="phone"
                        placeholder="+123456789"
                        label="Phone"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <AppTextField
                        v-model="company"
                        placeholder="Company name"
                        label="Company"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <AppTextField
                        v-model="serviceInterest"
                        placeholder="Website + SEO"
                        label="Service interest"
                      />
                    </VCol>

                    <VCol
                      cols="12"
                      md="6"
                    >
                      <AppTextField
                        v-model="subject"
                        placeholder="Need a quote"
                        label="Subject"
                      />
                    </VCol>

                    <VCol cols="12">
                      <AppTextarea
                        v-model="message"
                        placeholder="Write a message"
                        rows="3"
                        label="Message"
                      />
                    </VCol>

                    <VCol>
                      <VBtn type="submit" :loading="isSubmitting">
                        Send Inquiry
                      </VBtn>
                    </VCol>
                  </VRow>
                </VForm>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </div>
    </div>

    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
    </VSnackbar>
  </VContainer>
</template>

<style lang="scss" scoped>
.contact-us-section {
  margin-block: 5.25rem;
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
  inline-size: 120%;
  inset-block-end: 12%;
  inset-inline-start: -12%;
}

.contact-card {
  position: relative;
}

.contact-card::before {
  position: absolute;
  content: url("@images/front-pages/icons/contact-border.png");
  inset-block-start: -2.5rem;
  inset-inline-start: -2.5rem;
}

@media screen and (max-width: 999px) {
  .contact-card::before {
    display: none;
  }
}
</style>
