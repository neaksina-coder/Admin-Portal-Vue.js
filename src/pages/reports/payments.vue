<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'overdue'

type PaymentReportItem = {
  id: number
  businessId: number
  subscriptionId?: number | null
  amount: number
  currency: string
  paymentStatus: PaymentStatus
  paymentMethod?: string | null
  dueDate?: string | null
  paymentDate?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
}

const filters = reactive({
  businessId: '',
  status: '' as '' | PaymentStatus,
})

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Paid', value: 'paid' },
  { title: 'Failed', value: 'failed' },
  { title: 'Refunded', value: 'refunded' },
  { title: 'Overdue', value: 'overdue' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Business', key: 'businessId' },
  { title: 'Amount', key: 'amount' },
  { title: 'Status', key: 'paymentStatus' },
  { title: 'Due Date', key: 'dueDate' },
  { title: 'Payment Date', key: 'paymentDate' },
]

const mockReports = ref<PaymentReportItem[]>([
  {
    id: 1001,
    businessId: 12,
    subscriptionId: 502,
    amount: 49,
    currency: 'USD',
    paymentStatus: 'paid',
    paymentMethod: 'Card',
    dueDate: '2026-01-15',
    paymentDate: '2026-01-12',
    created_at: '2026-01-12',
  },
  {
    id: 1002,
    businessId: 12,
    subscriptionId: 503,
    amount: 99,
    currency: 'USD',
    paymentStatus: 'pending',
    paymentMethod: 'Bank Transfer',
    dueDate: '2026-01-20',
    paymentDate: null,
    created_at: '2026-01-10',
  },
  {
    id: 1003,
    businessId: 17,
    subscriptionId: 610,
    amount: 149,
    currency: 'USD',
    paymentStatus: 'failed',
    paymentMethod: 'Card',
    dueDate: '2026-01-18',
    paymentDate: null,
    created_at: '2026-01-09',
  },
  {
    id: 1004,
    businessId: 21,
    subscriptionId: 702,
    amount: 29,
    currency: 'USD',
    paymentStatus: 'refunded',
    paymentMethod: 'Card',
    dueDate: '2026-01-05',
    paymentDate: '2026-01-04',
    created_at: '2026-01-04',
  },
  {
    id: 1005,
    businessId: 21,
    subscriptionId: 703,
    amount: 199,
    currency: 'USD',
    paymentStatus: 'overdue',
    paymentMethod: 'Cash',
    dueDate: '2026-01-02',
    paymentDate: null,
    created_at: '2025-12-29',
  },
])

const filteredReports = computed<PaymentReportItem[]>(() => {
  const businessId = Number(filters.businessId)
  return mockReports.value.filter(item => {
    if (filters.businessId && item.businessId !== businessId)
      return false
    if (filters.status && item.paymentStatus !== filters.status)
      return false
    return true
  })
})

const reports = computed<PaymentReportItem[]>(() => {
  const start = (page.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredReports.value.slice(start, end)
})

const totalReports = computed(() => filteredReports.value.length)

const isFetching = ref(false)
const fetchReports = () => {
  isFetching.value = false
}

const resolvePaymentStatusColor = (status: PaymentStatus) => {
  if (status === 'paid')
    return 'success'
  if (status === 'pending')
    return 'warning'
  if (status === 'failed' || status === 'overdue')
    return 'error'
  if (status === 'refunded')
    return 'secondary'

  return 'primary'
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Payment Reports</VCardTitle>
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
              v-model="filters.status"
              :items="statusOptions"
              label="Payment Status"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <VBtn
          color="primary"
          @click="fetchReports()"
        >
          Search
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchReports()"
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
        :items="reports"
        :items-length="totalReports"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.id="{ item }">
          <span class="text-high-emphasis font-weight-medium">#{{ item.id }}</span>
        </template>

        <template #item.businessId="{ item }">
          <span>{{ item.businessId }}</span>
        </template>

        <template #item.amount="{ item }">
          <span>{{ item.currency }} {{ item.amount }}</span>
        </template>

        <template #item.paymentStatus="{ item }">
          <VChip
            :color="resolvePaymentStatusColor(item.paymentStatus)"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.paymentStatus }}
          </VChip>
        </template>

        <template #item.dueDate="{ item }">
          <span>{{ item.dueDate ? formatDate(item.dueDate) : '-' }}</span>
        </template>

        <template #item.paymentDate="{ item }">
          <span>{{ item.paymentDate ? formatDate(item.paymentDate) : '-' }}</span>
        </template>
      </VDataTableServer>
    </VCard>
  </section>
</template>
