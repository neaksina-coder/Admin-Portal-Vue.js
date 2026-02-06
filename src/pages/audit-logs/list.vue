<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type AuditLogItem = {
  id: number
  businessId?: number | null
  actorUserId?: number | null
  action: string
  targetType?: string
  targetId?: number | null
  created_at?: string
}

const filters = reactive({
  businessId: '',
  actorUserId: '',
  action: '',
  startDate: '',
  endDate: '',
})

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Business', key: 'businessId' },
  { title: 'Actor', key: 'actorUserId' },
  { title: 'Action', key: 'action' },
  { title: 'Target', key: 'targetType' },
  { title: 'Created', key: 'created_at' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const { data: logsData, execute: fetchLogs, isFetching } = await useApi<any>(createUrl('/audit-logs', {
  query: {
    businessId: filters.businessId || undefined,
    actorUserId: filters.actorUserId || undefined,
    action: filters.action || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
}))

const logs = computed<AuditLogItem[]>(() => {
  const payload = logsData.value
  const list = payload?.items ?? payload?.data ?? payload?.auditLogs ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const totalLogs = computed(() => {
  const payload = logsData.value
  return payload?.total ?? payload?.count ?? payload?.totalItems ?? logs.value.length
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Audit Logs</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="filters.businessId"
              label="Business ID"
              placeholder="Enter business id"
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="filters.actorUserId"
              label="Actor User ID"
              placeholder="Enter actor user id"
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppTextField
              v-model="filters.action"
              label="Action"
              placeholder="invoice_status_updated"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppDateTimePicker
              v-model="filters.startDate"
              label="Start Date"
              placeholder="Start date"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppDateTimePicker
              v-model="filters.endDate"
              label="End Date"
              placeholder="End date"
              clearable
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <VBtn color="primary" @click="fetchLogs()">
          Search
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchLogs()"
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
    </VCard>
  </section>
</template>
