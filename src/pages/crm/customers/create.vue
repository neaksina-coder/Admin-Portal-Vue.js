<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'
import { requiredValidator, emailValidator } from '@core/utils/validators'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

const router = useRouter()
const refVForm = ref<VForm>()

const businesses = ref<{ title: string; value: number }[]>([])
const isSubmitting = ref(false)
const errors = ref<Record<string, string | undefined>>({
  name: undefined,
  email: undefined,
  businessId: undefined,
})

const form = reactive({
  businessId: '',
  name: '',
  email: '',
  phone: '',
  segment: 'regular',
  notes: '',
})

const segmentOptions = [
  { title: 'VIP', value: 'vip' },
  { title: 'Regular', value: 'regular' },
  { title: 'New', value: 'new' },
]

const loadBusinesses = async () => {
  try {
    const response = await $api('/businesses')
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.businesses ?? payload?.results ?? []
    businesses.value = Array.isArray(list)
      ? list.map((item: any) => ({
          title: item.name ?? item.tenantId ?? String(item.id),
          value: Number(item.id),
        }))
      : []
  }
  catch (error) {
    console.error(error)
  }
}

const createCustomer = async () => {
  try {
    isSubmitting.value = true
    errors.value = { name: undefined, email: undefined, businessId: undefined }

    await $api('/customers', {
      method: 'POST',
      body: {
        businessId: Number(form.businessId),
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        segment: form.segment,
        notes: form.notes || undefined,
      },
      onResponseError({ response }) {
        errors.value = response._data?.errors ?? {
          name: response._data?.detail ?? response._data?.message ?? 'Create customer failed',
        }
      },
    })

    router.push({ name: 'crm-customers-list' })
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
    .then(({ valid }) => {
      if (valid)
        createCustomer()
    })
}
 
onMounted(() => {
  loadBusinesses()
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>Create Customer</VCardTitle>
        </VCardItem>
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <VCol cols="12" md="6">
                <AppSelect
                  v-model="form.businessId"
                  :items="businesses"
                  label="Business"
                  :rules="[requiredValidator]"
                  :error-messages="errors.businessId"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppSelect
                  v-model="form.segment"
                  :items="segmentOptions"
                  label="Segment"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.name"
                  :rules="[requiredValidator]"
                  label="Name"
                  placeholder="Jane Doe"
                  :error-messages="errors.name"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  placeholder="jane@example.com"
                  :error-messages="errors.email"
                />
              </VCol>
              <VCol cols="12" md="6">
                <AppTextField
                  v-model="form.phone"
                  label="Phone"
                  placeholder="+1 222 333 4444"
                />
              </VCol>
              <VCol cols="12">
                <AppTextarea
                  v-model="form.notes"
                  label="Notes"
                  rows="4"
                />
              </VCol>
              <VCol cols="12">
                <div class="d-flex gap-3">
                  <VBtn type="submit" :loading="isSubmitting">
                    Create
                  </VBtn>
                  <VBtn variant="tonal" color="secondary" :to="{ name: 'crm-customers-list' }">
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
