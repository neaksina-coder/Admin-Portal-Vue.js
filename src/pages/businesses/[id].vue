<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type BusinessDetail = {
  id: number
  name: string
  tenantId: string
  planId?: number | null
  plan?: { id: number; name: string } | null
  status: 'active' | 'suspended'
  suspendedAt?: string | null
  suspendedReason?: string | null
  timestamps?: { created?: string; updated?: string }
}

const route = useRoute('businesses-id')

const { data: businessData, execute: fetchBusiness, isFetching } = await useApi<any>(computed(() => `/businesses/${route.params.id}`))

const business = computed<BusinessDetail | null>(() => {
  const payload = businessData.value
  return payload?.data ?? payload ?? null
})

const isSuspendDialogOpen = ref(false)
const suspendReason = ref('')
const isSubmitting = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const openSuspendDialog = () => {
  suspendReason.value = ''
  isSuspendDialogOpen.value = true
}

const toggleSuspend = async () => {
  if (!business.value)
    return

  try {
    isSubmitting.value = true
    if (business.value.status === 'suspended') {
      await $api(`/businesses/${business.value.id}/unsuspend`, { method: 'PUT' })
      showSnackbar('Business unsuspended.')
    }
    else {
      await $api(`/businesses/${business.value.id}/suspend`, {
        method: 'PUT',
        body: suspendReason.value ? { reason: suspendReason.value } : undefined,
      })
      showSnackbar('Business suspended.')
    }
    isSuspendDialogOpen.value = false
    fetchBusiness()
  }
  catch (error) {
    showSnackbar('Failed to update business status.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Business Detail</VCardTitle>
      </VCardItem>

      <VCardText v-if="business">
        <VRow>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Name</div>
            <div>{{ business.name }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Tenant ID</div>
            <div>{{ business.tenantId }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Plan</div>
            <div>{{ business.plan?.name || business.planId || '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Status</div>
            <VChip
              :color="business.status === 'active' ? 'success' : 'error'"
              size="small"
              label
              class="text-capitalize"
            >
              {{ business.status }}
            </VChip>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Created</div>
            <div>{{ business.timestamps?.created ? formatDate(business.timestamps.created) : '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Updated</div>
            <div>{{ business.timestamps?.updated ? formatDate(business.timestamps.updated) : '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Suspended At</div>
            <div>{{ business.suspendedAt ? formatDate(business.suspendedAt) : '-' }}</div>
          </VCol>
          <VCol cols="12" md="6">
            <div class="text-body-1 text-high-emphasis">Suspended Reason</div>
            <div>{{ business.suspendedReason || '-' }}</div>
          </VCol>
        </VRow>
      </VCardText>

      <VCardText v-else>
        <VAlert type="info" variant="tonal">
          Business not found.
        </VAlert>
      </VCardText>

      <VCardText class="d-flex justify-end gap-3">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchBusiness()"
        >
          Refresh
        </VBtn>
        <VBtn
          color="primary"
          @click="openSuspendDialog"
        >
          {{ business?.status === 'suspended' ? 'Unsuspend' : 'Suspend' }}
        </VBtn>
      </VCardText>
    </VCard>

    <VDialog v-model="isSuspendDialogOpen" max-width="520">
      <VCard>
        <VCardItem>
          <VCardTitle>
            {{ business?.status === 'suspended' ? 'Unsuspend Business' : 'Suspend Business' }}
          </VCardTitle>
        </VCardItem>
        <VCardText>
          <p class="mb-4">
            Business: <strong>{{ business?.name }}</strong>
          </p>
          <AppTextField
            v-if="business?.status !== 'suspended'"
            v-model="suspendReason"
            label="Reason"
            placeholder="Optional reason for suspension"
          />
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" @click="isSuspendDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            :loading="isSubmitting"
            @click="toggleSuspend"
          >
            Confirm
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
    </VSnackbar>
  </section>
</template>
