<script setup lang="ts">
import ProductList from '@/views/apps/products/ProductList.vue';

definePage({
  meta: {
    action: 'read',
    subject: 'Products',
  },
})
</script>

<template>
  <ProductList />
</template>
