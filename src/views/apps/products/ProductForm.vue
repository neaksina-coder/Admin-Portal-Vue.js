<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
  id?: string
  isEdit?: boolean
}>()

const router = useRouter()

const categories = [
  { title: 'Services', value: 'services' },
  { title: 'Software', value: 'software' },
  { title: 'Hosting', value: 'hosting' },
  { title: 'Subscriptions', value: 'subscriptions' },
]

const units = ['hour', 'day', 'month', 'year', 'piece', 'license', 'user', 'gb']

const statuses = [
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
  { title: 'Discontinued', value: 'discontinued' },
]

const formData = ref({
  name: '',
  sku: '',
  description: '',
  category: 'services',
  price: 0,
  cost: 0,
  stock: 0,
  unit: 'hour',
  status: 'active',
})

onMounted(() => {
  if (props.isEdit && props.id) {
    // Simulate fetch
    formData.value = {
      name: 'Professional Services Package',
      sku: 'SRV-001',
      description: 'Monthly professional consulting services',
      category: 'services',
      price: 2500,
      cost: 1200,
      stock: 999,
      unit: 'hour',
      status: 'active',
    }
  }
})

const saveProduct = () => {
  console.log('Saving product:', formData.value)
  router.push({ name: 'apps-products' })
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <div class="d-flex justify-space-between align-center mb-6">
        <h4 class="text-h4">{{ isEdit ? 'Edit Product' : 'Add New Product' }}</h4>
        <VBtn variant="tonal" color="secondary" :to="{ name: 'apps-products' }">Back to List</VBtn>
      </div>

      <VCard>
        <VCardText>
          <VRow>
            <VCol cols="12" md="8">
              <VTextField v-model="formData.name" label="Product Name" placeholder="e.g. Professional Services" />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model="formData.sku" label="SKU" placeholder="e.g. SRV-001" />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect v-model="formData.category" :items="categories" label="Category" />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect v-model="formData.status" :items="statuses" label="Status" />
            </VCol>
            <VCol cols="12">
              <VTextarea v-model="formData.description" label="Description" rows="3" />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model.number="formData.price" label="Selling Price" type="number" prefix="$" />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model.number="formData.cost" label="Cost Price" type="number" prefix="$" />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model.number="formData.stock" label="Stock Quantity" type="number" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="pa-4"><VSpacer /><VBtn color="secondary" variant="tonal" :to="{ name: 'apps-products' }">Cancel</VBtn><VBtn color="primary" @click="saveProduct">Save Product</VBtn></VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
