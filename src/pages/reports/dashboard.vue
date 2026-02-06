<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type SalesSummary = {
  totalRevenue?: number
  totalSales?: number
}

type CustomerSummary = {
  totalCustomers?: number
}

type PaymentItem = {
  paymentStatus?: string
  amount?: number
}

const businessId = ref('')
const businesses = ref<{ title: string; value: number }[]>([])

const salesUrl = createUrl('/reports/sales/summary', {
  query: {
    businessId: computed(() => businessId.value || undefined),
  },
})

const customersUrl = createUrl('/reports/customers/summary', {
  query: {
    businessId: computed(() => businessId.value || undefined),
  },
})

const paymentsUrl = createUrl('/reports/payments', {
  query: {
    businessId: computed(() => businessId.value || undefined),
    limit: 100,
    skip: 0,
  },
})

const { data: salesData, execute: fetchSales, isFetching: isFetchingSales } = await useApi<any>(salesUrl)
const { data: customersData, execute: fetchCustomers, isFetching: isFetchingCustomers } = await useApi<any>(customersUrl)
const { data: paymentsData, execute: fetchPayments, isFetching: isFetchingPayments } = await useApi<any>(paymentsUrl)

const salesSummary = computed<SalesSummary>(() => {
  const payload = salesData.value
  return payload?.data ?? payload ?? {}
})

const customerSummary = computed<CustomerSummary>(() => {
  const payload = customersData.value
  return payload?.data ?? payload ?? {}
})

const paymentItems = computed<PaymentItem[]>(() => {
  const payload = paymentsData.value
  const list = payload?.items ?? payload?.data ?? payload?.results ?? payload?.payments ?? []

  return Array.isArray(list) ? list : []
})

const paymentStats = computed(() => {
  const counts: Record<string, number> = {
    pending: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
    overdue: 0,
  }
  paymentItems.value.forEach(item => {
    const key = String(item.paymentStatus || '').toLowerCase()
    if (counts[key] !== undefined)
      counts[key] += 1
  })

  return counts
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

const loadDashboard = () => {
  if (!businessId.value)
    return
  fetchSales()
  fetchCustomers()
  fetchPayments()
}

onMounted(() => {
  loadBusinesses()
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Reports Dashboard</VCardTitle>
      </VCardItem>
      <VCardText>
        <VRow class="align-end">
          <VCol cols="12" md="6">
            <AppSelect
              v-model="businessId"
              :items="businesses"
              label="Business"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol cols="12" md="6" class="d-flex justify-end">
            <VBtn color="primary" size="large" @click="loadDashboard">
              Load Dashboard
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <VRow class="mb-6">
      <VCol cols="12" md="4">
        <VCard class="kpi-card">
          <VCardText>
            <div class="text-body-2 text-medium-emphasis">Total Revenue</div>
            <div class="d-flex align-center justify-space-between mt-2">
              <div class="text-h3 font-weight-bold">{{ salesSummary.totalRevenue ?? 0 }}</div>
              <VAvatar color="primary" variant="tonal" size="44">
                <VIcon icon="tabler-currency-dollar" />
              </VAvatar>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">All-time revenue</div>
            <VProgressLinear
              height="6"
              color="primary"
              class="mt-3"
              :model-value="isFetchingSales ? 20 : 100"
              :indeterminate="isFetchingSales"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard class="kpi-card">
          <VCardText>
            <div class="text-body-2 text-medium-emphasis">Total Sales</div>
            <div class="d-flex align-center justify-space-between mt-2">
              <div class="text-h3 font-weight-bold">{{ salesSummary.totalSales ?? 0 }}</div>
              <VAvatar color="success" variant="tonal" size="44">
                <VIcon icon="tabler-trending-up" />
              </VAvatar>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">All-time orders</div>
            <VProgressLinear
              height="6"
              color="success"
              class="mt-3"
              :model-value="isFetchingSales ? 20 : 100"
              :indeterminate="isFetchingSales"
            />
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" md="4">
        <VCard class="kpi-card">
          <VCardText>
            <div class="text-body-2 text-medium-emphasis">Total Customers</div>
            <div class="d-flex align-center justify-space-between mt-2">
              <div class="text-h3 font-weight-bold">{{ customerSummary.totalCustomers ?? 0 }}</div>
              <VAvatar color="info" variant="tonal" size="44">
                <VIcon icon="tabler-users" />
              </VAvatar>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">Active customer base</div>
            <VProgressLinear
              height="6"
              color="info"
              class="mt-3"
              :model-value="isFetchingCustomers ? 20 : 100"
              :indeterminate="isFetchingCustomers"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VCard>
      <VCardItem>
        <VCardTitle>Payment Status Snapshot</VCardTitle>
      </VCardItem>
      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <VCard variant="tonal" class="trend-card">
              <VCardText>
                <div class="text-body-2 text-medium-emphasis">Pending</div>
                <div class="text-h4 font-weight-bold">{{ paymentStats.pending }}</div>
                <div class="text-caption text-medium-emphasis">Awaiting payment</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="4">
            <VCard variant="tonal" class="trend-card">
              <VCardText>
                <div class="text-body-2 text-medium-emphasis">Paid</div>
                <div class="text-h4 font-weight-bold">{{ paymentStats.paid }}</div>
                <div class="text-caption text-medium-emphasis">Completed payments</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="4">
            <VCard variant="tonal" class="trend-card">
              <VCardText>
                <div class="text-body-2 text-medium-emphasis">Failed</div>
                <div class="text-h4 font-weight-bold">{{ paymentStats.failed }}</div>
                <div class="text-caption text-medium-emphasis">Payment failures</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="4">
            <VCard variant="tonal" class="trend-card">
              <VCardText>
                <div class="text-body-2 text-medium-emphasis">Refunded</div>
                <div class="text-h4 font-weight-bold">{{ paymentStats.refunded }}</div>
                <div class="text-caption text-medium-emphasis">Refund activity</div>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" sm="4">
            <VCard variant="tonal" class="trend-card">
              <VCardText>
                <div class="text-body-2 text-medium-emphasis">Overdue</div>
                <div class="text-h4 font-weight-bold">{{ paymentStats.overdue }}</div>
                <div class="text-caption text-medium-emphasis">Overdue invoices</div>
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
          :loading="isFetchingPayments"
          @click="fetchPayments()"
        >
          Refresh Payments
        </VBtn>
      </VCardText>
    </VCard>
  </section>
</template>

<style scoped lang="scss">
.kpi-card {
  border-radius: 16px;
}

.trend-card {
  border-radius: 14px;
}
</style>
