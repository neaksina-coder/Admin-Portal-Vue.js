<script setup lang="ts">
const props = defineProps<{
  id?: string
  isEdit?: boolean
  productData?: any
}>()

const emit = defineEmits(['save', 'cancel'])

const { data: categoriesData } = await useApi<any>(createUrl('/categories/', {
  query: {
    skip: 0,
    limit: 100,
  },
}))

const categories = computed(() => {
  const data = categoriesData.value?.data ?? []
  return [
    { title: 'No Category', value: null },
    ...data.map((category: any) => ({ title: category.name, value: category.id })),
  ]
})

const units = [
  { title: 'Hour', value: 'hour' },
  { title: 'Day', value: 'day' },
  { title: 'Month', value: 'month' },
  { title: 'Year', value: 'year' },
  { title: 'Piece', value: 'piece' },
  { title: 'License', value: 'license' },
  { title: 'User', value: 'user' },
  { title: 'GB', value: 'gb' },
]

const statuses = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]

const formData = ref({
  id: undefined as number | undefined,
  name: '',
  sku: '',
  description: '',
  category_id: null as number | null,
  price: 0,
  cost: 0,
  stock: 0,
  unit: 'hour',
  status: 'active',
})

const isFormValid = ref(false)

// Auto-generate SKU based on product name
const generateSKU = () => {
  if (formData.value.name && !props.isEdit && !formData.value.sku) {
    const prefix = formData.value.name
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
    const random = Math.floor(1000 + Math.random() * 9000)
    formData.value.sku = `${prefix || 'PRD'}-${random}`
  }
}

// Calculate profit margin
const profitMargin = computed(() => {
  if (formData.value.price && formData.value.cost) {
    const margin = ((formData.value.price - formData.value.cost) / formData.value.price) * 100
    return margin.toFixed(1)
  }
  return null
})

const profitAmount = computed(() => {
  if (formData.value.price && formData.value.cost) {
    return formData.value.price - formData.value.cost
  }
  return null
})

watch(() => props.productData, (val) => {
  if (val) {
    formData.value = {
      id: val.id,
      name: val.name ?? '',
      sku: val.sku ?? '',
      description: val.description ?? '',
      category_id: val.category_id ?? val.category?.id ?? null,
      price: val.price ?? 0,
      cost: val.cost ?? 0,
      stock: val.stock ?? 0,
      unit: val.unit ?? 'hour',
      status: val.status ?? 'active',
    }
  }
}, { immediate: true })

const saveProduct = () => {
  emit('save', { ...formData.value })
}

const cancelForm = () => {
  emit('cancel')
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- Header Card -->
      <VCard elevation="0" class="mb-6">
        <VCardText class="pa-8">
          <div class="d-flex align-center gap-4 mb-2">
            <VAvatar size="56" color="primary" variant="tonal" rounded>
              <VIcon :icon="isEdit ? 'tabler-edit' : 'tabler-plus'" size="32" />
            </VAvatar>
            <div>
              <h3 class="text-h3 font-weight-bold mb-1">
                {{ isEdit ? 'Edit Product' : 'Create New Product' }}
              </h3>
              <p class="text-body-1 text-medium-emphasis mb-0">
                {{ isEdit ? 'Update product information and inventory details' : 'Add a new product to your catalog' }}
              </p>
            </div>
          </div>
        </VCardText>
      </VCard>

      <!-- Main Form -->
      <VForm v-model="isFormValid">
        <VRow class="match-height">
          <!-- Basic Information -->
          <VCol cols="12" lg="8">
            <VCard elevation="0" class="h-100">
              <VCardTitle class="pa-6 pb-4">
                <div class="d-flex align-center gap-3">
                  <VIcon icon="tabler-info-circle" size="24" color="primary" />
                  <span class="text-h5 font-weight-bold">Basic Information</span>
                </div>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-6">
                <VRow>
                  <VCol cols="12">
                    <VTextField
                      v-model="formData.name"
                      label="Product Name"
                      placeholder="e.g. Premium Web Hosting"
                      prepend-inner-icon="tabler-package"
                      variant="outlined"
                      :rules="[v => !!v || 'Product name is required']"
                      @blur="generateSKU"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <VTextField
                      v-model="formData.sku"
                      label="SKU Code"
                      placeholder="e.g. PRD-1234"
                      prepend-inner-icon="tabler-barcode"
                      variant="outlined"
                      hint="Auto-generated or enter custom SKU"
                      persistent-hint
                      :rules="[v => !!v || 'SKU is required']"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <VSelect
                      v-model="formData.category_id"
                      :items="categories"
                      label="Category"
                      prepend-inner-icon="tabler-category"
                      variant="outlined"
                      hint="Select a category to organize your product"
                      persistent-hint
                    />
                  </VCol>

                  <VCol cols="12">
                    <VTextarea
                      v-model="formData.description"
                      label="Product Description"
                      placeholder="Enter detailed product description..."
                      prepend-inner-icon="tabler-file-text"
                      variant="outlined"
                      rows="4"
                      auto-grow
                      hint="Provide details about features, specifications, and benefits"
                      persistent-hint
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <VSelect
                      v-model="formData.unit"
                      :items="units"
                      label="Unit of Measurement"
                      prepend-inner-icon="tabler-ruler"
                      variant="outlined"
                    />
                  </VCol>

                  <VCol cols="12" md="6">
                    <VSelect
                      v-model="formData.status"
                      :items="statuses"
                      label="Product Status"
                      prepend-inner-icon="tabler-circle-dot"
                      variant="outlined"
                      :rules="[v => !!v || 'Status is required']"
                    />
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Pricing & Inventory -->
          <VCol cols="12" lg="4">
            <VRow class="match-height">
              <!-- Pricing Card -->
              <VCol cols="12">
                <VCard elevation="0">
                  <VCardTitle class="pa-6 pb-4">
                    <div class="d-flex align-center gap-3">
                      <VIcon icon="tabler-currency-dollar" size="24" color="success" />
                      <span class="text-h5 font-weight-bold">Pricing</span>
                    </div>
                  </VCardTitle>
                  <VDivider />
                  <VCardText class="pa-6">
                    <VRow>
                      <VCol cols="12">
                        <VTextField
                          v-model.number="formData.price"
                          label="Selling Price"
                          placeholder="0.00"
                          prepend-inner-icon="tabler-currency-dollar"
                          variant="outlined"
                          type="number"
                          step="0.01"
                          min="0"
                          :rules="[v => v >= 0 || 'Price must be positive']"
                        />
                      </VCol>

                      <VCol cols="12">
                        <VTextField
                          v-model.number="formData.cost"
                          label="Cost Price"
                          placeholder="0.00"
                          prepend-inner-icon="tabler-receipt"
                          variant="outlined"
                          type="number"
                          step="0.01"
                          min="0"
                          hint="Your purchase or production cost"
                          persistent-hint
                        />
                      </VCol>

                      <!-- Profit Margin Display -->
                      <VCol v-if="profitMargin" cols="12">
                        <VAlert
                          :color="Number(profitMargin) > 30 ? 'success' : Number(profitMargin) > 15 ? 'warning' : 'error'"
                          variant="tonal"
                          class="mb-0"
                        >
                          <div class="d-flex align-center justify-space-between">
                            <div>
                              <div class="text-caption mb-1">
                                Profit Margin
                              </div>
                              <div class="text-h6 font-weight-bold">
                                {{ profitMargin }}%
                              </div>
                            </div>
                            <div class="text-end">
                              <div class="text-caption mb-1">
                                Profit per Unit
                              </div>
                              <div class="text-h6 font-weight-bold">
                                ${{ profitAmount?.toFixed(2) }}
                              </div>
                            </div>
                          </div>
                        </VAlert>
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Inventory Card -->
              <VCol cols="12">
                <VCard elevation="0">
                  <VCardTitle class="pa-6 pb-4">
                    <div class="d-flex align-center gap-3">
                      <VIcon icon="tabler-box" size="24" color="info" />
                      <span class="text-h5 font-weight-bold">Inventory</span>
                    </div>
                  </VCardTitle>
                  <VDivider />
                  <VCardText class="pa-6">
                    <VTextField
                      v-model.number="formData.stock"
                      label="Stock Quantity"
                      placeholder="0"
                      prepend-inner-icon="tabler-package"
                      variant="outlined"
                      type="number"
                      min="0"
                      :rules="[v => v >= 0 || 'Stock must be positive']"
                    />

                    <!-- Stock Status Indicator -->
                    <VAlert
                      :color="formData.stock > 20 ? 'success' : formData.stock > 10 ? 'info' : formData.stock > 5 ? 'warning' : 'error'"
                      variant="tonal"
                      class="mt-4 mb-0"
                    >
                      <div class="d-flex align-center gap-3">
                        <VIcon
                          :icon="formData.stock > 10 ? 'tabler-circle-check' : 'tabler-alert-triangle'"
                          size="24"
                        />
                        <div>
                          <div class="font-weight-medium mb-1">
                            {{ formData.stock > 20 ? 'Good Stock Level' : formData.stock > 10 ? 'Adequate Stock' : formData.stock > 5 ? 'Low Stock Warning' : 'Critical Stock Level' }}
                          </div>
                          <div class="text-caption">
                            {{ formData.stock > 10 ? 'Inventory is well stocked' : 'Consider restocking soon' }}
                          </div>
                        </div>
                      </div>
                    </VAlert>

                    <!-- Inventory Value -->
                    <div v-if="formData.cost && formData.stock" class="mt-4 pa-4 rounded" style="background: rgba(var(--v-theme-surface), 0.4);">
                      <div class="d-flex align-center justify-space-between">
                        <div>
                          <div class="text-caption text-medium-emphasis mb-1">
                            Total Inventory Value
                          </div>
                          <div class="text-h6 font-weight-bold">
                            ${{ (formData.cost * formData.stock).toFixed(2) }}
                          </div>
                        </div>
                        <VIcon icon="tabler-coins" size="32" color="medium-emphasis" />
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VCol>
        </VRow>

        <!-- Action Buttons -->
        <VCard elevation="0" class="mt-6">
          <VCardActions class="pa-6">
            <VSpacer />
            <VBtn
              variant="outlined"
              color="secondary"
              size="large"
              prepend-icon="tabler-x"
              @click="cancelForm"
            >
              Cancel
            </VBtn>
            <VBtn
              color="primary"
              size="large"
              prepend-icon="tabler-check"
              :disabled="!isFormValid"
              @click="saveProduct"
            >
              {{ isEdit ? 'Update Product' : 'Create Product' }}
            </VBtn>
          </VCardActions>
        </VCard>
      </VForm>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
:deep(.v-card) {
  border-radius: 16px;
}

:deep(.v-avatar) {
  border-radius: 12px;
}

:deep(.v-alert) {
  border-radius: 12px;
}

:deep(.v-text-field),
:deep(.v-textarea),
:deep(.v-select) {
  .v-field {
    border-radius: 12px;
  }
}
</style>
