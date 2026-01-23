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
</script>

<template>
  <VRow>
    <VCol cols="12">
      <div v-if="loading" class="text-center py-10">
        <VProgressCircular indeterminate color="primary" size="64" />
        <p class="mt-4 text-body-1">Loading product details...</p>
      </div>

      <VAlert
        v-else-if="errorMessage"
        type="error"
        variant="tonal"
        class="mb-6"
      >
        <VAlertTitle>Error Loading Product</VAlertTitle>
        <div>{{ errorMessage }}</div>
      </VAlert>

      <VAlert
        v-else-if="!product"
        type="warning"
        variant="tonal"
        class="mb-6"
      >
        <VAlertTitle>Product Not Found</VAlertTitle>
        <div>Unable to find product with ID: {{ props.id }}</div>
        <div class="mt-4">
          <VBtn variant="tonal" :to="{ name: 'apps-products' }">
            Back to Products
          </VBtn>
        </div>
      </VAlert>

      <template v-else>
        <div class="d-flex justify-space-between align-center mb-6">
          <h4 class="text-h4">Product Details</h4>
          <div class="d-flex gap-4">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="tabler-arrow-left"
              :to="{ name: 'apps-products' }"
            >
              Back
            </VBtn>
          </div>
        </div>

        <VCard>
          <VCardText class="pa-6">
            <VRow>
              <VCol cols="12" md="6">
                <h6 class="text-h6 mb-4">Basic Information</h6>
                <VList class="card-list">
                  <VListItem>
                    <VListItemTitle class="font-weight-medium mb-1">Name:</VListItemTitle>
                    <VListItemSubtitle class="text-body-1">{{ product.name || '-' }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle class="font-weight-medium mb-1">SKU:</VListItemTitle>
                    <VListItemSubtitle class="text-body-1">{{ product.sku || '-' }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle class="font-weight-medium mb-1">Category:</VListItemTitle>
                    <VListItemSubtitle class="text-body-1 text-capitalize">{{ product.category?.name || 'Uncategorized' }}</VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle class="font-weight-medium mb-1">Status:</VListItemTitle>
                    <VListItemSubtitle>
                      <VChip size="small" :color="product.status === 'active' ? 'success' : 'warning'" label>
                        {{ product.status || 'N/A' }}
                      </VChip>
                    </VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCol>

              <VCol cols="12" md="6">
                <h6 class="text-h6 mb-4">Pricing & Inventory</h6>
                <VList class="card-list">
                  <VListItem>
                    <VListItemTitle class="font-weight-medium mb-1">Selling Price:</VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ product.price ? formatCurrency(product.price) : '-' }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle class="font-weight-medium mb-1">Cost Price:</VListItemTitle>
                    <VListItemSubtitle class="text-body-1">
                      {{ product.cost ? formatCurrency(product.cost) : '-' }}
                    </VListItemSubtitle>
                  </VListItem>
                  <VListItem>
                    <VListItemTitle class="font-weight-medium mb-1">Stock:</VListItemTitle>
                    <VListItemSubtitle class="text-body-1">{{ product.stock ?? 0 }} units</VListItemSubtitle>
                  </VListItem>
                </VList>
              </VCol>

              <VCol cols="12">
                <VDivider class="my-4" />
                <h6 class="text-h6 mb-3">Description</h6>
                <p class="text-body-1">{{ product.description || 'No description available' }}</p>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </template>
    </VCol>
  </VRow>
</template>

<style scoped>
.card-list .v-list-item {
  padding-inline: 0;
  min-height: auto;
  padding-block: 8px;
}
</style>
