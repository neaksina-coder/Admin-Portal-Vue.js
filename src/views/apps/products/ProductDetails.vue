<script setup lang="ts">
const props = defineProps<{
  id: string
}>()

const product = ref<any>(null)
const loading = ref(false)
const errorMessage = ref('')

const fetchProduct = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const res = await $api(`/products/${props.id}`)
    product.value = res?.data ?? res ?? null
  }
  catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Failed to load product details.'
    product.value = null
  }
  finally {
    loading.value = false
  }
}

watch(() => props.id, fetchProduct, { immediate: true })

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
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

const stockStatus = computed(() => {
  if (!product.value) return { color: 'secondary', text: 'Unknown', icon: 'tabler-help-circle' }
  const stock = product.value.stock ?? 0
  if (stock > 20) return { color: 'success', text: 'In Stock', icon: 'tabler-circle-check' }
  if (stock > 10) return { color: 'info', text: 'Good Stock', icon: 'tabler-circle-dot' }
  if (stock > 5) return { color: 'warning', text: 'Low Stock', icon: 'tabler-alert-triangle' }
  return { color: 'error', text: 'Critical Stock', icon: 'tabler-alert-circle' }
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-16">
        <VProgressCircular indeterminate color="primary" size="64" width="6" />
        <h5 class="text-h5 mt-6 mb-2">
          Loading Product Details
        </h5>
        <p class="text-body-2 text-medium-emphasis">
          Please wait while we fetch the information...
        </p>
      </div>

      <!-- Error State -->
      <VCard v-else-if="errorMessage" elevation="0" class="error-card">
        <VCardText class="pa-8 text-center">
          <VAvatar size="80" color="error" variant="tonal" class="mb-4">
            <VIcon icon="tabler-alert-circle" size="48" />
          </VAvatar>
          <h4 class="text-h4 mb-2">
            Error Loading Product
          </h4>
          <p class="text-body-1 text-medium-emphasis mb-6">
            {{ errorMessage }}
          </p>
          <div class="d-flex gap-3 justify-center">
            <VBtn
              variant="outlined"
              color="secondary"
              prepend-icon="tabler-arrow-left"
              :to="{ name: 'apps-products' }"
            >
              Back to Products
            </VBtn>
            <VBtn
              color="primary"
              prepend-icon="tabler-refresh"
              @click="fetchProduct"
            >
              Try Again
            </VBtn>
          </div>
        </VCardText>
      </VCard>

      <!-- Not Found State -->
      <VCard v-else-if="!product" elevation="0" class="warning-card">
        <VCardText class="pa-8 text-center">
          <VAvatar size="80" color="warning" variant="tonal" class="mb-4">
            <VIcon icon="tabler-package-off" size="48" />
          </VAvatar>
          <h4 class="text-h4 mb-2">
            Product Not Found
          </h4>
          <p class="text-body-1 text-medium-emphasis mb-6">
            Unable to find product with ID: <strong>{{ props.id }}</strong>
          </p>
          <VBtn
            variant="outlined"
            color="secondary"
            prepend-icon="tabler-arrow-left"
            size="large"
            :to="{ name: 'apps-products' }"
          >
            Back to Products
          </VBtn>
        </VCardText>
      </VCard>

      <!-- Product Details -->
      <template v-else>
        <!-- Header Section -->
        <VCard elevation="0" class="mb-6">
          <VCardText class="pa-8">
            <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
              <div class="d-flex align-center gap-4">
                <VAvatar size="64" color="primary" variant="tonal" rounded>
                  <VIcon icon="tabler-package" size="36" />
                </VAvatar>
                <div>
                  <h3 class="text-h3 font-weight-bold mb-1">
                    {{ product.name }}
                  </h3>
                  <div class="d-flex align-center gap-2 text-body-2 text-medium-emphasis">
                    <VIcon icon="tabler-barcode" size="16" />
                    <span>SKU: {{ product.sku }}</span>
                  </div>
                </div>
              </div>

              <div class="d-flex gap-3">
                <VBtn
                  variant="outlined"
                  color="secondary"
                  prepend-icon="tabler-arrow-left"
                  size="large"
                  :to="{ name: 'apps-products' }"
                >
                  Back
                </VBtn>
              </div>
            </div>

            <!-- Quick Stats -->
            <VRow class="match-height">
              <VCol cols="12" sm="6" md="3">
                <div class="stat-box">
                  <div class="d-flex align-center gap-3">
                    <VAvatar size="48" color="success" variant="tonal">
                      <VIcon icon="tabler-currency-dollar" size="24" />
                    </VAvatar>
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1">
                        Selling Price
                      </div>
                      <div class="text-h5 font-weight-bold">
                        {{ formatCurrency(product.price) }}
                      </div>
                    </div>
                  </div>
                </div>
              </VCol>

              <VCol cols="12" sm="6" md="3">
                <div class="stat-box">
                  <div class="d-flex align-center gap-3">
                    <VAvatar size="48" :color="stockStatus.color" variant="tonal">
                      <VIcon :icon="stockStatus.icon" size="24" />
                    </VAvatar>
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1">
                        Stock Level
                      </div>
                      <div class="text-h5 font-weight-bold">
                        {{ product.stock ?? 0 }} units
                      </div>
                    </div>
                  </div>
                </div>
              </VCol>

              <VCol cols="12" sm="6" md="3">
                <div class="stat-box">
                  <div class="d-flex align-center gap-3">
                    <VAvatar size="48" color="primary" variant="tonal">
                      <VIcon icon="tabler-tag" size="24" />
                    </VAvatar>
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1">
                        Category
                      </div>
                      <VChip
                        :color="resolveCategoryColor(product.category?.slug || 'default')"
                        size="small"
                        variant="tonal"
                        class="text-capitalize font-weight-medium"
                      >
                        {{ product.category?.name || 'N/A' }}
                      </VChip>
                    </div>
                  </div>
                </div>
              </VCol>

              <VCol cols="12" sm="6" md="3">
                <div class="stat-box">
                  <div class="d-flex align-center gap-3">
                    <VAvatar size="48" :color="resolveStatusVariant(product.status).color" variant="tonal">
                      <VIcon :icon="resolveStatusVariant(product.status).icon" size="24" />
                    </VAvatar>
                    <div>
                      <div class="text-caption text-medium-emphasis mb-1">
                        Status
                      </div>
                      <VChip
                        :color="resolveStatusVariant(product.status).color"
                        size="small"
                        variant="flat"
                        class="text-capitalize font-weight-medium"
                      >
                        {{ resolveStatusVariant(product.status).text }}
                      </VChip>
                    </div>
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <!-- Detailed Information -->
        <VRow class="match-height">
          <!-- Basic Information -->
          <VCol cols="12" md="6">
            <VCard elevation="0" class="h-100">
              <VCardTitle class="pa-6 pb-4">
                <div class="d-flex align-center gap-3">
                  <VIcon icon="tabler-info-circle" size="24" color="primary" />
                  <span class="text-h5 font-weight-bold">Basic Information</span>
                </div>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-6">
                <VList class="info-list">
                  <VListItem class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-file-text" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Product Name
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ product.name || '-' }}
                    </VListItemSubtitle>
                  </VListItem>

                  <VListItem class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-barcode" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      SKU Code
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ product.sku || '-' }}
                    </VListItemSubtitle>
                  </VListItem>

                  <VListItem class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-category" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Category
                    </VListItemTitle>
                    <VListItemSubtitle>
                      <VChip
                        :color="resolveCategoryColor(product.category?.slug || 'default')"
                        size="small"
                        variant="tonal"
                        class="text-capitalize"
                      >
                        {{ product.category?.name || 'Uncategorized' }}
                      </VChip>
                    </VListItemSubtitle>
                  </VListItem>

                  <VListItem class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-package" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Unit Type
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ product.unit || 'Not specified' }}
                    </VListItemSubtitle>
                  </VListItem>

                  <VListItem class="px-0">
                    <template #prepend>
                      <VIcon :icon="resolveStatusVariant(product.status).icon" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Product Status
                    </VListItemTitle>
                    <VListItemSubtitle>
                      <VChip
                        :color="resolveStatusVariant(product.status).color"
                        size="small"
                        variant="flat"
                        class="text-capitalize"
                      >
                        <template #prepend>
                          <VIcon :icon="resolveStatusVariant(product.status).icon" size="16" class="me-1" />
                        </template>
                        {{ resolveStatusVariant(product.status).text }}
                      </VChip>
                    </VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Pricing & Inventory -->
          <VCol cols="12" md="6">
            <VCard elevation="0" class="h-100">
              <VCardTitle class="pa-6 pb-4">
                <div class="d-flex align-center gap-3">
                  <VIcon icon="tabler-currency-dollar" size="24" color="success" />
                  <span class="text-h5 font-weight-bold">Pricing & Inventory</span>
                </div>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-6">
                <VList class="info-list">
                  <VListItem class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-currency-dollar" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Selling Price
                    </VListItemTitle>
                    <VListItemSubtitle class="text-h6 font-weight-bold text-success">
                      {{ product.price ? formatCurrency(product.price) : '-' }}
                      <span v-if="product.unit" class="text-body-2 text-medium-emphasis font-weight-regular">
                        / {{ product.unit }}
                      </span>
                    </VListItemSubtitle>
                  </VListItem>

                  <VListItem class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-receipt" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Cost Price
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ product.cost ? formatCurrency(product.cost) : 'Not set' }}
                    </VListItemSubtitle>
                  </VListItem>

                  <VListItem v-if="product.cost && product.price" class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-percentage" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Profit Margin
                    </VListItemTitle>
                    <VListItemSubtitle>
                      <VChip
                        :color="((product.price - product.cost) / product.price * 100) > 30 ? 'success' : 'warning'"
                        size="small"
                        variant="tonal"
                      >
                        {{ ((product.price - product.cost) / product.price * 100).toFixed(1) }}%
                      </VChip>
                    </VListItemSubtitle>
                  </VListItem>

                  <VListItem class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-box" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Stock Quantity
                    </VListItemTitle>
                    <VListItemSubtitle>
                      <div class="d-flex align-center gap-2">
                        <span class="text-h6 font-weight-bold">{{ product.stock ?? 0 }} units</span>
                        <VChip
                          :color="stockStatus.color"
                          size="x-small"
                          variant="tonal"
                        >
                          {{ stockStatus.text }}
                        </VChip>
                      </div>
                    </VListItemSubtitle>
                  </VListItem>

                  <VListItem v-if="product.cost && product.stock" class="px-0">
                    <template #prepend>
                      <VIcon icon="tabler-coins" size="20" class="me-3" color="medium-emphasis" />
                    </template>
                    <VListItemTitle class="text-body-2 text-medium-emphasis mb-1">
                      Inventory Value
                    </VListItemTitle>
                    <VListItemSubtitle class="text-body-1 font-weight-medium">
                      {{ formatCurrency(product.cost * product.stock) }}
                    </VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Description -->
          <VCol cols="12">
            <VCard elevation="0">
              <VCardTitle class="pa-6 pb-4">
                <div class="d-flex align-center gap-3">
                  <VIcon icon="tabler-file-description" size="24" color="info" />
                  <span class="text-h5 font-weight-bold">Product Description</span>
                </div>
              </VCardTitle>
              <VDivider />
              <VCardText class="pa-6">
                <p v-if="product.description" class="text-body-1 ma-0 description-text">
                  {{ product.description }}
                </p>
                <div v-else class="text-center py-8">
                  <VIcon icon="tabler-file-off" size="48" color="disabled" class="mb-3" />
                  <p class="text-body-2 text-medium-emphasis mb-0">
                    No description available for this product
                  </p>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </template>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
.stat-box {
  padding: 20px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface), 0.4);
  border: 1px solid rgba(var(--v-border-color), 0.12);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
}

.info-list {
  .v-list-item {
    padding-block: 16px !important;
    min-height: auto;

    &:not(:last-child) {
      border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
    }
  }
}

.description-text {
  line-height: 1.8;
  white-space: pre-wrap;
}

.error-card,
.warning-card {
  border: 2px solid rgba(var(--v-border-color), 0.12);
  border-radius: 16px;
}

:deep(.v-card) {
  border-radius: 16px;
}

:deep(.v-avatar) {
  border-radius: 12px;
}
</style>
