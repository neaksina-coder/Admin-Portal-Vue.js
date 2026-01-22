<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2TwoStepIllustrationDark from '@images/pages/auth-v2-two-step-illustration-dark.png'
import authV2TwoStepIllustrationLight from '@images/pages/auth-v2-two-step-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const router = useRouter()
const route = useRoute()

const form = ref({
  email: String(route.query.email ?? ''),
  otp: '',
})

const refVForm = ref<VForm>()

const errors = ref<Record<string, string | undefined>>({
  email: undefined,
  otp: undefined,
})

const isSubmitting = ref(false)

const authThemeImg = useGenerateImageVariant(
  authV2TwoStepIllustrationLight,
  authV2TwoStepIllustrationDark,
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

const verifyOtp = async () => {
  try {
    isSubmitting.value = true
    errors.value = { email: undefined, otp: undefined }

    const res = await $api('/auth/otp/verify', {
      method: 'POST',
      body: {
        email: form.value.email,
        otp: form.value.otp,
      },
      onResponseError({ response }) {
        const apiErrors = response._data?.errors

        errors.value = {
          email: apiErrors?.email,
          otp: apiErrors?.otp ?? response._data?.message ?? 'OTP verification failed',
        }
      },
    })

    useCookie('resetToken').value = res.reset_token
    await router.push({ name: 'reset-password' })
  }
  catch (err) {
    console.error(err)
  }
  finally {
    isSubmitting.value = false
  }
}

const resendOtp = async () => {
  if (!form.value.email) {
    errors.value.email = 'This field is required'
    return
  }

  try {
    await $api('/auth/forgot-password', {
      method: 'POST',
      body: {
        email: form.value.email,
      },
    })
  }
  catch (err) {
    console.error(err)
  }
}

const onSubmit = () => {
  refVForm.value?.validate()
    .then(({ valid: isValid }) => {
      errors.value.otp = form.value.otp ? undefined : 'OTP is required'

      if (isValid && form.value.otp)
        verifyOtp()
    })
}
</script>

<template>
  <RouterLink to="/">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </RouterLink>

  <VRow
    class="auth-wrapper bg-surface"
    no-gutters
  >
    <VCol
      md="8"
      class="d-none d-md-flex"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 150px;"
        >
          <VImg
            max-width="468"
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
          />
        </div>

        <img
          class="auth-footer-mask flip-in-rtl"
          :src="authThemeMask"
          alt="auth-footer-mask"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      cols="12"
      md="4"
      class="auth-card-v2 d-flex align-center justify-center"
    >
      <VCard
        flat
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            OTP Verification
          </h4>
          <p class="mb-1">
            Enter the 6 digit code sent to your email.
          </p>
        </VCardText>

        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="form.email"
                  label="Email"
                  type="email"
                  placeholder="johndoe@email.com"
                  :rules="[requiredValidator, emailValidator]"
                  :error-messages="errors.email"
                />
              </VCol>

              <VCol cols="12">
                <h6 class="text-body-1 mb-2">
                  OTP Code
                </h6>
                <VOtpInput
                  v-model="form.otp"
                  type="number"
                  class="pa-0"
                />
                <div
                  v-if="errors.otp"
                  class="text-error text-caption mt-2"
                >
                  {{ errors.otp }}
                </div>
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                >
                  Verify OTP
                </VBtn>
              </VCol>

              <VCol cols="12">
                <div class="d-flex justify-center align-center flex-wrap">
                  <span class="me-1">Didn't get the code?</span>
                  <VBtn
                    variant="text"
                    size="small"
                    @click="resendOtp"
                  >
                    Resend
                  </VBtn>
                </div>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";

.v-otp-input {
  .v-otp-input__content {
    padding-inline: 0;
  }
}
</style>
