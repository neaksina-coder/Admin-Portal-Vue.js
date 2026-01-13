<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

interface Product {
  id: number
  name: string
  price: number
  sku: string
}

interface InvoiceItem {
  productId: number | null
  name: string
  quantity: number
  price: number
}

const products = ref<Product[]>([])
const selectedProduct = ref<Product | null>(null)
const invoiceItems = ref<InvoiceItem[]>([])

// Load products from the same storage as ProductList
onMounted(() => {
  const saved = localStorage.getItem('products_catalog')
  if (saved) {
    try {
      products.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load products', e)
    }
  }
})

const addItem = () => {
  if (!selectedProduct.value) return

  invoiceItems.value.push({
    productId: selectedProduct.value.id,
    name: selectedProduct.value.name,
    price: selectedProduct.value.price,
    quantity: 1
  })
  
  selectedProduct.value = null
}

const removeItem = (index: number) => {
  invoiceItems.value.splice(index, 1)
}

const totalAmount = computed(() => {
  return invoiceItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard title="Create New Invoice">
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <VTextField label="Customer Name" placeholder="Enter customer name" />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField label="Invoice Date" type="date" />
            </VCol>
          </VRow>

          <VDivider class="my-6" />

          <div class="d-flex align-end gap-4 mb-4">
            <VAutocomplete
              v-model="selectedProduct"
              :items="products"
              item-title="name"
              item-value="id"
              label="Add Product Item"
              placeholder="Search products..."
              return-object
              density="compact"
              hide-details
              style="max-width: 400px;"
            >
              <template #item="{ props, item }">
                <VListItem v-bind="props" :subtitle="`$${item.raw.price} - SKU: ${item.raw.sku}`" />
              </template>
            </VAutocomplete>
            <VBtn @click="addItem" :disabled="!selectedProduct" prepend-icon="tabler-plus">
              Add Item
            </VBtn>
          </div>

          <VTable class="invoice-table border rounded">
            <thead>
              <tr>
                <th>Item</th>
                <th style="width: 150px;">Price</th>
                <th style="width: 150px;">Quantity</th>
                <th style="width: 150px;">Total</th>
                <th style="width: 50px;"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in invoiceItems" :key="index">
                <td>{{ item.name }}</td>
                <td>
                  <VTextField 
                    v-model.number="item.price" 
                    type="number" 
                    density="compact" 
                    hide-details 
                    prefix="$"
                  />
                </td>
                <td>
                  <VTextField 
                    v-model.number="item.quantity" 
                    type="number" 
                    density="compact" 
                    hide-details 
                    min="1"
                  />
                </td>
                <td>{{ formatCurrency(item.price * item.quantity) }}</td>
                <td>
                  <VBtn icon size="small" color="error" variant="text" @click="removeItem(index)">
                    <VIcon icon="tabler-trash" />
                  </VBtn>
                </td>
              </tr>
              <tr v-if="invoiceItems.length === 0">
                <td colspan="5" class="text-center text-disabled py-4">No items added yet</td>
              </tr>
            </tbody>
            <tfoot v-if="invoiceItems.length > 0">
              <tr>
                <td colspan="3" class="text-right font-weight-bold">Total:</td>
                <td class="font-weight-bold">{{ formatCurrency(totalAmount) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </VTable>
        </VCardText>
        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn variant="tonal" color="secondary" :to="{ name: 'apps-invoice-list' }">Cancel</VBtn>
          <VBtn color="primary">Save Invoice</VBtn>
        </VCardActions>
      </VCard>
    </VCol>
  </VRow>
</template>
