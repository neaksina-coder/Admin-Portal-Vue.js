<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type PlanItem = {
  id: number
  planName: string
  price: number
  features?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

const nameFilter = ref('')
const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Plan Name', key: 'planName' },
  { title: 'Price', key: 'price' },
  { title: 'Features', key: 'features' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const { data: plansData, execute: fetchPlans, isFetching } = await useApi<any>(createUrl('/plans', {
  query: {
    name: nameFilter,
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
}))

const plans = computed<PlanItem[]>(() => {
  const payload = plansData.value
  const list = payload?.items ?? payload?.data?.items ?? payload?.data ?? payload?.plans ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const totalPlans = computed(() => {
  const payload = plansData.value
  return payload?.total ?? payload?.count ?? payload?.totalItems ?? payload?.data?.total ?? plans.value.length
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Plans</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppTextField
              v-model="nameFilter"
              label="Plan Name"
              placeholder="Search by plan name"
            />
          </VCol>
          <VCol cols="12" sm="6" class="d-flex align-end gap-3">
            <VBtn color="primary" @click="fetchPlans()">
              Search
            </VBtn>
            <VBtn color="primary" variant="tonal" :to="{ name: 'plans-create' }">
              Create Plan
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
        :items="plans"
        :items-length="totalPlans"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.price="{ item }">
          <span>{{ Number(item.price).toFixed(2) }}</span>
        </template>
        <template #item.features="{ item }">
          <span>{{ item.features ? Object.keys(item.features).length : 0 }} features</span>
        </template>
        <template #item.actions="{ item }">
          <IconBtn :to="{ name: 'plans-id', params: { id: item.id } }">
            <VIcon icon="tabler-eye" />
          </IconBtn>
        </template>
      </VDataTableServer>

      <VCardText class="d-flex justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchPlans()"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>
  </section>
</template>
