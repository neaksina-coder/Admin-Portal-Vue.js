<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type BusinessItem = {
  id: number
  name: string
  tenantId: string
  plan?: { id: number; name: string } | null
  planId?: number | null
  status: 'active' | 'suspended'
  suspendedAt?: string | null
  suspendedReason?: string | null
  timestamps?: { created?: string; updated?: string }
}

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Tenant', key: 'tenantId' },
  { title: 'Plan', key: 'plan' },
  { title: 'Status', key: 'status' },
  { title: 'Created', key: 'created' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const { data: businessesData, execute: fetchBusinesses, isFetching } = await useApi<any>(createUrl('/businesses', {
  query: {
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
}))

const businesses = computed<BusinessItem[]>(() => {
  const payload = businessesData.value
  const list = payload?.items ?? payload?.data ?? payload?.businesses ?? payload?.results ?? []

  return Array.isArray(list) ? list : []
})

const totalBusinesses = computed(() => {
  const payload = businessesData.value
  return payload?.total ?? payload?.count ?? payload?.totalItems ?? businesses.value.length
})

const resolveStatusColor = (status: BusinessItem['status']) => {
  if (status === 'active')
    return 'success'
  if (status === 'suspended')
    return 'error'

  return 'secondary'
}

const isSuspendDialogOpen = ref(false)
const pendingBusiness = ref<BusinessItem | null>(null)
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

const openSuspendDialog = (item: BusinessItem) => {
  pendingBusiness.value = item
  suspendReason.value = ''
  isSuspendDialogOpen.value = true
}

const toggleSuspend = async (item: BusinessItem) => {
  try {
    isSubmitting.value = true
    if (item.status === 'suspended') {
      await $api(`/businesses/${item.id}/unsuspend`, { method: 'PUT' })
      showSnackbar('Business unsuspended.')
    }
    else {
      await $api(`/businesses/${item.id}/suspend`, {
        method: 'PUT',
        body: suspendReason.value ? { reason: suspendReason.value } : undefined,
      })
      showSnackbar('Business suspended.')
    }
    isSuspendDialogOpen.value = false
    fetchBusinesses()
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
        <VCardTitle>Businesses</VCardTitle>
      </VCardItem>

      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <VBtn color="primary" :to="{ name: 'businesses-create' }">
          Create Business
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="fetchBusinesses()"
        >
          Reload
        </VBtn>
      </VCardText>

      <VDivider />

      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items-per-page-options="[
          { value: 20, title: '20' },
          { value: 50, title: '50' },
          { value: 100, title: '100' },
        ]"
        :items="businesses"
        :items-length="totalBusinesses"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.id="{ item }">
          <span class="text-high-emphasis font-weight-medium">#{{ item.id }}</span>
        </template>

        <template #item.name="{ item }">
          <span>{{ item.name }}</span>
        </template>

        <template #item.tenantId="{ item }">
          <span>{{ item.tenantId }}</span>
        </template>

        <template #item.plan="{ item }">
          <span>{{ item.plan?.name || item.planId || '-' }}</span>
        </template>

        <template #item.status="{ item }">
          <VChip
            :color="resolveStatusColor(item.status)"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.status }}
          </VChip>
        </template>

        <template #item.created="{ item }">
          <span>{{ item.timestamps?.created ? formatDate(item.timestamps.created) : '-' }}</span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <IconBtn :to="{ name: 'businesses-id', params: { id: item.id } }">
              <VIcon icon="tabler-eye" />
            </IconBtn>
            <VBtn
              size="small"
              variant="tonal"
              color="secondary"
              @click="openSuspendDialog(item)"
            >
              {{ item.status === 'suspended' ? 'Unsuspend' : 'Suspend' }}
            </VBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCard>

    <VDialog v-model="isSuspendDialogOpen" max-width="520">
      <VCard>
        <VCardItem>
          <VCardTitle>
            {{ pendingBusiness?.status === 'suspended' ? 'Unsuspend Business' : 'Suspend Business' }}
          </VCardTitle>
        </VCardItem>
        <VCardText>
          <p class="mb-4">
            Business: <strong>{{ pendingBusiness?.name }}</strong>
          </p>
          <AppTextField
            v-if="pendingBusiness?.status !== 'suspended'"
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
            @click="pendingBusiness && toggleSuspend(pendingBusiness)"
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
