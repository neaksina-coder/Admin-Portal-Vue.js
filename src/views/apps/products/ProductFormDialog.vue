<script setup lang="ts">
import ProductForm from './ProductForm.vue'
import { ref, watch } from 'vue'

interface Props {
  modelValue: boolean
  isEdit?: boolean
  product?: any
}

interface Emit {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', product: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const dialog = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  dialog.value = val
})

watch(dialog, (val) => {
  if (!val) {
    emit('update:modelValue', false)
  }
})

const handleSave = (product: any) => {
  emit('save', product)
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <VDialog v-model="dialog" max-width="800px">
    <VCard :title="isEdit ? 'Edit Product' : 'Add New Product'">
      <VCardText>
        <ProductForm 
          :is-edit="isEdit" 
          :product-data="product"
          @save="handleSave" 
          @cancel="handleCancel" 
        />
      </VCardText>
    </VCard>
  </VDialog>
</template>
