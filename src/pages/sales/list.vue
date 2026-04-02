<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type SaleItem = {
  id: number
  customerId: number
  businessId: number
  quantity: number
  originalAmount: number
  discountAmount: number
  totalPrice: number
  promoCodeId?: number | null
  transactionDate?: string
  invoiceNumber?: string
  created_at?: string
}

type ProductOption = {
  title: string
  value: number
  price: number
}

const filters = reactive({
  businessId: '',
  startDate: '',
  endDate: '',
})

const businesses = ref<{ title: string; value: number }[]>([])

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const isCreateDialogOpen = ref(false)
const isSubmitting = ref(false)
const isFetching = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const sales = ref<SaleItem[]>([])
const totalSales = ref(0)
const productOptions = ref<ProductOption[]>([])

const form = reactive({
  businessId: '',
  customerId: '',
  quantity: '1',
  originalAmount: '',
  discountAmount: '',
  totalPrice: '',
  promoCodeId: '',
  transactionDate: '',
  invoiceNumber: '',
  items: [
    {
      productId: '',
      quantity: '1',
      unitPrice: '',
    },
  ],
})

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Business', key: 'businessId' },
  { title: 'Customer', key: 'customerId' },
  { title: 'Total', key: 'totalPrice' },
  { title: 'Discount', key: 'discountAmount' },
  { title: 'Invoice', key: 'invoiceNumber' },
  { title: 'Date', key: 'transactionDate' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
  loadSales()
}

const requestUrl = createUrl('/sales/', {
  query: {
    businessId: computed(() => filters.businessId || undefined),
    startDate: computed(() => filters.startDate || undefined),
    endDate: computed(() => filters.endDate || undefined),
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
})

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
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

const loadSales = async () => {
  if (!filters.businessId)
    return

  try {
    isFetching.value = true
    const response = await $api(requestUrl.value)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.sales ?? payload?.results ?? []
    sales.value = Array.isArray(list) ? list : []
    totalSales.value = payload?.total ?? payload?.count ?? payload?.totalItems ?? sales.value.length
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to load sales.', 'error')
  }
  finally {
    isFetching.value = false
  }
}

const loadProducts = async (businessId: string) => {
  if (!businessId)
    return

  try {
    const response = await $api(createUrl('/products/', {
      query: { businessId: Number(businessId), skip: 0, limit: 100 },
    }).value)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.products ?? payload?.results ?? []
    productOptions.value = Array.isArray(list)
      ? list.map((item: any) => ({
          title: item.name ?? item.sku ?? String(item.id),
          value: Number(item.id),
          price: Number(item.price ?? 0),
        }))
      : []
  }
  catch (error) {
    console.error(error)
  }
}

const addItemRow = () => {
  form.items.push({ productId: '', quantity: '1', unitPrice: '' })
}

const removeItemRow = (index: number) => {
  if (form.items.length <= 1)
    return
  form.items.splice(index, 1)
}

const resolveProductPrice = (productId: string | number) => {
  const id = Number(productId)
  const match = productOptions.value.find(p => p.value === id)
  return match?.price ?? 0
}

const calculateTotals = () => {
  let subtotal = 0
  form.items.forEach(item => {
    const price = item.unitPrice ? Number(item.unitPrice) : resolveProductPrice(item.productId)
    const qty = Number(item.quantity || 0)
    subtotal += price * qty
  })
  form.originalAmount = subtotal ? String(subtotal) : ''
  const discount = Number(form.discountAmount || 0)
  form.totalPrice = subtotal ? String(Math.max(subtotal - discount, 0)) : ''
}

const resetForm = () => {
  form.businessId = ''
  form.customerId = ''
  form.quantity = '1'
  form.originalAmount = ''
  form.discountAmount = ''
  form.totalPrice = ''
  form.promoCodeId = ''
  form.transactionDate = ''
  form.invoiceNumber = ''
  form.items = [{ productId: '', quantity: '1', unitPrice: '' }]
}

const createSale = async () => {
  try {
    isSubmitting.value = true
    const itemsPayload = form.items
      .filter(item => item.productId)
      .map(item => {
        const price = item.unitPrice ? Number(item.unitPrice) : resolveProductPrice(item.productId)
        const qty = Number(item.quantity || 0)
        return {
          productId: Number(item.productId),
          quantity: qty,
          unitPrice: price,
          totalPrice: price * qty,
        }
      })
    calculateTotals()
    await $api('/sales/', {
      method: 'POST',
      body: {
        businessId: Number(form.businessId),
        customerId: Number(form.customerId),
        quantity: Number(form.quantity),
        originalAmount: form.originalAmount ? Number(form.originalAmount) : undefined,
        discountAmount: Number(form.discountAmount || 0),
        totalPrice: Number(form.totalPrice || 0),
        promoCodeId: form.promoCodeId ? Number(form.promoCodeId) : undefined,
        transactionDate: form.transactionDate || undefined,
        invoiceNumber: form.invoiceNumber || undefined,
        items: itemsPayload.length ? itemsPayload : undefined,
      },
    })
    isCreateDialogOpen.value = false
    resetForm()
    loadSales()
    showSnackbar('Sale created.')
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to create sale.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}

const resolveBusinessName = (businessId: number) => {
  const match = businesses.value.find(item => item.value === businessId)
  return match?.title ?? businessId
}

onMounted(() => {
  loadBusinesses()
})

watch(() => form.businessId, val => {
  if (!val) {
    productOptions.value = []
    return
  }
  loadProducts(val)
})

watch(
  () => [form.items, form.discountAmount],
  () => {
    calculateTotals()
  },
  { deep: true },
)
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Sales &amp; POS</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="4">
            <AppSelect
              v-model="filters.businessId"
              :items="businesses"
              label="Business"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol cols="12" sm="4">
            <AppDateTimePicker
              v-model="filters.startDate"
              label="Start Date"
              placeholder="Start date"
              clearable
            />
          </VCol>
          <VCol cols="12" sm="4">
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
        <VBtn color="primary" @click="loadSales">
          Search
        </VBtn>
        <VBtn color="primary" variant="tonal" @click="isCreateDialogOpen = true">
          Add Sale
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="loadSales"
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
        :items="sales"
        :items-length="totalSales"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.businessId="{ item }">
          <span>{{ resolveBusinessName(item.businessId) }}</span>
        </template>
        <template #item.totalPrice="{ item }">
          <span>{{ item.totalPrice }}</span>
        </template>
        <template #item.discountAmount="{ item }">
          <span>{{ item.discountAmount }}</span>
        </template>
        <template #item.transactionDate="{ item }">
          <span>{{ item.transactionDate ? formatDate(item.transactionDate) : '-' }}</span>
        </template>
      </VDataTableServer>
    </VCard>

    <VDialog v-model="isCreateDialogOpen" max-width="720">
      <VCard>
        <VCardItem>
          <VCardTitle>Add Sale</VCardTitle>
        </VCardItem>
        <VCardText>
        <VRow>
          <VCol cols="12" md="6">
            <AppSelect v-model="form.businessId" :items="businesses" label="Business" />
          </VCol>
          <VCol cols="12" md="6">
            <AppTextField v-model="form.customerId" label="Customer ID" placeholder="1" />
          </VCol>
          <VCol cols="12">
            <VCard variant="tonal">
              <VCardText>
                <div class="d-flex align-center justify-space-between mb-4">
                  <div class="text-subtitle-1 font-weight-medium">
                    Sale Items
                  </div>
                  <VBtn variant="tonal" color="primary" @click="addItemRow">
                    Add Item
                  </VBtn>
                </div>
                <VRow v-for="(item, index) in form.items" :key="index" class="mb-2">
                  <VCol cols="12" md="5">
                    <AppSelect
                      v-model="item.productId"
                      :items="productOptions"
                      label="Product"
                      :disabled="!form.businessId"
                    />
                  </VCol>
                  <VCol cols="12" md="2">
                    <AppTextField v-model="item.quantity" label="Qty" placeholder="1" />
                  </VCol>
                  <VCol cols="12" md="3">
                    <AppTextField v-model="item.unitPrice" label="Unit Price" placeholder="Auto" />
                  </VCol>
                  <VCol cols="12" md="2" class="d-flex align-center">
                    <VBtn
                      icon
                      variant="text"
                      color="error"
                      @click="removeItemRow(index)"
                    >
                      <VIcon icon="tabler-trash" />
                    </VBtn>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
          <VCol cols="12" md="4">
            <AppTextField v-model="form.quantity" label="Quantity" placeholder="1" />
          </VCol>
          <VCol cols="12" md="4">
            <AppTextField v-model="form.originalAmount" label="Original Amount" placeholder="100" />
          </VCol>
            <VCol cols="12" md="4">
              <AppTextField v-model="form.discountAmount" label="Discount Amount" placeholder="0" />
            </VCol>
            <VCol cols="12" md="4">
              <AppTextField v-model="form.totalPrice" label="Total Price" placeholder="80" />
            </VCol>
            <VCol cols="12" md="4">
              <AppTextField v-model="form.promoCodeId" label="Promo Code ID" placeholder="7" />
            </VCol>
            <VCol cols="12" md="4">
              <AppTextField v-model="form.invoiceNumber" label="Invoice Number" placeholder="INV-1770089932" />
            </VCol>
            <VCol cols="12" md="6">
              <AppDateTimePicker v-model="form.transactionDate" label="Transaction Date" placeholder="Select date" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" @click="isCreateDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="isSubmitting" @click="createSale">
            Create
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
