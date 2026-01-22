<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PurchasedProduct } from './types'
import { useProducts } from '@/composables/useProducts'

interface Emit {
  (e: 'removeProduct', value: number): void
  (e: 'totalAmount', value: number): void
}

interface Props {
  id: number
  data: PurchasedProduct
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({
    id: null,
    name: 'App Design',
    sku: 'SKU-001',
    description: 'Designed UI kit & app pages.',
    category: 'services',
    price: 24,
    cost: 24,
    stock: 999,
    unit: 'hour',
    status: 'active',
    quantity: 1,
  }),
})

const emit = defineEmits<Emit>()
const { products } = useProducts()

const selectedProduct = ref<PurchasedProduct['name'] | undefined>(props.data.name)
const localProductData = ref(structuredClone(toRaw(props.data)))

watch(selectedProduct, () => {
  const product = products.value.find(p => p.name === selectedProduct.value)
  if (product) {
    localProductData.value = {
      ...product,
      quantity: 1,
    }
  }
})

const removeProduct = () => {
  emit('removeProduct', props.id)
}

const totalPrice = computed(() => Number(localProductData.value.price) * Number(localProductData.value.quantity))

watch(totalPrice, () => {
  emit('totalAmount', totalPrice.value)
}, { immediate: true })
</script>

<template>
  <!-- eslint-disable vue/no-mutating-props -->
  <div class="add-products-header mb-2 d-none d-md-flex mb-4">
    <VRow class="me-10">
      <VCol
        cols="12"
        md="6"
      >
        <h6 class="text-h6">
          Item
        </h6>
      </VCol>
      <VCol
        cols="12"
        md="2"
      >
        <h6 class="text-h6 ps-2">
          Price
        </h6>
      </VCol>
      <VCol
        cols="12"
        md="2"
      >
        <h6 class="text-h6 ps-2">
          Quantity
        </h6>
      </VCol>
      <VCol
        cols="12"
        md="2"
      >
        <h6 class="text-h6">
          Total
        </h6>
      </VCol>
    </VRow>
  </div>

  <VCard
    flat
    border
    class="d-flex flex-sm-row flex-column-reverse"
  >
    <!-- 👉 Left Form -->
    <div class="pa-6 flex-grow-1">
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <AppSelect
            id="item"
            v-model="selectedProduct"
            :items="products"
            item-title="name"
            item-value="name"
            placeholder="Select Item"
            class="mb-6"
          />

          <AppTextarea
            id="item-description"
            v-model="localProductData.description"
            rows="2"
            placeholder="Item description"
            persistent-placeholder
          />
        </VCol>
        <VCol
          cols="12"
          md="2"
          sm="4"
        >
          <AppTextField
            id="item-cost"
            v-model="localProductData.price"
            type="number"
            placeholder="Price"
            class="mb-6"
          />

          <div class="text-high-emphasis text-no-wrap mt-4">
            <p class="mb-1">
              Discount
            </p>
            <span>0%</span>
            <span class="mx-2">
              0%
              <VTooltip activator="parent">Tax 1</VTooltip>
            </span>
            <span>
              0%
              <VTooltip activator="parent">Tax 2</VTooltip>
            </span>
          </div>
        </VCol>
        <VCol
          cols="12"
          md="2"
          sm="4"
        >
          <AppTextField
            id="item-quantity"
            v-model="localProductData.quantity"
            type="number"
            placeholder="1"
          />
        </VCol>
        <VCol
          cols="12"
          md="2"
          sm="4"
        >
          <p class="my-2">
            <span class="d-inline d-md-none">Price: </span>
            <span class="text-high-emphasis">${{ totalPrice }}</span>
          </p>
        </VCol>
      </VRow>
    </div>

    <!-- 👉 Item Actions -->
    <div
      class="d-flex flex-column align-end item-actions"
      :class="$vuetify.display.smAndUp ? 'border-s' : 'border-b' "
    >
      <IconBtn
        size="36"
        @click="removeProduct"
      >
        <VIcon
          :size="24"
          icon="tabler-x"
        />
      </IconBtn>
    </div>
  </VCard>
</template>
