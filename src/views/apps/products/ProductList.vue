<script setup lang="ts">
import ProductFormDialog from './ProductFormDialog.vue'

interface Category {
  id: number
  name: string
  slug: string
  description?: string | null
  status: string
  created_at: string
}

interface Product {
  id: number
  name: string
  sku: string
  description?: string | null
  category_id?: number | null
  category?: Category | null
  price: number
  cost?: number | null
  stock: number
  unit?: string | null
  status: string
  created_at: string
}

const headers = [
  { title: 'PRODUCT', key: 'name', width: '30%' },
  { title: 'CATEGORY', key: 'category', width: '15%' },
  { title: 'PRICE', key: 'price', width: '15%' },
  { title: 'STOCK', key: 'stock', width: '12%' },
  { title: 'STATUS', key: 'status', width: '13%' },
  { title: 'ACTIONS', key: 'actions', sortable: false, width: '15%', align: 'end' },
]

const searchQuery = ref('')
const selectedCategory = ref<'all' | number>('all')
const selectedStatus = ref<'all' | string>('all')
const itemsPerPage = ref(20)
const page = ref(1)

const skip = computed(() => (page.value - 1) * itemsPerPage.value)
const limit = computed(() => itemsPerPage.value)

const { data: categoriesData, execute: fetchCategories } = await useApi<any>(createUrl('/categories/', {
  query: {
    skip: 0,
    limit: 100,
  },
}))

const { data: productsData, execute: fetchProducts } = await useApi<any>(createUrl('/products/', {
  query: {
    skip,
    limit,
    category_id: computed(() => (selectedCategory.value === 'all' ? undefined : selectedCategory.value)),
    status: computed(() => (selectedStatus.value === 'all' ? undefined : selectedStatus.value)),
  },
}))

const categories = computed(() => {
  const apiCategories = (categoriesData.value?.data ?? []) as Category[]
  return [
    { title: 'All Categories', value: 'all' },
    ...apiCategories.map(category => ({ title: category.name, value: category.id })),
  ]
})

const statuses = [
  { title: 'All Status', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

const products = computed((): Product[] => (productsData.value?.data ?? []))
const totalProducts = computed(() => productsData.value?.total ?? 0)

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query)
    return products.value

  return products.value.filter(product =>
    product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query),
  )
})

const isDeleteDialogVisible = ref(false)
const deleteId = ref<number | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const isFormDialogVisible = ref(false)
const isEditMode = ref(false)
const editingProduct = ref<Product | null>(null)

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const resolveStatusVariant = (status: string) => {
  if (status === 'active') return { color: 'success', text: 'Active', icon: 'tabler-circle-check' }
  if (status === 'inactive') return { color: 'error', text: 'Inactive', icon: 'tabler-circle-x' }
  return { color: 'warning', text: status, icon: 'tabler-clock' }
}

const resolveCategoryColor = (category: string) => {
  if (category === 'services') return 'primary'
  if (category === 'software') return 'info'
  if (category === 'hosting') return 'success'
  if (category === 'subscriptions') return 'warning'
  return 'secondary'
}

const confirmDelete = (id: number) => {
  deleteId.value = id
  isDeleteDialogVisible.value = true
}

const deleteProduct = async () => {
  if (!deleteId.value)
    return

  try {
    await $api(`/products/${deleteId.value}`, { method: 'DELETE' })
    showSnackbar('Product deleted successfully!', 'error')
    isDeleteDialogVisible.value = false
    deleteId.value = null
    fetchProducts()
  }
  catch (error) {
    showSnackbar('Failed to delete product.', 'error')
  }
}

const openAddDialog = () => {
  isEditMode.value = false
  editingProduct.value = null
  isFormDialogVisible.value = true
}

const openEditDialog = (product: Product) => {
  isEditMode.value = true
  editingProduct.value = { ...product }
  isFormDialogVisible.value = true
}

const handleSave = async (productData: Product) => {
  try {
    if (isEditMode.value && productData.id) {
      await $api(`/products/${productData.id}`, {
        method: 'PUT',
        body: productData,
      })
      showSnackbar('Product updated successfully!')
    }
    else {
      await $api('/products/', {
        method: 'POST',
        body: productData,
      })
      showSnackbar('Product added successfully!')
    }
    fetchProducts()
    fetchCategories()
  }
  catch (error) {
    showSnackbar('Failed to save product.', 'error')
  }
}

watch([selectedCategory, selectedStatus, page, itemsPerPage], () => {
  fetchProducts()
})
</script>

<template>
  <section>
    <!-- Header Card with Stats -->
    <VCard class="mb-6" elevation="0">
      <VCardText class="pa-8">
        <div class="d-flex flex-wrap align-center justify-space-between gap-6 mb-8">
          <div>
            <div class="d-flex align-center gap-3 mb-2">
              <VIcon icon="tabler-package" size="32" color="primary" />
              <h3 class="text-h3 font-weight-bold">
                Products & Services
              </h3>
            </div>
            <p class="text-body-1 text-medium-emphasis mb-0">
              Manage your product catalog and inventory
            </p>
          </div>

          <VBtn
            color="primary"
            size="large"
            elevation="0"
            prepend-icon="tabler-plus"
            class="text-none"
            @click="openAddDialog"
          >
            Add New Product
          </VBtn>
        </div>

        <!-- Stats Row -->
        <VRow class="match-height">
          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="primary" class="stat-card">
              <VCardText class="d-flex align-center gap-4">
                <VAvatar size="48" color="primary" variant="tonal">
                  <VIcon icon="tabler-box" size="28" />
                </VAvatar>
                <div>
                  <div class="text-h4 font-weight-bold">
                    {{ totalProducts }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Total Products
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="success" class="stat-card">
              <VCardText class="d-flex align-center gap-4">
                <VAvatar size="48" color="success" variant="tonal">
                  <VIcon icon="tabler-circle-check" size="28" />
                </VAvatar>
                <div>
                  <div class="text-h4 font-weight-bold">
                    {{ products.filter(p => p.status === 'active').length }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Active Products
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>

          <VCol cols="12" sm="4">
            <VCard variant="tonal" color="warning" class="stat-card">
              <VCardText class="d-flex align-center gap-4">
                <VAvatar size="48" color="warning" variant="tonal">
                  <VIcon icon="tabler-alert-triangle" size="28" />
                </VAvatar>
                <div>
                  <div class="text-h4 font-weight-bold">
                    {{ products.filter(p => p.stock <= 10).length }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    Low Stock Items
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Filters & Table Card -->
    <VCard elevation="0">
      <VCardText class="pa-6">
        <!-- Filters Section -->
        <div class="filters-wrapper mb-6">
          <VRow>
            <VCol cols="12" md="5">
              <VTextField
                v-model="searchQuery"
                placeholder="Search by name or SKU..."
                prepend-inner-icon="tabler-search"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
              />
            </VCol>

            <VCol cols="12" sm="6" md="3">
              <VSelect
                v-model="selectedCategory"
                :items="categories"
                label="Filter by Category"
                prepend-inner-icon="tabler-category"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </VCol>

            <VCol cols="12" sm="6" md="2">
              <VSelect
                v-model="selectedStatus"
                :items="statuses"
                label="Filter by Status"
                prepend-inner-icon="tabler-filter"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </VCol>

            <VCol cols="12" md="2" class="d-flex align-center">
              <VBtn
                variant="outlined"
                color="secondary"
                block
                prepend-icon="tabler-refresh"
                @click="fetchProducts"
              >
                Refresh
              </VBtn>
            </VCol>
          </VRow>
        </div>

        <VDivider class="mb-4" />

        <!-- Data Table -->
        <VDataTableServer
          v-model:page="page"
          v-model:items-per-page="itemsPerPage"
          :headers="headers"
          :items="filteredProducts"
          :items-length="totalProducts"
          class="product-table elevation-0"
          hover
        >
          <!-- Product Name & SKU -->
          <template #item.name="{ item }">
            <div class="d-flex align-center gap-3 py-2">
              <VAvatar
                size="42"
                color="primary"
                variant="tonal"
                rounded
              >
                <VIcon icon="tabler-package" size="20" />
              </VAvatar>
              <div>
                <div class="text-body-1 font-weight-medium mb-1">
                  {{ item.name }}
                </div>
                <div class="text-caption text-medium-emphasis d-flex align-center gap-1">
                  <VIcon icon="tabler-barcode" size="14" />
                  {{ item.sku }}
                </div>
              </div>
            </div>
          </template>

          <!-- Category -->
          <template #item.category="{ item }">
            <VChip
              :color="resolveCategoryColor(item.category?.slug || 'default')"
              size="small"
              variant="tonal"
              class="text-capitalize font-weight-medium"
            >
              <template #prepend>
                <VIcon icon="tabler-tag" size="16" class="me-1" />
              </template>
              {{ item.category?.name || 'Uncategorized' }}
            </VChip>
          </template>

          <!-- Price -->
          <template #item.price="{ item }">
            <div class="d-flex flex-column">
              <span class="text-body-1 font-weight-bold">{{ formatCurrency(item.price) }}</span>
              <span v-if="item.unit" class="text-caption text-medium-emphasis">per {{ item.unit }}</span>
            </div>
          </template>

          <!-- Stock -->
          <template #item.stock="{ item }">
            <VChip
              :color="item.stock > 10 ? 'success' : item.stock > 5 ? 'warning' : 'error'"
              size="small"
              variant="tonal"
              class="font-weight-bold"
            >
              <template #prepend>
                <VIcon
                  :icon="item.stock > 10 ? 'tabler-circle-check' : 'tabler-alert-triangle'"
                  size="16"
                  class="me-1"
                />
              </template>
              {{ item.stock }} units
            </VChip>
          </template>

          <!-- Status -->
          <template #item.status="{ item }">
            <VChip
              :color="resolveStatusVariant(item.status).color"
              size="small"
              variant="flat"
              class="text-capitalize font-weight-medium"
            >
              <template #prepend>
                <VIcon :icon="resolveStatusVariant(item.status).icon" size="16" class="me-1" />
              </template>
              {{ resolveStatusVariant(item.status).text }}
            </VChip>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex gap-1 justify-end">
              <VTooltip location="top">
                <template #activator="{ props }">
                  <VBtn
                    icon
                    variant="text"
                    color="default"
                    size="small"
                    v-bind="props"
                    :to="{ name: 'apps-products-preview-id', params: { id: item.id } }"
                  >
                    <VIcon icon="tabler-eye" size="20" />
                  </VBtn>
                </template>
                <span>View Details</span>
              </VTooltip>

              <VTooltip location="top">
                <template #activator="{ props }">
                  <VBtn
                    icon
                    variant="text"
                    color="default"
                    size="small"
                    v-bind="props"
                    @click="openEditDialog(item)"
                  >
                    <VIcon icon="tabler-edit" size="20" />
                  </VBtn>
                </template>
                <span>Edit Product</span>
              </VTooltip>

              <VTooltip location="top">
                <template #activator="{ props }">
                  <VBtn
                    icon
                    variant="text"
                    color="error"
                    size="small"
                    v-bind="props"
                    @click="confirmDelete(item.id)"
                  >
                    <VIcon icon="tabler-trash" size="20" />
                  </VBtn>
                </template>
                <span>Delete Product</span>
              </VTooltip>
            </div>
          </template>

          <!-- Empty State -->
          <template #no-data>
            <div class="text-center py-12">
              <VIcon icon="tabler-package-off" size="64" color="disabled" class="mb-4" />
              <h4 class="text-h5 mb-2">
                No Products Found
              </h4>
              <p class="text-body-2 text-medium-emphasis mb-4">
                {{ searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first product' }}
              </p>
              <VBtn
                v-if="!searchQuery"
                color="primary"
                prepend-icon="tabler-plus"
                @click="openAddDialog"
              >
                Add Your First Product
              </VBtn>
            </div>
          </template>
        </VDataTableServer>
      </VCardText>
    </VCard>

    <!-- Delete Confirmation Dialog -->
    <VDialog
      v-model="isDeleteDialogVisible"
      max-width="500"
      persistent
    >
      <VCard>
        <VCardTitle class="pa-6 pb-4">
          <div class="d-flex align-center gap-3">
            <VAvatar color="error" variant="tonal" size="40">
              <VIcon icon="tabler-alert-triangle" size="24" />
            </VAvatar>
            <div>
              <h5 class="text-h5">
                Delete Product
              </h5>
              <p class="text-body-2 text-medium-emphasis mb-0">
                This action cannot be undone
              </p>
            </div>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-6">
          <p class="text-body-1">
            Are you sure you want to permanently delete this product? All associated data will be removed from your inventory.
          </p>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-6 pt-4">
          <VSpacer />
          <VBtn
            variant="outlined"
            color="secondary"
            size="large"
            @click="isDeleteDialogVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            size="large"
            prepend-icon="tabler-trash"
            @click="deleteProduct"
          >
            Delete Product
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Product Form Dialog -->
    <ProductFormDialog
      v-model="isFormDialogVisible"
      :is-edit="isEditMode"
      :product="editingProduct"
      @save="handleSave"
    />

    <!-- Snackbar Notifications -->
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top end"
      elevation="4"
    >
      <div class="d-flex align-center gap-3">
        <VIcon
          :icon="snackbarColor === 'success' ? 'tabler-circle-check' : 'tabler-alert-circle'"
          size="20"
        />
        <span class="font-weight-medium">{{ snackbarText }}</span>
      </div>
    </VSnackbar>
  </section>
</template>

<style scoped lang="scss">
.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }
}

.filters-wrapper {
  background: rgba(var(--v-theme-surface), 0.4);
  border-radius: 12px;
  padding: 20px;
}

.product-table {
  :deep(.v-data-table__th) {
    font-weight: 600 !important;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.5px;
  }

  :deep(.v-data-table__tr) {
    transition: all 0.2s ease;

    &:hover {
      background: rgba(var(--v-theme-primary), 0.04);
    }
  }

  :deep(.v-data-table__td) {
    padding-block: 12px !important;
  }
}

:deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0.25px;
}
</style>
