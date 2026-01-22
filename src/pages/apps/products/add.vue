<script setup lang="ts">
import ProductForm from '@/views/apps/products/ProductForm.vue';

definePage({
  meta: {
    action: 'create',
    subject: 'Products',
  },
})
</script>

<template>
  <ProductForm />
</template>
