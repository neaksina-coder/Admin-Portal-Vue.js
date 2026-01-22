<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'
import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import authV2ResetPasswordIllustrationDark from '@images/pages/auth-v2-reset-password-illustration-dark.png'
import authV2ResetPasswordIllustrationLight from '@images/pages/auth-v2-reset-password-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'

definePage({
  meta: {
    layout: 'blank',
    unauthenticatedOnly: true,
  },
})

const router = useRouter()
const resetToken = useCookie<string | null>('resetToken')

const form = ref({
  newPassword: '',
  confirmPassword: '',
})

const refVForm = ref<VForm>()

const errors = ref<Record<string, string | undefined>>({
  newPassword: undefined,
  confirmPassword: undefined,
})

const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const isSubmitting = ref(false)

const authThemeImg = useGenerateImageVariant(
  authV2ResetPasswordIllustrationLight,
  authV2ResetPasswordIllustrationDark,
)

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark)

onMounted(() => {
  if (!resetToken.value)
    router.replace({ name: 'forgot-password' })
})

const resetPassword = async () => {
  if (!resetToken.value) {
    await router.push({ name: 'forgot-password' })
    return
  }

  try {
    isSubmitting.value = true
    errors.value = { newPassword: undefined, confirmPassword: undefined }

    await $api('/auth/reset-password', {
      method: 'POST',
      headers: new Headers({
        'X-Reset-Token': resetToken.value,
      }),
      body: {
        new_password: form.value.newPassword,
        confirm_password: form.value.confirmPassword,
      },
      onResponseError({ response }) {
        const apiErrors = response._data?.errors

        errors.value = {
          newPassword: apiErrors?.new_password ?? apiErrors?.newPassword ?? response._data?.message ?? 'Reset password failed',
          confirmPassword: apiErrors?.confirm_password ?? apiErrors?.confirmPassword,
        }
      },
    })

    resetToken.value = null
    await router.push({ name: 'login' })
  }
  catch (err) {
    console.error(err)
  }
  finally {
    isSubmitting.value = false
  }
}

const onSubmit = () => {
  refVForm.value?.validate()
    .then(({ valid: isValid }) => {
      if (isValid)
        resetPassword()
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
    no-gutters
    class="auth-wrapper bg-surface"
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
            max-width="451"
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
            Reset Password
          </h4>
          <p class="mb-0">
            Your new password must be different from previously used passwords.
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
                  v-model="form.newPassword"
                  autofocus
                  label="New Password"
                  placeholder="New password"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :rules="[requiredValidator]"
                  :error-messages="errors.newPassword"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="form.confirmPassword"
                  label="Confirm Password"
                  autocomplete="confirm-password"
                  placeholder="Confirm password"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :rules="[requiredValidator, confirmedValidator(form.confirmPassword, form.newPassword)]"
                  :error-messages="errors.confirmPassword"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  type="submit"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                >
                  Set New Password
                </VBtn>
              </VCol>

              <VCol cols="12">
                <RouterLink
                  class="d-flex align-center justify-center"
                  :to="{ name: 'login' }"
                >
                  <VIcon
                    icon="tabler-chevron-left"
                    size="20"
                    class="me-1 flip-in-rtl"
                  />
                  <span>Back to login</span>
                </RouterLink>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";
</style>
