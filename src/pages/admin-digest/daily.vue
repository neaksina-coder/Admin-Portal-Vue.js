<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type DigestItem = {
  type: string
  id: string
  label: string
  reason: string
  priority: 'low' | 'medium' | 'high'
}

type DigestStats = Record<string, number>

type DigestResponse = {
  range?: string
  summaryText?: string
  topItems?: DigestItem[]
  stats?: DigestStats
  generatedAt?: string
}

const { data: digestData, execute: fetchDigest, isFetching } = await useApi<any>('/admin-digest/latest')

const digest = computed<DigestResponse>(() => digestData.value ?? {})

const resolvePriorityColor = (priority?: DigestItem['priority']) => {
  if (priority === 'high')
    return 'error'
  if (priority === 'medium')
    return 'warning'
  if (priority === 'low')
    return 'success'

  return 'secondary'
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Admin Digest</VCardTitle>
      </VCardItem>

      <VCardText>
        <div class="text-subtitle-1 text-high-emphasis mb-2">
          Summary
        </div>
        <div class="text-body-1">
          {{ digest.summaryText || 'No summary available.' }}
        </div>
      </VCardText>

      <VDivider />

      <VCardText>
        <div class="text-subtitle-1 text-high-emphasis mb-3">
          Top Items
        </div>
        <VList density="compact">
          <VListItem
            v-for="item in digest.topItems || []"
            :key="item.id"
          >
            <template #prepend>
              <VChip
                size="x-small"
                label
                :color="resolvePriorityColor(item.priority)"
              >
                {{ item.priority }}
              </VChip>
            </template>
            <VListItemTitle>{{ item.label }}</VListItemTitle>
            <VListItemSubtitle>{{ item.reason }}</VListItemSubtitle>
          </VListItem>
          <VListItem v-if="!digest.topItems?.length">
            <VListItemTitle>No items for today.</VListItemTitle>
          </VListItem>
        </VList>
      </VCardText>

      <VDivider />

      <VCardText>
        <div class="text-subtitle-1 text-high-emphasis mb-3">
          Stats
        </div>
        <VRow>
          <VCol
            v-for="(value, key) in digest.stats || {}"
            :key="key"
            cols="12"
            sm="4"
          >
            <VCard variant="tonal">
              <VCardText>
                <div class="text-body-2 text-high-emphasis text-capitalize">{{ key }}</div>
                <h4 class="text-h4">{{ value }}</h4>
              </VCardText>
            </VCard>
          </VCol>
          <VCol v-if="!digest.stats || !Object.keys(digest.stats).length" cols="12">
            <VAlert type="info" variant="tonal">
              No stats available.
            </VAlert>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText class="d-flex justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchDigest()"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>
  </section>
</template>
