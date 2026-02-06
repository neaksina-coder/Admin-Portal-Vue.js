<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type PromoItem = {
  id: number
  businessId: number
  code: string
  discountType: 'percent' | 'fixed'
  discountValue: number
  startDate?: string
  endDate?: string
  usageLimit?: number
  usedCount?: number
  isActive?: boolean
  created_at?: string
}

const filters = reactive({
  businessId: '',
})

const businesses = ref<{ title: string; value: number }[]>([])

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const isCreateDialogOpen = ref(false)
const isSubmitting = ref(false)
const isFetching = ref(false)
const isEditDialogOpen = ref(false)
const isDeleteDialogOpen = ref(false)
const pendingDeleteId = ref<number | null>(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const promos = ref<PromoItem[]>([])
const totalPromos = ref(0)

const form = reactive({
  businessId: '',
  code: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  isActive: true,
})

const editForm = reactive({
  id: 0,
  businessId: '',
  code: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
  isActive: true,
})

const resetForm = () => {
  form.businessId = ''
  form.code = ''
  form.discountType = 'percent'
  form.discountValue = ''
  form.startDate = ''
  form.endDate = ''
  form.usageLimit = ''
  form.isActive = true
}

const loadBusinesses = async () => {
  try {
    const response = await $api('/businesses')
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.businesses ?? payload?.results ?? []
    businesses.value = Array.isArray(list)
      ? list.map((item: any) => ({
          title: item.name ?? item.tenantId ?? String(item.id),
          value: Number(item.id),
        }))
      : []
  }
  catch (error) {
    console.error(error)
  }
}

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const createPromo = async () => {
  try {
    isSubmitting.value = true
    await $api('/promos', {
      method: 'POST',
      body: {
        businessId: Number(form.businessId),
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        startDate: form.startDate,
        endDate: form.endDate,
        usageLimit: Number(form.usageLimit || 0),
        isActive: form.isActive,
      },
    })
    isCreateDialogOpen.value = false
    resetForm()
    loadPromos()
    showSnackbar('Promo code created.')
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to create promo code.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}

const headers = [
  { title: 'Code', key: 'code' },
  { title: 'Business', key: 'businessId' },
  { title: 'Type', key: 'discountType' },
  { title: 'Value', key: 'discountValue' },
  { title: 'Active', key: 'isActive' },
  { title: 'Start', key: 'startDate' },
  { title: 'End', key: 'endDate' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
  loadPromos()
}

const requestUrl = createUrl('/promos', {
  query: {
    businessId: computed(() => filters.businessId || undefined),
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
})

const loadPromos = async () => {
  if (!filters.businessId)
    return

  try {
    isFetching.value = true
    const response = await $api(requestUrl.value)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.promos ?? payload?.results ?? []
    promos.value = Array.isArray(list) ? list : []
    totalPromos.value = payload?.total ?? payload?.count ?? payload?.totalItems ?? promos.value.length
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to load promo codes.', 'error')
  }
  finally {
    isFetching.value = false
  }
}

const openEditDialog = (item: PromoItem) => {
  editForm.id = item.id
  editForm.businessId = String(item.businessId)
  editForm.code = item.code
  editForm.discountType = item.discountType
  editForm.discountValue = String(item.discountValue)
  editForm.startDate = item.startDate ?? ''
  editForm.endDate = item.endDate ?? ''
  editForm.usageLimit = String(item.usageLimit ?? '')
  editForm.isActive = !!item.isActive
  isEditDialogOpen.value = true
}

const updatePromo = async () => {
  try {
    isSubmitting.value = true
    await $api(`/promos/${editForm.id}`, {
      method: 'PUT',
      body: {
        businessId: Number(editForm.businessId),
        code: editForm.code,
        discountType: editForm.discountType,
        discountValue: Number(editForm.discountValue),
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        usageLimit: Number(editForm.usageLimit || 0),
        isActive: editForm.isActive,
      },
    })
    isEditDialogOpen.value = false
    loadPromos()
    showSnackbar('Promo code updated.')
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to update promo code.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}

const openDeleteDialog = (id: number) => {
  pendingDeleteId.value = id
  isDeleteDialogOpen.value = true
}

const deletePromo = async () => {
  if (!pendingDeleteId.value)
    return

  try {
    isSubmitting.value = true
    await $api(`/promos/${pendingDeleteId.value}`, { method: 'DELETE' })
    showSnackbar('Promo code deleted.')
    loadPromos()
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to delete promo code.', 'error')
  }
  finally {
    isSubmitting.value = false
    isDeleteDialogOpen.value = false
    pendingDeleteId.value = null
  }
}

const resolveBusinessName = (businessId: number) => {
  const match = businesses.value.find(item => item.value === businessId)
  return match?.title ?? businessId
}

onMounted(() => {
  loadBusinesses()
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Promo Codes</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="filters.businessId"
              :items="businesses"
              label="Business"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol cols="12" sm="6" class="d-flex align-end gap-3">
            <VBtn color="primary" @click="loadPromos">
              Search
            </VBtn>
            <VBtn color="primary" variant="tonal" @click="isCreateDialogOpen = true">
              Create Promo
            </VBtn>
          </VCol>
        </VRow>
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
        :items="promos"
        :items-length="totalPromos"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.discountValue="{ item }">
          <span>{{ item.discountValue }}</span>
        </template>
        <template #item.businessId="{ item }">
          <span>{{ resolveBusinessName(item.businessId) }}</span>
        </template>
        <template #item.isActive="{ item }">
          <VChip
            :color="item.isActive ? 'success' : 'secondary'"
            size="small"
            label
          >
            {{ item.isActive ? 'Active' : 'Inactive' }}
          </VChip>
        </template>
        <template #item.startDate="{ item }">
          <span>{{ item.startDate ? formatDate(item.startDate) : '-' }}</span>
        </template>
        <template #item.endDate="{ item }">
          <span>{{ item.endDate ? formatDate(item.endDate) : '-' }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <IconBtn @click="openEditDialog(item)">
              <VIcon icon="tabler-pencil" />
            </IconBtn>
            <IconBtn @click="openDeleteDialog(item.id)">
              <VIcon icon="tabler-trash" />
            </IconBtn>
          </div>
        </template>
      </VDataTableServer>

      <VCardText class="d-flex justify-end">
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="loadPromos"
        >
          Refresh
        </VBtn>
      </VCardText>
    </VCard>

    <VDialog v-model="isCreateDialogOpen" max-width="620">
      <VCard>
        <VCardItem>
          <VCardTitle>Create Promo Code</VCardTitle>
        </VCardItem>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="form.businessId"
                :items="businesses"
                label="Business"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.code"
                label="Code"
                placeholder="CNY-100"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="form.discountType"
                :items="[
                  { title: 'Percent', value: 'percent' },
                  { title: 'Fixed', value: 'fixed' },
                ]"
                label="Discount Type"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.discountValue"
                label="Discount Value"
                placeholder="20"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppDateTimePicker
                v-model="form.startDate"
                label="Start Date"
                placeholder="Start date"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppDateTimePicker
                v-model="form.endDate"
                label="End Date"
                placeholder="End date"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.usageLimit"
                label="Usage Limit"
                placeholder="100"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VSwitch
                v-model="form.isActive"
                label="Active"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" @click="isCreateDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="isSubmitting" @click="createPromo">
            Create
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog v-model="isEditDialogOpen" max-width="620">
      <VCard>
        <VCardItem>
          <VCardTitle>Edit Promo Code</VCardTitle>
        </VCardItem>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="editForm.businessId"
                :items="businesses"
                label="Business"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="editForm.code"
                label="Code"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="editForm.discountType"
                :items="[
                  { title: 'Percent', value: 'percent' },
                  { title: 'Fixed', value: 'fixed' },
                ]"
                label="Discount Type"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="editForm.discountValue"
                label="Discount Value"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppDateTimePicker
                v-model="editForm.startDate"
                label="Start Date"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppDateTimePicker
                v-model="editForm.endDate"
                label="End Date"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="editForm.usageLimit"
                label="Usage Limit"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VSwitch
                v-model="editForm.isActive"
                label="Active"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" @click="isEditDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="isSubmitting" @click="updatePromo">
            Save
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog v-model="isDeleteDialogOpen" max-width="420">
      <VCard>
        <VCardItem>
          <VCardTitle>Delete Promo Code</VCardTitle>
        </VCardItem>
        <VCardText>
          Are you sure you want to delete this promo code?
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" @click="isDeleteDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="error" :loading="isSubmitting" @click="deletePromo">
            Delete
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
