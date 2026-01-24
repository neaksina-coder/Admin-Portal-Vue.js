<script lang="ts" setup>
import avatar1 from '@images/avatars/avatar-1.png'

type AccountForm = {
  avatarImg: string
  firstName: string
  lastName: string
  email: string
  company: string
  country: string
  contact: string
}

const accountData = ref<AccountForm>({
  avatarImg: avatar1,
  firstName: '',
  lastName: '',
  email: '',
  company: '',
  country: '',
  contact: '',
})

const userData = useCookie<any>('userData')

const refInputEl = ref<HTMLInputElement>()
const selectedAvatarFile = ref<File | null>(null)

const isConfirmDialogOpen = ref(false)
const isAccountDeactivated = ref(false)
const isLoading = ref(false)
const isSaving = ref(false)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const cloneAccount = (data: AccountForm): AccountForm => ({
  avatarImg: data.avatarImg,
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,
  company: data.company,
  country: data.country,
  contact: data.contact,
})

const accountDataLocal = ref(cloneAccount(accountData.value))
const validateAccountDeactivation = [(v: string) => !!v || 'Please confirm account deactivation']

const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const splitFullName = (fullName: string) => {
  const normalized = fullName.trim()
  if (!normalized)
    return { firstName: '', lastName: '' }

  const parts = normalized.split(/\s+/)
  const firstName = parts.shift() ?? ''
  const lastName = parts.join(' ')

  return { firstName, lastName }
}

const applyAccountData = (data: any) => {
  const { firstName, lastName } = splitFullName(data?.fullName ?? '')

  accountData.value = {
    avatarImg: data?.profile?.profileImage || avatar1,
    firstName,
    lastName,
    email: data?.email ?? '',
    company: data?.profile?.company ?? '',
    country: data?.profile?.country ?? '',
    contact: data?.profile?.contact ?? '',
  }

  accountDataLocal.value = cloneAccount(accountData.value)

  if (userData.value) {
    userData.value = {
      ...userData.value,
      fullName: data?.fullName ?? userData.value.fullName,
      email: data?.email ?? userData.value.email,
      avatar: data?.profile?.profileImage ?? userData.value.avatar,
      profile: {
        ...(userData.value.profile ?? {}),
        company: data?.profile?.company ?? userData.value.profile?.company ?? '',
        country: data?.profile?.country ?? userData.value.profile?.country ?? '',
        contact: data?.profile?.contact ?? userData.value.profile?.contact ?? '',
        profileImage: data?.profile?.profileImage ?? userData.value.profile?.profileImage ?? '',
      },
    }
  }
}

const fetchAccount = async () => {
  isLoading.value = true
  try {
    const data = await $api('/users/me')
    applyAccountData(data)
  }
  catch (error) {
    showSnackbar('Failed to load account data.', 'error')
  }
  finally {
    isLoading.value = false
  }
}

onMounted(fetchAccount)

const resetForm = () => {
  accountDataLocal.value = cloneAccount(accountData.value)
  selectedAvatarFile.value = null
  if (refInputEl.value)
    refInputEl.value.value = ''
}

// changeAvatar function
const changeAvatar = (event: Event) => {
  const fileReader = new FileReader()
  const { files } = event.target as HTMLInputElement

  if (files && files.length) {
    const file = files[0]

    selectedAvatarFile.value = file
    fileReader.readAsDataURL(file)
    fileReader.onload = () => {
      if (typeof fileReader.result === 'string')
        accountDataLocal.value.avatarImg = fileReader.result
    }
  }
}

// reset avatar image
const resetAvatar = () => {
  selectedAvatarFile.value = null
  accountDataLocal.value.avatarImg = accountData.value.avatarImg
  if (refInputEl.value)
    refInputEl.value.value = ''
}

const buildFullName = () => [accountDataLocal.value.firstName, accountDataLocal.value.lastName]
  .filter(Boolean)
  .join(' ')
  .trim()

const saveAccount = async () => {
  isSaving.value = true
  try {
    const formData = new FormData()
    const fullName = buildFullName()

    if (fullName)
      formData.append('fullName', fullName)
    if (accountDataLocal.value.email)
      formData.append('email', accountDataLocal.value.email)
    if (accountDataLocal.value.company)
      formData.append('company', accountDataLocal.value.company)
    if (accountDataLocal.value.country)
      formData.append('country', accountDataLocal.value.country)
    if (accountDataLocal.value.contact)
      formData.append('contact', accountDataLocal.value.contact)
    if (selectedAvatarFile.value)
      formData.append('profileImage', selectedAvatarFile.value)

    const data = await $api('/users/me', {
      method: 'PUT',
      body: formData,
    })

    applyAccountData(data)
    selectedAvatarFile.value = null
    if (refInputEl.value)
      refInputEl.value.value = ''

    showSnackbar('Account updated successfully.')
  }
  catch (error) {
    showSnackbar('Failed to update account.', 'error')
  }
  finally {
    isSaving.value = false
  }
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardText class="d-flex">
          <!-- ðŸ‘‰ Avatar -->
          <VAvatar
            rounded
            size="100"
            class="me-6"
            :image="accountDataLocal.avatarImg"
          />

          <!-- ðŸ‘‰ Upload Photo -->
          <form class="d-flex flex-column justify-center gap-4">
            <div class="d-flex flex-wrap gap-4">
              <VBtn
                color="primary"
                size="small"
                :disabled="isLoading"
                @click="refInputEl?.click()"
              >
                <VIcon
                  icon="tabler-cloud-upload"
                  class="d-sm-none"
                />
                <span class="d-none d-sm-block">Upload new photo</span>
              </VBtn>

              <input
                ref="refInputEl"
                type="file"
                name="file"
                accept=".jpeg,.png,.jpg,GIF"
                hidden
                @input="changeAvatar"
              >

              <VBtn
                type="reset"
                size="small"
                color="secondary"
                variant="tonal"
                :disabled="isLoading"
                @click="resetAvatar"
              >
                <span class="d-none d-sm-block">Reset</span>
                <VIcon
                  icon="tabler-refresh"
                  class="d-sm-none"
                />
              </VBtn>
            </div>

            <p class="text-body-1 mb-0">
              Allowed JPG, GIF or PNG. Max size of 800K
            </p>
          </form>
        </VCardText>

        <VCardText class="pt-2">
          <!-- ðŸ‘‰ Form -->
          <VForm
            class="mt-3"
            @submit.prevent="saveAccount"
          >
            <VRow>
              <!-- ðŸ‘‰ First Name -->
              <VCol
                md="6"
                cols="12"
              >
                <AppTextField
                  v-model="accountDataLocal.firstName"
                  placeholder="John"
                  label="First Name"
                  :disabled="isLoading"
                />
              </VCol>

              <!-- ðŸ‘‰ Last Name -->
              <VCol
                md="6"
                cols="12"
              >
                <AppTextField
                  v-model="accountDataLocal.lastName"
                  placeholder="Doe"
                  label="Last Name"
                  :disabled="isLoading"
                />
              </VCol>

              <!-- ðŸ‘‰ Email -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="accountDataLocal.email"
                  label="E-mail"
                  placeholder="johndoe@gmail.com"
                  type="email"
                  :disabled="isLoading"
                />
              </VCol>

              <!-- ðŸ‘‰ Company -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="accountDataLocal.company"
                  label="Company"
                  placeholder="PNC"
                  :disabled="isLoading"
                />
              </VCol>

              <!-- ðŸ‘‰ Contact -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="accountDataLocal.contact"
                  label="Contact"
                  placeholder="0969780938"
                  :disabled="isLoading"
                />
              </VCol>

              <!-- ðŸ‘‰ Country -->
              <VCol
                cols="12"
                md="6"
              >
                <AppTextField
                  v-model="accountDataLocal.country"
                  label="Country"
                  placeholder="Cambodia"
                  :disabled="isLoading"
                />
              </VCol>

              <!-- ðŸ‘‰ Form Actions -->
              <VCol
                cols="12"
                class="d-flex flex-wrap gap-4"
              >
                <VBtn
                  type="submit"
                  :loading="isSaving"
                  :disabled="isLoading"
                >
                  Save changes
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="tonal"
                  type="reset"
                  :disabled="isLoading || isSaving"
                  @click.prevent="resetForm"
                >
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

   
  </VRow>

  <!-- Confirm Dialog -->
  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDialogOpen"
    confirmation-question="Are you sure you want to deactivate your account?"
    confirm-title="Deactivated!"
    confirm-msg="Your account has been deactivated successfully."
    cancel-title="Cancelled"
    cancel-msg="Account Deactivation Cancelled!"
  />

  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    :timeout="3000"
    location="top"
  >
    {{ snackbarText }}
  </VSnackbar>
</template>
