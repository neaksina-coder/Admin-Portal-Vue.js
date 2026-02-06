<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'
import { requiredValidator } from '@core/utils/validators'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

const router = useRouter()
const refVForm = ref<VForm>()

const form = reactive({
  name: '',
  tenantId: '',
  planId: '',
})

const errors = ref<Record<string, string | undefined>>({
  name: undefined,
  tenantId: undefined,
  planId: undefined,
})

const isSubmitting = ref(false)

const createBusiness = async () => {
  try {
    isSubmitting.value = true
    errors.value = {
      name: undefined,
      tenantId: undefined,
      planId: undefined,
    }

    await $api('/businesses', {
      method: 'POST',
      body: {
        name: form.name,
        tenantId: form.tenantId,
        planId: form.planId ? Number(form.planId) : undefined,
      },
      onResponseError({ response }) {
        errors.value = response._data?.errors ?? {
          name: response._data?.detail ?? response._data?.message ?? 'Create business failed',
        }
      },
    })

    router.push({ name: 'businesses-list' })
  }
  catch (error) {
    console.error(error)
  }
  finally {
    isSubmitting.value = false
  }
}

const onSubmit = () => {
  refVForm.value?.validate()
    .then(({ valid: isValid }) => {
      if (isValid)
        createBusiness()
    })
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>Create Business</VCardTitle>
        </VCardItem>
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.name"
                  :rules="[requiredValidator]"
                  label="Business Name"
                  placeholder="ERP-ORG"
                  :error-messages="errors.name"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.tenantId"
                  :rules="[requiredValidator]"
                  label="Tenant ID"
                  placeholder="erp-org"
                  :error-messages="errors.tenantId"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.planId"
                  :rules="[requiredValidator]"
                  label="Plan ID"
                  placeholder="3"
                  :error-messages="errors.planId"
                />
              </VCol>
              <VCol cols="12">
                <div class="d-flex gap-3">
                  <VBtn type="submit" :loading="isSubmitting">
                    Create
                  </VBtn>
                  <VBtn variant="tonal" color="secondary" :to="{ name: 'businesses-list' }">
                    Cancel
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
