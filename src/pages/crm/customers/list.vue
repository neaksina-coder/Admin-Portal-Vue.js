<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type CustomerItem = {
  id: number
  businessId: number
  name: string
  email: string
  phone?: string | null
  segment?: string
  churnRiskScore?: number
  lifetimeValue?: number
  nextBestProduct?: string | null
  created_at?: string
  updated_at?: string
}

const filters = reactive({
  businessId: '',
  segment: '',
})

const businesses = ref<{ title: string; value: number }[]>([])

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Business', key: 'businessId' },
  { title: 'Segment', key: 'segment' },
  { title: 'Churn Risk', key: 'churnRiskScore' },
  { title: 'LTV', key: 'lifetimeValue' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const segmentOptions = [
  { title: 'VIP', value: 'vip' },
  { title: 'Regular', value: 'regular' },
  { title: 'New', value: 'new' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
  fetchCustomers()
}

const isFetching = ref(false)
const customers = ref<CustomerItem[]>([])
const totalCustomers = ref(0)

const requestUrl = createUrl('/customers', {
  query: {
    businessId: computed(() => filters.businessId || undefined),
    segment: computed(() => filters.segment || undefined),
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
})

const fetchCustomers = async () => {
  if (!filters.businessId)
    return

  try {
    isFetching.value = true
    const response = await $api(requestUrl.value)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.customers ?? payload?.results ?? []
    customers.value = Array.isArray(list) ? list : []
    totalCustomers.value = payload?.total ?? payload?.count ?? payload?.totalItems ?? customers.value.length
  }
  catch (error) {
    console.error(error)
  }
  finally {
    isFetching.value = false
  }
}

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

const resolveBusinessName = (businessId: number) => {
  const match = businesses.value.find(item => item.value === businessId)
  return match?.title ?? businessId
}

onMounted(() => {
  loadBusinesses()
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>CRM Customers</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="filters.businessId"
              :items="businesses"
              label="Business"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="filters.segment"
              :items="segmentOptions"
              label="Segment"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <VBtn color="primary" @click="fetchCustomers()">
          Search
        </VBtn>
        <VBtn color="primary" variant="tonal" :to="{ name: 'crm-customers-create' }">
          Create Customer
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchCustomers()"
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
        :items="customers"
        :items-length="totalCustomers"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.businessId="{ item }">
          <span>{{ resolveBusinessName(item.businessId) }}</span>
        </template>
        <template #item.actions="{ item }">
          <IconBtn :to="{ name: 'crm-customers-id', params: { id: item.id } }">
            <VIcon icon="tabler-eye" />
          </IconBtn>
        </template>
      </VDataTableServer>
    </VCard>
  </section>
</template>
