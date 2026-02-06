<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type SubscriptionDetail = {
  id: number
  businessId: number
  planId: number
  startDate?: string
  endDate?: string | null
  status: 'pending' | 'active' | 'inactive'
  created_at?: string
}

type SubscriptionEvent = {
  id: number
  subscriptionId: number
  businessId: number
  invoiceId?: number | null
  actorUserId?: number | null
  eventType: string
  payload?: Record<string, unknown>
  created_at?: string
}

const route = useRoute('subscriptions-id')

const { data: subscriptionData, execute: fetchSubscription, isFetching } = await useApi<any>(computed(() => `/subscriptions/${route.params.id}`))
const { data: eventsData, execute: fetchEvents, isFetching: isFetchingEvents } = await useApi<any>(computed(() => `/subscriptions/${route.params.id}/events`))

const subscription = computed<SubscriptionDetail | null>(() => {
  const payload = subscriptionData.value
  return payload?.data ?? payload ?? null
})

const events = computed<SubscriptionEvent[]>(() => {
  const payload = eventsData.value
  const list = payload?.items ?? payload?.data?.items ?? payload?.data ?? payload?.events ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const resolveStatusColor = (status: SubscriptionDetail['status']) => {
  if (status === 'active')
    return 'success'
  if (status === 'pending')
    return 'warning'
  if (status === 'inactive')
    return 'secondary'

  return 'primary'
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Subscription Detail</VCardTitle>
      </VCardItem>

      <VCardText v-if="subscription">
        <VRow>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Business ID</div>
            <div>{{ subscription.businessId }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Plan ID</div>
            <div>{{ subscription.planId }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Status</div>
            <VChip
              :color="resolveStatusColor(subscription.status)"
              size="small"
              label
              class="text-capitalize"
            >
              {{ subscription.status }}
            </VChip>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Start Date</div>
            <div>{{ subscription.startDate ? formatDate(subscription.startDate) : '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">End Date</div>
            <div>{{ subscription.endDate ? formatDate(subscription.endDate) : '-' }}</div>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText v-else>
        <VAlert type="info" variant="tonal">
          Subscription not found.
        </VAlert>
      </VCardText>

      <VCardText class="d-flex justify-end gap-3">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchSubscription()"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>

    <VCard>
      <VCardItem>
        <VCardTitle>Subscription Events</VCardTitle>
      </VCardItem>
      <VCardText>
        <VList density="compact">
          <VListItem
            v-for="event in events"
            :key="event.id"
          >
            <VListItemTitle class="text-body-1 text-high-emphasis">
              {{ event.eventType }}
            </VListItemTitle>
            <VListItemSubtitle>
              {{ event.created_at ? formatDate(event.created_at) : '-' }}
            </VListItemSubtitle>
          </VListItem>
          <VListItem v-if="!events.length">
            <VListItemTitle>No events yet.</VListItemTitle>
          </VListItem>
        </VList>
      </VCardText>
      <VCardText class="d-flex justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetchingEvents"
          @click="fetchEvents()"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>
  </section>
</template>
