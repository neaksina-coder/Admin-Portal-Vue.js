<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type EmailLogItem = {
  id: number
  campaignId: number
  businessId: number
  recipientEmail: string
  subject?: string
  status?: string
  errorMessage?: string | null
  created_at?: string
}

const filters = reactive({
  businessId: '',
  campaignId: '',
})

const businesses = ref<{ title: string; value: number }[]>([])
const campaigns = ref<{ title: string; value: number }[]>([])

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const isFetching = ref(false)

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Campaign', key: 'campaignId' },
  { title: 'Recipient', key: 'recipientEmail' },
  { title: 'Status', key: 'status' },
  { title: 'Sent At', key: 'created_at' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const route = useRoute()

const logs = ref<EmailLogItem[]>([])
const totalLogs = ref(0)

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

const loadCampaigns = async () => {
  if (!filters.businessId) {
    campaigns.value = []
    filters.campaignId = ''
    return
  }

  try {
    const requestUrl = createUrl('/marketing', {
      query: {
        businessId: computed(() => filters.businessId || undefined),
        skip: 0,
        limit: 100,
      },
    })
    const response = await $api(requestUrl.value)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.campaigns ?? payload?.results ?? []
    campaigns.value = Array.isArray(list)
      ? list.map((item: any) => ({
          title: item.name ?? `Campaign ${item.id}`,
          value: Number(item.id),
        }))
      : []
  }
  catch (error) {
    console.error(error)
  }
}

const resolveCampaignName = (campaignId: number) => {
  const match = campaigns.value.find(item => item.value === campaignId)
  return match?.title ?? campaignId
}

const requestUrl = computed(() => {
  if (!filters.campaignId)
    return null

  return createUrl(`/marketing/${filters.campaignId}/logs`, {
    query: {
      skip: computed(() => (page.value - 1) * itemsPerPage.value),
      limit: itemsPerPage,
      sortBy,
      orderBy,
    },
  }).value
})

const loadLogs = async () => {
  if (!requestUrl.value) {
    logs.value = []
    totalLogs.value = 0
    return
  }

  try {
    isFetching.value = true
    const response = await $api(requestUrl.value)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.logs ?? payload?.results ?? []
    logs.value = Array.isArray(list) ? list : []
    totalLogs.value = payload?.total ?? payload?.count ?? payload?.totalItems ?? logs.value.length
  }
  catch (error) {
    console.error(error)
  }
  finally {
    isFetching.value = false
  }
}

onMounted(() => {
  const campaignId = route.query.campaignId
  if (campaignId)
    filters.campaignId = String(campaignId)

  loadBusinesses()
  loadLogs()
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Marketing Email Logs</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="6" md="4">
            <AppSelect
              v-model="filters.businessId"
              :items="businesses"
              label="Business"
              placeholder="Select business"
              clearable
              clear-icon="tabler-x"
              @update:model-value="loadCampaigns"
            />
          </VCol>
          <VCol cols="12" sm="6" md="5">
            <AppSelect
              v-model="filters.campaignId"
              :items="campaigns"
              label="Campaign"
              placeholder="Select campaign"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol cols="12" md="3" class="d-flex align-end">
            <VBtn color="primary" @click="loadLogs">
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
        :items="logs"
        :items-length="totalLogs"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.campaignId="{ item }">
          <span>{{ resolveCampaignName(item.campaignId) }}</span>
        </template>
        <template #item.created_at="{ item }">
          <span>{{ item.created_at ? formatDate(item.created_at) : '-' }}</span>
        </template>
      </VDataTableServer>

      <VCardText class="d-flex justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="loadLogs"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>
  </section>
</template>
