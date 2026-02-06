<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type CampaignItem = {
  id: number
  businessId: number
  name: string
  targetSegment?: string
  startDate?: string
  endDate?: string
  channel?: string
  created_at?: string
}

const filters = reactive({
  businessId: '',
  targetSegment: '',
})

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Business', key: 'businessId' },
  { title: 'Segment', key: 'targetSegment' },
  { title: 'Channel', key: 'channel' },
  { title: 'Start', key: 'startDate' },
  { title: 'End', key: 'endDate' },
]

const segmentOptions = [
  { title: 'VIP', value: 'vip' },
  { title: 'Regular', value: 'regular' },
  { title: 'All', value: 'all' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const { data: campaignsData, execute: fetchCampaigns, isFetching } = await useApi<any>(createUrl('/marketing', {
  query: {
    businessId: filters.businessId || undefined,
    targetSegment: filters.targetSegment || undefined,
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
}))

const campaigns = computed<CampaignItem[]>(() => {
  const payload = campaignsData.value
  const list = payload?.items ?? payload?.data ?? payload?.campaigns ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const totalCampaigns = computed(() => {
  const payload = campaignsData.value
  return payload?.total ?? payload?.count ?? payload?.totalItems ?? campaigns.value.length
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Marketing Campaigns</VCardTitle>
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
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="filters.targetSegment"
              :items="segmentOptions"
              label="Target Segment"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <VBtn color="primary" @click="fetchCampaigns()">
          Search
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchCampaigns()"
        >
          Refresh
        </VBtn>
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
        :items="campaigns"
        :items-length="totalCampaigns"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.startDate="{ item }">
          <span>{{ item.startDate ? formatDate(item.startDate) : '-' }}</span>
        </template>
        <template #item.endDate="{ item }">
          <span>{{ item.endDate ? formatDate(item.endDate) : '-' }}</span>
        </template>
      </VDataTableServer>
    </VCard>
  </section>
</template>
