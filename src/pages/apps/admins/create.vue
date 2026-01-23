<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'

definePage({
  meta: {
    action: 'manage',
    subject: 'Admins',
  },
})

const refVForm = ref<VForm>()

const form = ref({
  username: '',
  email: '',
  password: '',
  privacyPolicies: false,
})

const errors = ref<Record<string, string | undefined>>({
  username: undefined,
  email: undefined,
  password: undefined,
})

const isPasswordVisible = ref(false)
const successMessage = ref('')

const createAdmin = async () => {
  try {
    errors.value = {
      username: undefined,
      email: undefined,
      password: undefined,
    }
    successMessage.value = ''

    await $api('/users/admins', {
      method: 'POST',
      body: {
        email: form.value.email,
        username: form.value.username,
        password: form.value.password,
        privacy_policy_accepted: form.value.privacyPolicies,
      },
      onResponseError({ response }) {
        errors.value = response._data?.errors ?? {
          email: response._data?.detail ?? response._data?.message ?? 'Create admin failed',
        }
      },
    })

    successMessage.value = 'Admin account created successfully.'
    form.value = {
      username: '',
      email: '',
      password: '',
      privacyPolicies: false,
    }
    refVForm.value?.resetValidation()
  }
  catch (err) {
    console.error(err)
  }
}

const onSubmit = () => {
  refVForm.value?.validate()
    .then(({ valid: isValid }) => {
      if (isValid)
        createAdmin()
    })
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>Create Admin</VCardTitle>
        </VCardItem>
        <VCardText>
          <p class="mb-6 text-body-1">
            Superuser only: create a new admin account.
          </p>

          <VAlert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-6"
          >
            {{ successMessage }}
          </VAlert>

          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.username"
                  :rules="[requiredValidator]"
                  label="Username"
                  placeholder="admin_user"
                  :error-messages="errors.username"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  type="email"
                  placeholder="admin@example.com"
                  :error-messages="errors.email"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.password"
                  :rules="[requiredValidator]"
                  label="Password"
                  placeholder="••••••••••••"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  autocomplete="new-password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :error-messages="errors.password"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />
              </VCol>

              <VCol cols="12" md="6">
                <div class="d-flex align-center h-100">
                  <VCheckbox
                    id="privacy-policy"
                    v-model="form.privacyPolicies"
                    inline
                    :rules="[requiredValidator]"
                  />
                  <VLabel
                    for="privacy-policy"
                    style="opacity: 1;"
                  >
                    <span class="me-1 text-high-emphasis">I agree to</span>
                    <a
                      href="javascript:void(0)"
                      class="text-primary"
                    >privacy policy & terms</a>
                  </VLabel>
                </div>
              </VCol>

              <VCol cols="12">
                <VBtn type="submit">
                  Create Admin
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
