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
  planName: '',
  price: '',
  featuresJson: '{\n  "crm": true,\n  "aiInsight": true,\n  "aiPrediction": false,\n  "maxUsers": "unlimited"\n}',
})

const errors = ref<Record<string, string | undefined>>({
  planName: undefined,
  price: undefined,
  featuresJson: undefined,
})

const isSubmitting = ref(false)

const parseFeatures = () => {
  try {
    const parsed = JSON.parse(form.featuresJson || '{}')
    errors.value.featuresJson = undefined
    return parsed
  }
  catch (error) {
    errors.value.featuresJson = 'Invalid JSON format.'
    return null
  }
}

const createPlan = async () => {
  const features = parseFeatures()
  if (!features)
    return

  try {
    isSubmitting.value = true
    errors.value = { planName: undefined, price: undefined, featuresJson: errors.value.featuresJson }

    await $api('/plans', {
      method: 'POST',
      body: {
        planName: form.planName,
        price: Number(form.price),
        features,
      },
      onResponseError({ response }) {
        errors.value = response._data?.errors ?? {
          planName: response._data?.detail ?? response._data?.message ?? 'Create plan failed',
        }
      },
    })

    router.push({ name: 'plans-list' })
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
        createPlan()
    })
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>Create Plan</VCardTitle>
        </VCardItem>
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.planName"
                  :rules="[requiredValidator]"
                  label="Plan Name"
                  placeholder="Enterprise"
                  :error-messages="errors.planName"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.price"
                  :rules="[requiredValidator]"
                  label="Price"
                  placeholder="99.99"
                  :error-messages="errors.price"
                />
              </VCol>
              <VCol cols="12">
                <AppTextarea
                  v-model="form.featuresJson"
                  label="Features (JSON)"
                  rows="8"
                  :error-messages="errors.featuresJson"
                />
              </VCol>
              <VCol cols="12">
                <div class="d-flex gap-3">
                  <VBtn type="submit" :loading="isSubmitting">
                    Create
                  </VBtn>
                  <VBtn variant="tonal" color="secondary" :to="{ name: 'plans-list' }">
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
