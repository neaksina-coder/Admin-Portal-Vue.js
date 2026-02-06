<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type PlanDetail = {
  id: number
  planName: string
  price: number
  features?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

const route = useRoute('plans-id')

const { data: planData, execute: fetchPlan, isFetching } = await useApi<any>(computed(() => `/plans/${route.params.id}`))

const plan = computed<PlanDetail | null>(() => {
  const payload = planData.value
  return payload?.data ?? payload ?? null
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Plan Detail</VCardTitle>
      </VCardItem>

      <VCardText v-if="plan">
        <VRow>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Plan Name</div>
            <div>{{ plan.planName }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Price</div>
            <div>{{ plan.price }}</div>
          </VCol>
          <VCol cols="12">
            <div class="text-body-1 text-high-emphasis">Features</div>
            <pre class="text-body-2">{{ plan.features ? JSON.stringify(plan.features, null, 2) : '{}' }}</pre>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText v-else>
        <VAlert type="info" variant="tonal">
          Plan not found.
        </VAlert>
      </VCardText>

      <VCardText class="d-flex justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchPlan()"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>
  </section>
</template>
