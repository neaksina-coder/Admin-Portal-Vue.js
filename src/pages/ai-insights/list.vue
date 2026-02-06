<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type InsightItem = {
  id: number
  businessId: number
  type: string
  inputData?: Record<string, unknown>
  outputData?: Record<string, unknown>
  created_at?: string
}

const filters = reactive({
  businessId: '',
})

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Business', key: 'businessId' },
  { title: 'Type', key: 'type' },
  { title: 'Summary', key: 'summary' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const { data: insightsData, execute: fetchInsights, isFetching } = await useApi<any>(createUrl('/ai-insights', {
  query: {
    businessId: filters.businessId || undefined,
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
}))

const insights = computed<InsightItem[]>(() => {
  const payload = insightsData.value
  const list = payload?.items ?? payload?.data ?? payload?.insights ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const totalInsights = computed(() => {
  const payload = insightsData.value
  return payload?.total ?? payload?.count ?? payload?.totalItems ?? insights.value.length
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>AI Insights</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppTextField
              v-model="filters.businessId"
              label="Business ID"
              placeholder="Enter business id"
            />
          </VCol>
          <VCol cols="12" sm="6" class="d-flex align-end">
            <VBtn color="primary" @click="fetchInsights()">
              Search
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items-per-page-options="[
          { value: 20, title: '20' },
          { value: 50, title: '50' },
          { value: 100, title: '100' },
        ]"
        :items="insights"
        :items-length="totalInsights"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.summary="{ item }">
          <span>{{ item.outputData?.summary ?? '-' }}</span>
        </template>
      </VDataTableServer>

      <VCardText class="d-flex justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchInsights()"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>
  </section>
</template>
