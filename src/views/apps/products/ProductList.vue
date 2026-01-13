<script setup lang="ts">
import { computed, ref } from 'vue'

// Types
interface Product {
  id: number
  name: string
  sku: string
  description: string
  category: string
  price: number
  cost: number
  stock: number
  unit: string
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: string
}

// LocalStorage key
const STORAGE_KEY = 'products_catalog'

// Load products from localStorage
const loadProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading products:', error)
  }
  
  // Default products
  return [
    {
      id: 1,
      name: 'Professional Services Package',
      sku: 'SRV-001',
      description: 'Monthly professional consulting services',
      category: 'services',
      price: 2500,
      cost: 1200,
      stock: 999,
      unit: 'hour',
      status: 'active',
      createdAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'Cloud Hosting Plan',
      sku: 'HOST-001',
      description: 'Premium cloud hosting with 99.9% uptime',
      category: 'hosting',
      price: 99.00,
      cost: 45.00,
      stock: 999,
      unit: 'month',
      status: 'active',
      createdAt: '2024-01-02',
    },
    {
      id: 3,
      name: 'Software License',
      sku: 'LIC-001',
      description: 'Annual enterprise software license',
      category: 'software',
      price: 1200.00,
      cost: 600.00,
      stock: 50,
      unit: 'license',
      status: 'active',
      createdAt: '2024-01-03',
    },
    {
      id: 4,
      name: 'Technical Support',
      sku: 'SUP-001',
      description: '24/7 technical support service',
      category: 'services',
      price: 800.00,
      cost: 350.00,
      stock: 999,
      unit: 'month',
      status: 'active',
      createdAt: '2024-01-04',
    },
    {
      id: 5,
      name: 'Custom Development',
      sku: 'DEV-001',
      description: 'Custom software development',
      category: 'services',
      price: 175.00,
      cost: 85.00,
      stock: 999,
      unit: 'hour',
      status: 'active',
      createdAt: '2024-01-05',
    },
  ]
}

// Save products to localStorage
const saveProducts = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products.value))
  } catch (error) {
    console.error('Error saving products:', error)
  }
}

// Headers for VDataTable
const headers = [
  { title: 'PRODUCT', key: 'name' },
  { title: 'CATEGORY', key: 'category' },
  { title: 'PRICE', key: 'price' },
  { title: 'STOCK', key: 'stock' },
  { title: 'STATUS', key: 'status' },
  { title: 'ACTIONS', key: 'actions', sortable: false },
]

// State
const products = ref<Product[]>(loadProducts())
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedStatus = ref('all')
const isDeleteDialogVisible = ref(false)
const deleteId = ref<number | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Options
const categories = [
  { title: 'All Categories', value: 'all' },
  { title: 'Services', value: 'services' },
  { title: 'Software', value: 'software' },
  { title: 'Hosting', value: 'hosting' },
  { title: 'Subscriptions', value: 'subscriptions' },
]

const statuses = [
  { title: 'All Status', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
  { title: 'Discontinued', value: 'discontinued' },
]

const unitOptions = [
  { title: 'Hour', value: 'hour' },
  { title: 'Day', value: 'day' },
  { title: 'Month', value: 'month' },
  { title: 'Year', value: 'year' },
  { title: 'Piece', value: 'piece' },
  { title: 'License', value: 'license' },
  { title: 'User', value: 'user' },
]

// Computed
const filteredProducts = computed(() => {
  return products.value.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesCategory =
      selectedCategory.value === 'all' || product.category === selectedCategory.value

    const matchesStatus =
      selectedStatus.value === 'all' || product.status === selectedStatus.value

    return matchesSearch && matchesCategory && matchesStatus
  })
})

// Methods
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
  if (status === 'discontinued') return { color: 'error', text: 'Discontinued' }
  return { color: 'primary', text: status }
}

const resolveCategoryColor = (category: string) => {
  if (category === 'services') return 'primary'
  if (category === 'software') return 'info'
  if (category === 'hosting') return 'success'
  if (category === 'subscriptions') return 'warning'
  return 'secondary'
}

const calculateMargin = (price: number, cost: number) => {
  if (price === 0) return '0'
  return ((price - cost) / price * 100).toFixed(1)
}

// Delete Product
const confirmDelete = (id: number) => {
  deleteId.value = id
  isDeleteDialogVisible.value = true
}

const deleteProduct = () => {
  if (deleteId.value) {
    products.value = products.value.filter(p => p.id !== deleteId.value)
    saveProducts()
    deleteId.value = null
    isDeleteDialogVisible.value = false
    showSnackbar('Product deleted successfully!', 'error')
  }
}
</script>

<template>
  <section>
    <VAlert
      variant="tonal"
      color="info"
      class="mb-4"
    >
      ProductList.vue component loaded.
    </VAlert>
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
              :to="{ name: 'apps-products-add' }"
            >
              Add Product
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>

      <VDataTable
        :headers="headers"
        :items="filteredProducts"
        :items-per-page="10"
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
            :color="resolveCategoryColor(item.category)"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.category }}
          </VChip>
        </template>

        <template #item.price="{ item }">
          {{ formatCurrency(item.price) }}
          <span class="text-caption text-disabled">/ {{ item.unit }}</span>
        </template>

        <template #item.stock="{ item }">
          <VChip
            :color="item.stock > 10 || item.stock === 999 ? 'success' : 'warning'"
            size="small"
            variant="tonal"
          >
            {{ item.stock === 999 ? '∞' : item.stock }}
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
            :to="{ name: 'apps-products-edit-id', params: { id: item.id } }"
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
      </VDataTable>
    </VCard>

    <!-- Delete Dialog -->
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

    <!-- Snackbar -->
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
