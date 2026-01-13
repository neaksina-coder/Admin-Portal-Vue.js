<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute()
const productId = route.params.id
</script>

<template>
  <VCard :title="`Product Details: ${productId}`">
    <VCardText>
      <p>Here you can display the full details for the product with ID: <strong>{{ productId }}</strong>.</p>
      <p>
        You would typically fetch the product data from your backend or state management store using this ID.
      </p>
      <VBtn :to="{ name: 'apps-products' }" class="mt-4">
        Back to Product List
      </VBtn>
    </VCardText>
  </VCard>
</template>
