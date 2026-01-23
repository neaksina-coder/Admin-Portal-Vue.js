<script setup lang="ts">
import RoleCards from '@/views/apps/roles/RoleCards.vue'
import UserList from '@/views/apps/roles/UserList.vue'

definePage({
  meta: {
    action: 'manage',
    subject: 'Roles',
  },
})

const userData = useCookie<any>('userData')
const isSuperuser = computed(() => userData.value?.role === 'superuser')

const isCreateSuperuserDialogVisible = ref(false)
const isFormValid = ref(false)
const refForm = ref()
const fullName = ref('')
const email = ref('')
const password = ref('')
const plan = ref('team')
const billing = ref('Manual-PayPal')
const status = ref('active')
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref<'success' | 'error'>('success')

const userListRef = ref<InstanceType<typeof UserList>>()

const resetForm = () => {
  fullName.value = ''
  email.value = ''
  password.value = ''
  plan.value = 'team'
  billing.value = 'Manual-PayPal'
  status.value = 'active'
}

const showSnackbar = (text: string, color: 'success' | 'error' = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const submitCreateSuperuser = async () => {
  refForm.value?.validate().then(async ({ valid }: { valid: boolean }) => {
    if (!valid)
      return

    try {
      await $api('/users/superusers', {
        method: 'POST',
        body: {
          fullName: fullName.value,
          email: email.value,
          password: password.value,
          role: 'superuser',
          plan: plan.value,
          billing: billing.value,
          status: status.value,
        },
      })

      showSnackbar('Superuser created successfully.')
      isCreateSuperuserDialogVisible.value = false
      resetForm()
      userListRef.value?.refresh?.()
    }
    catch (error) {
      showSnackbar('Failed to create superuser.', 'error')
    }
  })
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <div class="d-flex flex-wrap align-center justify-space-between gap-4">
        <div>
         
         
        </div>

        <VBtn
          v-if="isSuperuser"
          prepend-icon="tabler-user-plus"
          @click="isCreateSuperuserDialogVisible = true"
        >
          Create Superuser
        </VBtn>
      </div>
    </VCol>


    <VCol cols="12">
      <h4 class="text-h4 mb-1 mt-6">
        Total users with their roles
      </h4>
      <p class="text-body-1 mb-0">
        Find all of your company's administrator accounts and their associate roles.
      </p>
    </VCol>

    <VCol cols="12">
      <!-- User List -->
      <UserList ref="userListRef" />
    </VCol>
  </VRow>

  <VDialog
    v-model="isCreateSuperuserDialogVisible"
    max-width="600"
  >
    <VCard>
      <VCardTitle>Create Superuser</VCardTitle>
      <VCardText>
        <VForm
          ref="refForm"
          v-model="isFormValid"
          @submit.prevent="submitCreateSuperuser"
        >
          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="fullName"
                label="Full Name"
                :rules="[requiredValidator]"
                placeholder="Super User"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="email"
                label="Email"
                :rules="[requiredValidator, emailValidator]"
                placeholder="super@example.com"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="password"
                label="Password"
                :rules="[requiredValidator]"
                type="password"
                autocomplete="new-password"
              />
            </VCol>
            <VCol cols="12">
              <AppSelect
                v-model="plan"
                label="Plan"
                :items="['basic', 'company', 'enterprise', 'team']"
                :rules="[requiredValidator]"
              />
            </VCol>
            <VCol cols="12">
              <AppSelect
                v-model="billing"
                label="Billing"
                :items="['Manual-PayPal', 'Auto Debit']"
                :rules="[requiredValidator]"
              />
            </VCol>
            <VCol cols="12">
              <AppSelect
                v-model="status"
                label="Status"
                :items="['active', 'inactive', 'pending']"
                :rules="[requiredValidator]"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
      <VCardActions class="justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          @click="isCreateSuperuserDialogVisible = false"
        >
          Cancel
        </VBtn>
        <VBtn @click="submitCreateSuperuser">
          Create
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    :timeout="3000"
    location="top"
  >
    {{ snackbarText }}
  </VSnackbar>
</template>
