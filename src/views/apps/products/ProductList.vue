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
  { title: 'PRODUCT', key: 'name' },
  { title: 'CATEGORY', key: 'category' },
  { title: 'PRICE', key: 'price' },
  { title: 'STOCK', key: 'stock' },
  { title: 'STATUS', key: 'status' },
  { title: 'ACTIONS', key: 'actions', sortable: false },
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
  if (status === 'active') return { color: 'success', text: 'Active' }
  if (status === 'inactive') return { color: 'secondary', text: 'Inactive' }
  return { color: 'primary', text: status }
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
    <VCard title="Products & Services">
      <VCardText>
        <VRow>
          <VCol cols="12" md="4">
            <VTextField
              v-model="searchQuery"
              placeholder="Search Product"
              prepend-inner-icon="tabler-search"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="selectedCategory"
              :items="categories"
              label="Category"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VSelect
              v-model="selectedStatus"
              :items="statuses"
              label="Status"
              density="compact"
            />
          </VCol>
          <VCol cols="12" md="2" class="d-flex align-center justify-end">
            <VBtn
              prepend-icon="tabler-plus"
              @click="openAddDialog"
            >
              Add Product
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDataTableServer
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="filteredProducts"
        :items-length="totalProducts"
        class="text-no-wrap"
      >
        <template #item.name="{ item }">
          <div class="d-flex flex-column">
            <span class="font-weight-medium">{{ item.name }}</span>
            <span class="text-caption text-disabled">{{ item.sku }}</span>
          </div>
        </template>

        <template #item.category="{ item }">
          <VChip
            :color="resolveCategoryColor(item.category?.slug || 'default')"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.category?.name || 'Uncategorized' }}
          </VChip>
        </template>

        <template #item.price="{ item }">
          {{ formatCurrency(item.price) }}
          <span v-if="item.unit" class="text-caption text-disabled">/ {{ item.unit }}</span>
        </template>

        <template #item.stock="{ item }">
          <VChip
            :color="item.stock > 10 ? 'success' : 'warning'"
            size="small"
            variant="tonal"
          >
            {{ item.stock }}
          </VChip>
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="resolveStatusVariant(item.status).color"
            size="small"
            class="text-capitalize"
          >
            {{ resolveStatusVariant(item.status).text }}
          </VChip>
        </template>

        <template #item.actions="{ item }">
          <VBtn
            icon
            variant="text"
            color="default"
            size="x-small"
            :to="{ name: 'apps-products-preview-id', params: { id: item.id } }"
          >
            <VIcon icon="tabler-eye" :size="22" />
          </VBtn>
          <VBtn
            icon
            variant="text"
            color="default"
            size="x-small"
            @click="openEditDialog(item)"
          >
            <VIcon icon="tabler-edit" :size="22" />
          </VBtn>
          <VBtn
            icon
            variant="text"
            color="error"
            size="x-small"
            @click="confirmDelete(item.id)"
          >
            <VIcon icon="tabler-trash" :size="22" />
          </VBtn>
        </template>
      </VDataTableServer>
    </VCard>

    <VDialog v-model="isDeleteDialogVisible" max-width="400">
      <VCard title="Confirm Delete">
        <VCardText>
          Are you sure you want to delete this product? This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            color="secondary"
            variant="tonal"
            @click="isDeleteDialogVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            variant="elevated"
            @click="deleteProduct"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <ProductFormDialog
      v-model="isFormDialogVisible"
      :is-edit="isEditMode"
      :product="editingProduct"
      @save="handleSave"
    />

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
