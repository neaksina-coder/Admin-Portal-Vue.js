<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type LeaveType = {
  id: number
  name: string
  isPaid: boolean
  isActive: boolean
}

type LeavePolicy = {
  id: number
  leaveTypeId: number
  annualAllowance?: number
  accrualMethod?: string
  carryoverDays?: number | null
  maxBalance?: number | null
  allowNegative?: boolean
}

const userData = useCookie<any>('userData')
const role = computed(() => String(userData.value?.role || '').toLowerCase())
const isSuperuser = computed(() => role.value === 'superuser')
const isHrAdmin = computed(() => ['customer_owner', 'hr_admin', 'superuser'].includes(role.value))

const businessId = computed(() => {
  const raw = userData.value?.businessId
    ?? userData.value?.business_id
    ?? userData.value?.business?.id
    ?? userData.value?.business?.businessId
  const parsed = Number(raw)
  if (parsed)
    return parsed
  if (isSuperuser.value)
    return Number(import.meta.env.VITE_BUSINESS_ID ?? 1) || 1
  return null
})

const typesData = ref<any>(null)
const policiesData = ref<any>(null)
const isFetching = ref(false)
let fetchTypes = async () => {}
let fetchPolicies = async () => {}

if (businessId.value) {
  const typesApi = await useApi<any>(createUrl('/hr/leave-types', {
    query: { businessId: computed(() => businessId.value || undefined) },
  }))
  typesData.value = typesApi.data.value
  fetchTypes = typesApi.execute
  watch(typesApi.data, value => { typesData.value = value })

  const policiesApi = await useApi<any>(createUrl('/hr/leave-policies', {
    query: { businessId: computed(() => businessId.value || undefined) },
  }))
  policiesData.value = policiesApi.data.value
  fetchPolicies = policiesApi.execute
  watch(policiesApi.data, value => { policiesData.value = value })
  watch(policiesApi.isFetching, value => { isFetching.value = value })
}

const leaveTypes = computed<LeaveType[]>(() => {
  const payload = typesData.value
  const list = payload?.data ?? payload?.items ?? payload ?? []
  if (!Array.isArray(list)) return []
  return list.map((item: any) => ({
    id: Number(item?.id ?? 0),
    name: String(item?.name ?? ''),
    isPaid: Boolean(item?.isPaid ?? item?.is_paid ?? true),
    isActive: Boolean(item?.isActive ?? item?.is_active ?? true),
  })).filter(item => item.id)
})

const leavePolicies = computed<LeavePolicy[]>(() => {
  const payload = policiesData.value
  const list = payload?.data ?? payload?.items ?? payload ?? []
  if (!Array.isArray(list)) return []
  return list.map((item: any) => ({
    id: Number(item?.id ?? 0),
    leaveTypeId: Number(item?.leaveTypeId ?? item?.leave_type_id ?? 0),
    annualAllowance: Number(item?.annualAllowance ?? item?.annual_allowance ?? 0),
    accrualMethod: String(item?.accrualMethod ?? item?.accrual_method ?? 'monthly'),
    carryoverDays: item?.carryoverDays ?? item?.carryover_days ?? null,
    maxBalance: item?.maxBalance ?? item?.max_balance ?? null,
    allowNegative: Boolean(item?.allowNegative ?? item?.allow_negative ?? false),
  })).filter(item => item.leaveTypeId)
})

const policyByType = computed(() => new Map(
  leavePolicies.value.map(p => [p.leaveTypeId, p]),
))

const refreshAll = async () => {
  await Promise.all([fetchTypes(), fetchPolicies()])
}

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (text: string, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

watch(businessId, value => {
  if (!value && !isSuperuser.value)
    showSnackbar('Business ID is missing. Please logout and login again.', 'error')
}, { immediate: true })

// Leave type dialog
const isTypeOpen = ref(false)
const typeMode = ref<'create' | 'edit'>('create')
const typeForm = reactive({
  id: null as number | null,
  name: '',
  isPaid: true,
  isActive: true,
})

const openCreateType = () => {
  typeMode.value = 'create'
  typeForm.id = null
  typeForm.name = ''
  typeForm.isPaid = true
  typeForm.isActive = true
  isTypeOpen.value = true
}

const openEditType = (item: LeaveType) => {
  typeMode.value = 'edit'
  typeForm.id = item.id
  typeForm.name = item.name
  typeForm.isPaid = item.isPaid
  typeForm.isActive = item.isActive
  isTypeOpen.value = true
}

const isSavingType = ref(false)
const saveType = async () => {
  if (!typeForm.name.trim()) {
    showSnackbar('Leave type name is required.', 'error')
    return
  }
  try {
    isSavingType.value = true
    const payload = {
      businessId: businessId.value || undefined,
      name: typeForm.name.trim(),
      isPaid: typeForm.isPaid,
      isActive: typeForm.isActive,
    }
    if (typeMode.value === 'create') {
      await $api('/hr/leave-types', { method: 'POST', body: payload })
      showSnackbar('Leave type created.')
    }
    else if (typeForm.id) {
      await $api(`/hr/leave-types/${typeForm.id}`, { method: 'PUT', body: payload })
      showSnackbar('Leave type updated.')
    }
    isTypeOpen.value = false
    await refreshAll()
  }
  catch {
    showSnackbar('Failed to save leave type.', 'error')
  }
  finally {
    isSavingType.value = false
  }
}

// Policy dialog
const isPolicyOpen = ref(false)
const policyForm = reactive({
  leaveTypeId: null as number | null,
  annualAllowance: '',
  accrualMethod: 'monthly',
  carryoverDays: '',
  maxBalance: '',
  allowNegative: false,
})

const openPolicy = (type: LeaveType) => {
  const existing = policyByType.value.get(type.id)
  policyForm.leaveTypeId = type.id
  policyForm.annualAllowance = existing?.annualAllowance != null ? String(existing.annualAllowance) : ''
  policyForm.accrualMethod = existing?.accrualMethod || 'monthly'
  policyForm.carryoverDays = existing?.carryoverDays != null ? String(existing.carryoverDays) : ''
  policyForm.maxBalance = existing?.maxBalance != null ? String(existing.maxBalance) : ''
  policyForm.allowNegative = Boolean(existing?.allowNegative)
  isPolicyOpen.value = true
}

const isSavingPolicy = ref(false)
const savePolicy = async () => {
  if (!policyForm.leaveTypeId) return
  try {
    isSavingPolicy.value = true
    const payload = {
      businessId: businessId.value || undefined,
      leaveTypeId: policyForm.leaveTypeId,
      annualAllowance: policyForm.annualAllowance ? Number(policyForm.annualAllowance) : 0,
      accrualMethod: policyForm.accrualMethod,
      carryoverDays: policyForm.carryoverDays ? Number(policyForm.carryoverDays) : null,
      maxBalance: policyForm.maxBalance ? Number(policyForm.maxBalance) : null,
      allowNegative: policyForm.allowNegative,
    }
    await $api('/hr/leave-policies', { method: 'POST', body: payload })
    showSnackbar('Leave policy saved.')
    isPolicyOpen.value = false
    await refreshAll()
  }
  catch {
    showSnackbar('Failed to save leave policy.', 'error')
  }
  finally {
    isSavingPolicy.value = false
  }
}
</script>

<template>
  <section class="leave-policy-page">
    <VAlert
      v-if="!businessId && !isSuperuser"
      type="error"
      variant="tonal"
      border="start"
      class="mb-6"
    >
      Business ID is missing. Please logout and login again.
    </VAlert>

    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <p class="text-overline text-primary mb-0" style="letter-spacing:0.12em">
          Human Resources
        </p>
        <h1 class="text-h4 font-weight-bold">
          Leave Policies
        </h1>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          color="primary"
          prepend-icon="tabler-plus"
          @click="openCreateType"
        >
          Add Leave Type
        </VBtn>
        <VBtn
          variant="outlined"
          :loading="isFetching"
          prepend-icon="tabler-refresh"
          @click="refreshAll"
        >
          Refresh
        </VBtn>
      </div>
    </div>

    <VCard v-if="!isHrAdmin" class="mb-6">
      <VCardText class="text-center py-10">
        <VIcon size="48" color="warning" class="mb-3">
          tabler-lock
        </VIcon>
        <p class="text-h6">Access Restricted</p>
        <p class="text-medium-emphasis">You do not have permission to view leave policies.</p>
      </VCardText>
    </VCard>

    <VCard v-else class="table-card">
      <div class="card-header px-6 pt-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h6 font-weight-bold">Leave Types & Policies</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ leaveTypes.length }} type{{ leaveTypes.length !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>
      <VProgressLinear v-if="isFetching" indeterminate color="primary" height="2" />
      <VDivider />

      <VDataTable
        :items="leaveTypes"
        class="leave-policy-table"
        hide-default-header
      >
        <template #headers>
          <tr class="table-header-row">
            <th class="text-start pl-6">Type</th>
            <th class="text-start">Paid</th>
            <th class="text-start">Active</th>
            <th class="text-start">Allowance</th>
            <th class="text-start">Accrual</th>
            <th class="text-start">Max</th>
            <th class="text-start">Negative</th>
            <th class="text-end pr-6">Actions</th>
          </tr>
        </template>

        <template #item="{ item }">
          <tr class="table-row">
            <td class="pl-6 py-3">
              <div class="d-flex align-center gap-2">
                <VIcon size="16" color="primary">tabler-calendar-time</VIcon>
                <span class="font-weight-semibold">{{ item.name }}</span>
              </div>
            </td>
            <td>
              <VChip size="x-small" :color="item.isPaid ? 'success' : 'secondary'" variant="tonal">
                {{ item.isPaid ? 'Paid' : 'Unpaid' }}
              </VChip>
            </td>
            <td>
              <VChip size="x-small" :color="item.isActive ? 'success' : 'secondary'" variant="tonal">
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </VChip>
            </td>
            <td>
              <span class="mono">
                {{ policyByType.get(item.id)?.annualAllowance ?? '—' }}
              </span>
            </td>
            <td>
              <span class="text-capitalize">
                {{ policyByType.get(item.id)?.accrualMethod ?? '—' }}
              </span>
            </td>
            <td>
              <span class="mono">
                {{ policyByType.get(item.id)?.maxBalance ?? '—' }}
              </span>
            </td>
            <td>
              <VChip size="x-small" :color="policyByType.get(item.id)?.allowNegative ? 'warning' : 'success'" variant="tonal">
                {{ policyByType.get(item.id)?.allowNegative ? 'Allowed' : 'No' }}
              </VChip>
            </td>
            <td class="text-end pr-6">
              <div class="d-flex align-center justify-end gap-1">
                <VBtn icon size="small" variant="text" color="primary" @click="openEditType(item)">
                  <VIcon size="17">tabler-pencil</VIcon>
                  <VTooltip activator="parent">Edit type</VTooltip>
                </VBtn>
                <VBtn icon size="small" variant="text" color="secondary" @click="openPolicy(item)">
                  <VIcon size="17">tabler-settings</VIcon>
                  <VTooltip activator="parent">Set policy</VTooltip>
                </VBtn>
              </div>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="text-center py-12">
            <VIcon size="48" color="secondary" class="mb-3">tabler-calendar-off</VIcon>
            <p class="text-body-1 text-medium-emphasis">No leave types yet</p>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- Leave Type Dialog -->
    <VDialog v-model="isTypeOpen" max-width="520">
      <VCard class="dialog-card">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div class="d-flex align-center gap-3">
            <div class="dialog-icon-wrap">
              <VIcon size="20" color="primary">
                {{ typeMode === 'create' ? 'tabler-plus' : 'tabler-pencil' }}
              </VIcon>
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold">
                {{ typeMode === 'create' ? 'Add Leave Type' : 'Edit Leave Type' }}
              </h3>
              <p class="text-caption text-medium-emphasis mb-0">
                Configure the leave type details.
              </p>
            </div>
            <VSpacer />
            <VBtn icon size="small" variant="text" @click="isTypeOpen = false">
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </div>
        <VDivider />
        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12">
              <AppTextField v-model="typeForm.name" label="Leave Type Name" placeholder="Annual, Sick..." />
            </VCol>
            <VCol cols="6">
              <VSwitch v-model="typeForm.isPaid" label="Paid Leave" inset />
            </VCol>
            <VCol cols="6">
              <VSwitch v-model="typeForm.isActive" label="Active" inset />
            </VCol>
          </VRow>
        </VCardText>
        <VDivider />
        <VCardText class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="tonal" color="secondary" @click="isTypeOpen = false">Cancel</VBtn>
          <VBtn color="primary" :loading="isSavingType" prepend-icon="tabler-check" @click="saveType">
            Save
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Policy Dialog -->
    <VDialog v-model="isPolicyOpen" max-width="640">
      <VCard class="dialog-card">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div class="d-flex align-center gap-3">
            <div class="dialog-icon-wrap">
              <VIcon size="20" color="secondary">tabler-settings</VIcon>
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold">Set Leave Policy</h3>
              <p class="text-caption text-medium-emphasis mb-0">Configure allowances and rules.</p>
            </div>
            <VSpacer />
            <VBtn icon size="small" variant="text" @click="isPolicyOpen = false">
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </div>
        <VDivider />
        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12" md="4">
              <AppTextField v-model="policyForm.annualAllowance" type="number" label="Annual Allowance" />
            </VCol>
            <VCol cols="12" md="4">
              <AppSelect
                v-model="policyForm.accrualMethod"
                label="Accrual Method"
                :items="[
                  { title: 'Monthly', value: 'monthly' },
                  { title: 'Yearly', value: 'yearly' },
                ]"
                item-title="title"
                item-value="value"
              />
            </VCol>
            <VCol cols="12" md="4">
              <AppTextField v-model="policyForm.maxBalance" type="number" label="Max Balance" />
            </VCol>
            <VCol cols="12" md="4">
              <AppTextField v-model="policyForm.carryoverDays" type="number" label="Carryover Days" />
            </VCol>
            <VCol cols="12" md="4">
              <VSwitch v-model="policyForm.allowNegative" label="Allow Negative" inset />
            </VCol>
          </VRow>
        </VCardText>
        <VDivider />
        <VCardText class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="tonal" color="secondary" @click="isPolicyOpen = false">Cancel</VBtn>
          <VBtn color="primary" :loading="isSavingPolicy" prepend-icon="tabler-check" @click="savePolicy">
            Save Policy
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VSnackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top end" rounded="lg">
      <div class="d-flex align-center gap-2">
        <VIcon size="18">
          {{ snackbarColor === 'success' ? 'tabler-circle-check' : 'tabler-alert-circle' }}
        </VIcon>
        {{ snackbarText }}
      </div>
    </VSnackbar>
  </section>
</template>

<style scoped>
.table-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
}

.table-header-row th {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  color: rgba(var(--v-theme-on-surface), 0.45) !important;
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.07) !important;
  background: rgba(var(--v-theme-on-surface), 0.015) !important;
}

.table-row {
  transition: background 0.15s;
}
.table-row:hover {
  background: rgba(var(--v-theme-primary), 0.04) !important;
}
.table-row td {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05) !important;
  font-size: 13.5px;
}

.mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
}

.dialog-card {
  border-radius: 16px !important;
}
.dialog-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
