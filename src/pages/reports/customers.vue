<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type CustomerSummary = {
  totalCustomers?: number
}

const businessId = ref('')
const businesses = ref<{ title: string; value: number }[]>([])

const requestUrl = createUrl('/reports/customers/summary', {
  query: {
    businessId: computed(() => businessId.value || undefined),
  },
})

const { data: summaryData, execute: fetchSummary, isFetching } = await useApi<any>(requestUrl)

const summary = computed<CustomerSummary>(() => {
  const payload = summaryData.value
  return payload?.data ?? payload ?? {}
})

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

onMounted(() => {
  loadBusinesses()
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Customer Report</VCardTitle>
      </VCardItem>
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="businessId"
              :items="businesses"
              label="Business"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol cols="12" sm="6" class="d-flex align-end">
            <VBtn color="primary" @click="fetchSummary()">
              Load Summary
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <VCard variant="tonal">
              <VCardText>
                <div class="text-body-1 text-high-emphasis">Total Customers</div>
                <h4 class="text-h4">{{ summary.totalCustomers ?? 0 }}</h4>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
      <VCardText class="d-flex justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchSummary()"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>
  </section>
</template>
