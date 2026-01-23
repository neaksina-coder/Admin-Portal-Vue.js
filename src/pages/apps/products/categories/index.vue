<script setup lang="ts">
import CategoryList from '@/views/apps/products/CategoryList.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Products',
  },
})
</script>

<template>
  <CategoryList />
</template>
