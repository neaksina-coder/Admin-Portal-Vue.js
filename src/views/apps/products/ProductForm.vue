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

const units = ['hour', 'day', 'month', 'year', 'piece', 'license', 'user', 'gb']

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
      <VCard>
        <VCardText>
          <VRow>
            <VCol cols="12" md="8">
              <VTextField v-model="formData.name" label="Product Name" placeholder="e.g. Coca Cola" />
            </VCol>
            <VCol cols="12" md="4">
              <VTextField v-model="formData.sku" label="SKU" placeholder="e.g. SKU-001" />
            </VCol>
            <VCol cols="12" md="6">
              <VSelect v-model="formData.category_id" :items="categories" label="Category" />
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
            <VCol cols="12" md="6">
              <VSelect v-model="formData.unit" :items="units" label="Unit" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn color="secondary" variant="tonal" @click="cancelForm">Cancel</VBtn>
          <VBtn color="primary" @click="saveProduct">Save Product</VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
