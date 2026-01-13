<script setup lang="ts">
import ProductForm from '@/views/apps/products/ProductForm.vue';
import { useRoute } from 'vue-router';

const route = useRoute()
</script>

<template>
  <ProductForm is-edit :id="String(route.params.id)" />
</template>
