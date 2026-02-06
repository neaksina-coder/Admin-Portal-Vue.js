<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'overdue'

type InvoiceItem = {
  id: number
  businessId: number
  subscriptionId?: number | null
  amount: number
  currency: string
  paymentStatus: InvoiceStatus
  paymentMethod?: string | null
  dueDate?: string | null
  paymentDate?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string
}

const filters = reactive({
  businessId: '',
  paymentStatus: '' as '' | InvoiceStatus,
  dueDate: '',
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
  { title: 'Actions', key: 'actions', sortable: false },
]

const { data: invoiceData, execute: fetchInvoices, isFetching } = await useApi<any>(createUrl('/invoices', {
  query: {
    businessId: filters.businessId || undefined,
    paymentStatus: filters.paymentStatus || undefined,
    dueDate: filters.dueDate || undefined,
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
}))

const resolveInvoiceStatusColor = (status: InvoiceStatus) => {
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

const invoices = computed<InvoiceItem[]>(() => {
  const payload = invoiceData.value
  const list = payload?.items ?? payload?.data ?? payload?.invoices ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const totalInvoices = computed(() => {
  const payload = invoiceData.value
  return payload?.total ?? payload?.count ?? payload?.totalItems ?? payload?.totalInvoices ?? invoices.value.length
})

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const isStatusDialogOpen = ref(false)
const statusForm = reactive({
  id: 0,
  paymentStatus: '' as '' | InvoiceStatus,
  paymentMethod: '',
  paymentDate: '',
})

const openStatusDialog = (item: InvoiceItem) => {
  statusForm.id = item.id
  statusForm.paymentStatus = item.paymentStatus || ''
  statusForm.paymentMethod = item.paymentMethod || ''
  statusForm.paymentDate = item.paymentDate || ''
  isStatusDialogOpen.value = true
}

const submitStatusUpdate = async () => {
  try {
    await $api(`/invoices/${statusForm.id}/status`, {
      method: 'PUT',
      body: {
        paymentStatus: statusForm.paymentStatus,
        paymentMethod: statusForm.paymentMethod || undefined,
        paymentDate: statusForm.paymentDate || undefined,
      },
    })
    showSnackbar('Invoice status updated.')
    isStatusDialogOpen.value = false
    fetchInvoices()
  }
  catch (error) {
    showSnackbar('Failed to update invoice status.', 'error')
  }
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Invoices &amp; Billing</VCardTitle>
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
            <AppSelect
              v-model="filters.paymentStatus"
              :items="statusOptions"
              label="Payment Status"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppDateTimePicker
              v-model="filters.dueDate"
              label="Due Date"
              placeholder="Select due date"
              clearable
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <VBtn
          color="primary"
          @click="fetchInvoices()"
        >
          Search
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchInvoices()"
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
        :items="invoices"
        :items-length="totalInvoices"
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
            :color="resolveInvoiceStatusColor(item.paymentStatus)"
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

        <template #item.actions="{ item }">
          <VBtn
            size="small"
            variant="text"
            @click="openStatusDialog(item)"
          >
            Update Status
          </VBtn>
        </template>
      </VDataTableServer>
    </VCard>

    <VDialog
      v-model="isStatusDialogOpen"
      max-width="520"
    >
      <VCard>
        <VCardItem>
          <VCardTitle>Update Invoice Status</VCardTitle>
        </VCardItem>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <AppSelect
                v-model="statusForm.paymentStatus"
                :items="statusOptions"
                label="Payment Status"
              />
            </VCol>
            <VCol cols="12">
              <AppTextField
                v-model="statusForm.paymentMethod"
                label="Payment Method"
                placeholder="bank_transfer | credit_card | paypal"
              />
            </VCol>
            <VCol cols="12">
              <AppDateTimePicker
                v-model="statusForm.paymentDate"
                label="Payment Date"
                placeholder="Select payment date"
                clearable
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="isStatusDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            @click="submitStatusUpdate"
          >
            Save
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
    </VSnackbar>
  </section>
</template>
