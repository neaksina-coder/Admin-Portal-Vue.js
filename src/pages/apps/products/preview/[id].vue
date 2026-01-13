<script setup lang="ts">
import ProductDetails from '@/views/apps/products/ProductDetails.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <ProductDetails :id="String(route.params.id)" />
</template>
