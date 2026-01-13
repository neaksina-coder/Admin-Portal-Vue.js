<script setup lang="ts">
import { onMounted, ref } from 'vue';

const props = defineProps<{
  id: string
}>()

const product = ref<any>(null)

onMounted(() => {
  // Simulate fetch
  product.value = {
    id: props.id,
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
  }
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
</script>

<template>
  <VRow v-if="product">
    <VCol cols="12">
      <div class="d-flex justify-space-between align-center mb-6">
        <h4 class="text-h4">Product Details</h4>
        <div class="d-flex gap-4">
          <VBtn variant="tonal" color="secondary" :to="{ name: 'apps-products' }">Back</VBtn>
          <VBtn prepend-icon="tabler-edit" :to="{ name: 'apps-products-edit-id', params: { id: props.id } }">Edit</VBtn>
        </div>
      </div>

      <VCard>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <h6 class="text-h6 mb-2">Basic Information</h6>
              <VList class="card-list">
                <VListItem>
                  <VListItemTitle class="font-weight-medium">Name:</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ product.name }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle class="font-weight-medium">SKU:</VListItemTitle>
                  <VListItemSubtitle class="text-body-1">{{ product.sku }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle class="font-weight-medium">Category:</VListItemTitle>
                  <VListItemSubtitle class="text-body-1 text-capitalize">{{ product.category }}</VListItemSubtitle>
                </VListItem>
                <VListItem>
                  <VListItemTitle class="font-weight-medium">Status:</VListItemTitle>
                  <VListItemSubtitle><VChip size="small" color="success" label>{{ product.status }}</VChip></VListItemSubtitle>
                </VListItem>
              </VList>
            </VCol>
            <VCol cols="12" md="6">
              <h6 class="text-h6 mb-2">Pricing & Inventory</h6>
              <VList class="card-list">
                <VListItem><VListItemTitle class="font-weight-medium">Selling Price:</VListItemTitle><VListItemSubtitle class="text-body-1">{{ formatCurrency(product.price) }}</VListItemSubtitle></VListItem>
                <VListItem><VListItemTitle class="font-weight-medium">Cost Price:</VListItemTitle><VListItemSubtitle class="text-body-1">{{ formatCurrency(product.cost) }}</VListItemSubtitle></VListItem>
                <VListItem><VListItemTitle class="font-weight-medium">Stock:</VListItemTitle><VListItemSubtitle class="text-body-1">{{ product.stock }} units</VListItemSubtitle></VListItem>
              </VList>
            </VCol>
            <VCol cols="12"><VDivider class="my-4" /><h6 class="text-h6 mb-2">Description</h6><p>{{ product.description }}</p></VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
