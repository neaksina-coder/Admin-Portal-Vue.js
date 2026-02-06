<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type SubscriptionStatus = 'pending' | 'active' | 'inactive'

type SubscriptionItem = {
  id: number
  businessId: number
  planId: number
  startDate?: string
  endDate?: string | null
  status: SubscriptionStatus
  created_at?: string
}

const filters = reactive({
  businessId: '',
  planId: '',
  status: '' as '' | SubscriptionStatus,
})

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Business', key: 'businessId' },
  { title: 'Plan', key: 'planId' },
  { title: 'Status', key: 'status' },
  { title: 'Start Date', key: 'startDate' },
  { title: 'End Date', key: 'endDate' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const { data: subscriptionsData, execute: fetchSubscriptions, isFetching } = await useApi<any>(createUrl('/subscriptions', {
  query: {
    businessId: filters.businessId || undefined,
    planId: filters.planId || undefined,
    status: filters.status || undefined,
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
}))

const subscriptions = computed<SubscriptionItem[]>(() => {
  const payload = subscriptionsData.value
  const list = payload?.items ?? payload?.data?.items ?? payload?.data ?? payload?.subscriptions ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const totalSubscriptions = computed(() => {
  const payload = subscriptionsData.value
  return payload?.total ?? payload?.count ?? payload?.totalItems ?? payload?.data?.total ?? subscriptions.value.length
})

const resolveStatusColor = (status: SubscriptionStatus) => {
  if (status === 'active')
    return 'success'
  if (status === 'pending')
    return 'warning'
  if (status === 'inactive')
    return 'secondary'

  return 'primary'
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Subscriptions</VCardTitle>
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
              v-model="filters.planId"
              label="Plan ID"
              placeholder="Enter plan id"
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppSelect
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <VBtn color="primary" @click="fetchSubscriptions()">
          Search
        </VBtn>
        <VBtn color="primary" variant="tonal" :to="{ name: 'subscriptions-create' }">
          Create Subscription
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchSubscriptions()"
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
        :items="subscriptions"
        :items-length="totalSubscriptions"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.status="{ item }">
          <VChip
            :color="resolveStatusColor(item.status)"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.status }}
          </VChip>
        </template>
        <template #item.startDate="{ item }">
          <span>{{ item.startDate ? formatDate(item.startDate) : '-' }}</span>
        </template>
        <template #item.endDate="{ item }">
          <span>{{ item.endDate ? formatDate(item.endDate) : '-' }}</span>
        </template>
        <template #item.actions="{ item }">
          <IconBtn :to="{ name: 'subscriptions-id', params: { id: item.id } }">
            <VIcon icon="tabler-eye" />
          </IconBtn>
        </template>
      </VDataTableServer>
    </VCard>
  </section>
</template>
