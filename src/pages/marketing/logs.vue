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
  campaignId: '',
})

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

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

const requestPath = computed(() => {
  if (!filters.campaignId)
    return null
  return `/marketing/${filters.campaignId}/logs`
})

const { data: logsData, execute: fetchLogs, isFetching } = await useApi<any>(createUrl(requestPath, {
  query: {
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
}))

const logs = computed<EmailLogItem[]>(() => {
  const payload = logsData.value
  const list = payload?.items ?? payload?.data ?? payload?.logs ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const totalLogs = computed(() => {
  const payload = logsData.value
  return payload?.total ?? payload?.count ?? payload?.totalItems ?? logs.value.length
})

const loadLogs = () => {
  if (requestPath.value)
    fetchLogs()
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Marketing Email Logs</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppTextField
              v-model="filters.campaignId"
              label="Campaign ID"
              placeholder="Enter campaign id"
            />
          </VCol>
          <VCol cols="12" sm="6" class="d-flex align-end">
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
