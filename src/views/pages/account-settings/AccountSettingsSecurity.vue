<script lang="ts" setup>
import laptopGirl from '@images/illustrations/laptop-girl.png'

const isCurrentPasswordVisible = ref(false)
const isNewPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const isSaving = ref(false)
const currentPasswordError = ref<string | undefined>()
const newPasswordError = ref<string[] | undefined>()
const confirmPasswordError = ref<string | undefined>()

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const resetPasswordForm = () => {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  currentPasswordError.value = undefined
  newPasswordError.value = undefined
  confirmPasswordError.value = undefined
}

const validateNewPassword = (password: string) => {
  const errors: string[] = []

  if (password.length < 8)
    errors.push('Password must be at least 8 characters long')
  if (!/[a-z]/.test(password))
    errors.push('Password must include at least one lowercase letter')
  if (!/[A-Z]/.test(password))
    errors.push('Password must include at least one uppercase letter')
  if (!/[\W_]/.test(password))
    errors.push('Password must include at least one symbol')

  return errors
}

const updatePassword = async () => {
  currentPasswordError.value = undefined
  newPasswordError.value = undefined
  confirmPasswordError.value = undefined

  if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
    if (!currentPassword.value)
      currentPasswordError.value = 'Current password is required'
    if (!newPassword.value)
      newPasswordError.value = 'New password is required'
    if (!confirmPassword.value)
      confirmPasswordError.value = 'Confirm password is required'
    return
  }

  const validationErrors = validateNewPassword(newPassword.value)
  if (validationErrors.length) {
    newPasswordError.value = validationErrors
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match'
    return
  }

  isSaving.value = true
  try {
    const res = await $api('/users/me/password', {
      method: 'PUT',
      body: {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value,
      },
    })

    showSnackbar(res?.message || 'Password updated successfully.')
    resetPasswordForm()
  }
  catch (error) {
    const apiMessage = (error as any)?.data?.message || (error as any)?.response?._data?.message
    if (apiMessage === 'Current password is incorrect')
      currentPasswordError.value = apiMessage
    else
      showSnackbar(apiMessage || 'Failed to update password.', 'error')
  }
  finally {
    isSaving.value = false
  }
}

const passwordRequirements = [
  'Minimum 8 characters long - the more, the better',
  'At least one lowercase character',
  'At least one number, symbol, or whitespace character',
]

const serverKeys = [
  {
    name: 'Server Key 1',
    key: '23eaf7f0-f4f7-495e-8b86-fad3261282ac',
    createdOn: '28 Apr 2021, 18:20 GTM+4:10',
    permission: 'Full Access',
  },
  {
    name: 'Server Key 2',
    key: 'bb98e571-a2e2-4de8-90a9-2e231b5e99',
    createdOn: '12 Feb 2021, 10:30 GTM+2:30',
    permission: 'Read Only',
  },
  {
    name: 'Server Key 3',
    key: '2e915e59-3105-47f2-8838-6e46bf83b711',
    createdOn: '28 Dec 2020, 12:21 GTM+4:10',
    permission: 'Full Access',
  },
]

const recentDevicesHeaders = [
  { title: 'BROWSER', key: 'browser' },
  { title: 'DEVICE', key: 'device' },
  { title: 'LOCATION', key: 'location' },
  { title: 'RECENT ACTIVITY', key: 'recentActivity' },
]

const recentDevices = [
  {
    browser: 'Chrome on Windows',
    device: 'HP Spectre 360',
    location: 'New York, NY',
    recentActivity: '28 Apr 2022, 18:20',
    deviceIcon: { icon: 'tabler-brand-windows', color: 'primary' },
  },
  {
    browser: 'Chrome on iPhone',
    device: 'iPhone 12x',
    location: 'Los Angeles, CA',
    recentActivity: '20 Apr 2022, 10:20',
    deviceIcon: { icon: 'tabler-device-mobile', color: 'error' },
  },
  {
    browser: 'Chrome on Android',
    device: 'Oneplus 9 Pro',
    location: 'San Francisco, CA',
    recentActivity: '16 Apr 2022, 04:20',
    deviceIcon: { icon: 'tabler-brand-android', color: 'success' },
  },
  {
    browser: 'Chrome on macOS',
    device: 'Apple iMac',
    location: 'New York, NY',
    recentActivity: '28 Apr 2022, 18:20',
    deviceIcon: { icon: 'tabler-brand-apple', color: 'secondary' },
  },
  {
    browser: 'Chrome on Windows',
    device: 'HP Spectre 360',
    location: 'Los Angeles, CA',
    recentActivity: '20 Apr 2022, 10:20',
    deviceIcon: { icon: 'tabler-brand-windows', color: 'primary' },
  },
  {
    browser: 'Chrome on Android',
    device: 'Oneplus 9 Pro',
    location: 'San Francisco, CA',
    recentActivity: '16 Apr 2022, 04:20',
    deviceIcon: { icon: 'tabler-brand-android', color: 'success' },
  },
]

const isOneTimePasswordDialogVisible = ref(false)
</script>

<template>
  <VRow>
    <!-- SECTION: Change Password -->
    <VCol cols="12">
      <VCard title="Change Password">
        <VForm @submit.prevent="updatePassword">
          <VCardText class="pt-0">
            <!-- 👉 Current Password -->
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <!-- 👉 current password -->
                <AppTextField
                  v-model="currentPassword"
                  :type="isCurrentPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isCurrentPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  label="Current Password"
                  autocomplete="on"
                  placeholder="············"
                  :disabled="isSaving"
                  :error-messages="currentPasswordError ? [currentPasswordError] : []"
                  @update:model-value="currentPasswordError = undefined"
                  @click:append-inner="isCurrentPasswordVisible = !isCurrentPasswordVisible"
                />
              </VCol>
            </VRow>

            <!-- 👉 New Password -->
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <!-- 👉 new password -->
                <AppTextField
                  v-model="newPassword"
                  :type="isNewPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isNewPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  label="New Password"
                  autocomplete="on"
                  placeholder="············"
                  :disabled="isSaving"
                  :error-messages="newPasswordError || []"
                  @update:model-value="newPasswordError = undefined"
                  @click:append-inner="isNewPasswordVisible = !isNewPasswordVisible"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <!-- 👉 confirm password -->
                <AppTextField
                  v-model="confirmPassword"
                  :type="isConfirmPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  label="Confirm New Password"
                  autocomplete="on"
                  placeholder="············"
                  :disabled="isSaving"
                  :error-messages="confirmPasswordError ? [confirmPasswordError] : []"
                  @update:model-value="confirmPasswordError = undefined"
                  @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                />
              </VCol>
            </VRow>
          </VCardText>

          <!-- 👉 Password Requirements -->
          <VCardText>
            <h6 class="text-h6 text-medium-emphasis mb-4">
              Password Requirements:
            </h6>

            <VList class="card-list">
              <VListItem
                v-for="item in passwordRequirements"
                :key="item"
                :title="item"
                class="text-medium-emphasis"
              >
                <template #prepend>
                  <VIcon
                    size="10"
                    icon="tabler-circle-filled"
                  />
                </template>
              </VListItem>
            </VList>
          </VCardText>

          <!-- 👉 Action Buttons -->
          <VCardText class="d-flex flex-wrap gap-4">
            <VBtn
              type="submit"
              :loading="isSaving"
              :disabled="isSaving"
            >
              Save changes
            </VBtn>

            <VBtn
              type="reset"
              color="secondary"
              variant="tonal"
              :disabled="isSaving"
              @click.prevent="resetPasswordForm"
            >
              Reset
            </VBtn>
          </VCardText>
        </VForm>
      </VCard>
    </VCol>
    <!-- !SECTION -->

    <!-- SECTION Two-steps verification -->
    <VCol cols="12">
      <VCard title="Two-steps verification">
        <VCardText>
          <h5 class="text-h5 text-medium-emphasis mb-4">
            Two factor authentication is not enabled yet.
          </h5>
          <p class="mb-6">
            Two-factor authentication adds an additional layer of security to your account by
            requiring more than just a password to log in.
            <a
              href="javascript:void(0)"
              class="text-decoration-none"
            >Learn more.</a>
          </p>

          <VBtn @click="isOneTimePasswordDialogVisible = true">
            Enable two-factor authentication
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
    <!-- !SECTION -->

    <VCol cols="12">
      <!-- SECTION: Create an API key -->
      <VCard title="Create an API key">
        <VRow no-gutters>
          <!-- 👉 Choose API Key -->
          <VCol
            cols="12"
            md="5"
            order-md="0"
            order="1"
          >
            <VCardText class="pt-1">
              <VForm @submit.prevent="() => { }">
                <VRow>
                  <!-- 👉 Choose API Key -->
                  <VCol cols="12">
                    <AppSelect
                      label="Choose the API key type you want to create"
                      placeholder="Select API key type"
                      :items="['Full Control', 'Modify', 'Read & Execute', 'List Folder Contents', 'Read Only', 'Read & Write']"
                    />
                  </VCol>

                  <!-- 👉 Name the API Key -->
                  <VCol cols="12">
                    <AppTextField
                      label="Name the API key"
                      placeholder="Name the API key"
                    />
                  </VCol>

                  <!-- 👉 Create Key Button -->
                  <VCol cols="12">
                    <VBtn
                      type="submit"
                      block
                    >
                      Create Key
                    </VBtn>
                  </VCol>
                </VRow>
              </VForm>
            </VCardText>
          </VCol>

          <!-- 👉 Lady image -->
          <VCol
            cols="12"
            md="7"
            order="0"
            order-md="1"
            class="d-flex flex-column justify-center align-center"
          >
            <VImg
              :src="laptopGirl"
              :width="$vuetify.display.smAndDown ? '150' : '200'"
              :style="$vuetify.display.smAndDown ? 'margin-block-end: 24px' : 'position: absolute; bottom: 0;'"
            />
          </VCol>
        </VRow>
      </VCard>
      <!-- !SECTION -->
    </VCol>

    <VCol cols="12">
      <!-- SECTION: API Keys List -->
      <VCard>
        <VCardItem class="pb-4">
          <VCardTitle>API Key List & Access</VCardTitle>
        </VCardItem>
        <VCardText>
          An API key is a simple encrypted string that identifies an application without any principal. They are useful
          for accessing public data anonymously, and are used to associate API requests with your project for quota and
          billing.
        </VCardText>

        <!-- 👉 Server Status -->
        <VCardText class="d-flex flex-column gap-y-6">
          <VCard
            v-for="serverKey in serverKeys"
            :key="serverKey.key"
            flat
            class="pa-4"
            color="rgba(var(--v-theme-on-surface),var(--v-hover-opacity))"
          >
            <div class="d-flex flex-column gap-y-2">
              <div class="d-flex align-center flex-wrap">
                <h5 class="text-h5 me-3">
                  {{ serverKey.name }}
                </h5>
                <VChip
                  label
                  color="primary"
                  size="small"
                >
                  {{ serverKey.permission }}
                </VChip>
              </div>
              <div class="d-flex align-center text-base font-weight-medium">
                <h6 class="text-h6 text-medium-emphasis me-3">
                  {{ serverKey.key }}
                </h6>
                <div class="cursor-pointer">
                  <VIcon
                    icon="tabler-copy"
                    size="20"
                  />
                </div>
              </div>
              <div class="text-disabled">
                Created on {{ serverKey.createdOn }}
              </div>
            </div>
          </VCard>
        </VCardText>
      </VCard>
      <!-- !SECTION -->
    </VCol>

    <!-- SECTION Recent Devices -->
    <VCol cols="12">
      <!-- 👉 Table -->
      <VCard title="Recent Devices">
        <VDivider />

        <VDataTable
          :headers="recentDevicesHeaders"
          :items="recentDevices"
          hide-default-footer
          class="text-no-wrap"
        >
          <template #item.browser="{ item }">
            <div class="d-flex">
              <VIcon
                start
                size="22"
                :icon="item.deviceIcon.icon"
                :color="item.deviceIcon.color"
              />
              <div class="text-high-emphasis text-body-1 font-weight-medium">
                {{ item.browser }}
              </div>
            </div>
          </template>
          <!-- TODO Refactor this after vuetify provides proper solution for removing default footer -->
          <template #bottom />
        </VDataTable>
      </VCard>
    </VCol>
    <!-- !SECTION -->
  </VRow>

  <!-- SECTION Enable One time password -->
  <TwoFactorAuthDialog v-model:is-dialog-visible="isOneTimePasswordDialogVisible" />
  <!-- !SECTION -->

  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    :timeout="3000"
    location="top"
  >
    {{ snackbarText }}
  </VSnackbar>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}

.server-close-btn {
  inset-inline-end: 0.5rem;
}
</style>
