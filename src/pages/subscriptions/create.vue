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
  businessId: '',
  planId: '',
  startDate: '',
  endDate: '',
})

const errors = ref<Record<string, string | undefined>>({
  businessId: undefined,
  planId: undefined,
  startDate: undefined,
})

const isSubmitting = ref(false)

const createSubscription = async () => {
  try {
    isSubmitting.value = true
    errors.value = {
      businessId: undefined,
      planId: undefined,
      startDate: undefined,
    }

    await $api('/subscriptions', {
      method: 'POST',
      body: {
        businessId: Number(form.businessId),
        planId: Number(form.planId),
        startDate: form.startDate,
        endDate: form.endDate || null,
      },
      onResponseError({ response }) {
        errors.value = response._data?.errors ?? {
          businessId: response._data?.detail ?? response._data?.message ?? 'Create subscription failed',
        }
      },
    })

    router.push({ name: 'subscriptions-list' })
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
        createSubscription()
    })
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>Create Subscription</VCardTitle>
        </VCardItem>
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.businessId"
                  :rules="[requiredValidator]"
                  label="Business ID"
                  placeholder="2"
                  :error-messages="errors.businessId"
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
              <VCol cols="12" md="6">
                <AppDateTimePicker
                  v-model="form.startDate"
                  :rules="[requiredValidator]"
                  label="Start Date"
                  placeholder="Select start date"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppDateTimePicker
                  v-model="form.endDate"
                  label="End Date"
                  placeholder="Select end date (optional)"
                  clearable
                />
              </VCol>
              <VCol cols="12">
                <div class="d-flex gap-3">
                  <VBtn type="submit" :loading="isSubmitting">
                    Create
                  </VBtn>
                  <VBtn variant="tonal" color="secondary" :to="{ name: 'subscriptions-list' }">
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
