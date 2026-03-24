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
}

type LeaveBalance = {
  userId: number
  leaveTypeId: number
  balance: number
  pending: number
  used: number
}

const userData = useCookie<any>('userData')
const role = computed(() => String(userData.value?.role || '').toLowerCase())
const isSuperuser = computed(() => role.value === 'superuser')

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

const isHrAdmin = computed(() => ['customer_owner', 'hr_admin', 'superuser'].includes(role.value))

const balancesData = ref<any>(null)
const typesData = ref<any>(null)
const employeesData = ref<any>(null)
let fetchBalances = async () => {}
let fetchTypes = async () => {}
let fetchEmployees = async () => {}
const selectedEmployeeId = ref<number | null>(null)

if (businessId.value) {
  const balancesApi = await useApi<any>(createUrl(
    isHrAdmin.value
      ? '/hr/leave-balances'
      : '/hr/leave-balances/me',
    isHrAdmin.value
      ? { query: { businessId: computed(() => businessId.value || undefined), userId: computed(() => selectedEmployeeId.value || undefined) } }
      : undefined,
  ))
  balancesData.value = balancesApi.data.value
  fetchBalances = balancesApi.execute
  watch(balancesApi.data, value => { balancesData.value = value })

  const typesApi = await useApi<any>(createUrl('/hr/leave-types', {
    query: { businessId: computed(() => businessId.value || undefined) },
  }))
  typesData.value = typesApi.data.value
  fetchTypes = typesApi.execute
  watch(typesApi.data, value => { typesData.value = value })

  if (isHrAdmin.value) {
    const employeesApi = await useApi<any>(createUrl('/hr/employees', {
      query: { businessId: computed(() => businessId.value || undefined) },
    }))
    employeesData.value = employeesApi.data.value
    fetchEmployees = employeesApi.execute
    watch(employeesApi.data, value => { employeesData.value = value })
  }
}

const leaveTypes = computed<LeaveType[]>(() => {
  const payload = typesData.value
  const list = payload?.data ?? payload?.items ?? payload ?? []
  if (!Array.isArray(list)) return []
  return list.map((item: any) => ({
    id: Number(item?.id ?? 0),
    name: String(item?.name ?? ''),
  })).filter(item => item.id && item.name)
})

const balances = computed<LeaveBalance[]>(() => {
  const payload = balancesData.value
  const list = payload?.data ?? payload?.items ?? payload ?? []
  if (!Array.isArray(list)) return []
  return list.map((item: any) => ({
    userId: Number(item?.userId ?? item?.user_id ?? 0),
    leaveTypeId: Number(item?.leaveTypeId ?? item?.leave_type_id ?? 0),
    balance: Number(item?.balance ?? 0),
    pending: Number(item?.pending ?? 0),
    used: Number(item?.used ?? 0),
  })).filter(item => item.leaveTypeId)
})

const typeName = (id: number) =>
  leaveTypes.value.find(t => t.id === id)?.name || `Type #${id}`

const available = (b: LeaveBalance) => b.balance - b.pending

const employees = computed(() => {
  const payload = employeesData.value
  const list = payload?.data ?? payload?.items ?? payload?.employees ?? payload?.results ?? []
  if (!Array.isArray(list)) return []
  return list.map((item: any) => ({
    id: Number(item?.id ?? item?.userId ?? item?.user_id ?? 0),
    name: String(item?.fullName ?? item?.name ?? item?.full_name ?? ''),
  })).filter((item: any) => item.id)
})

const employeeName = (id: number) =>
  employees.value.find(e => e.id === id)?.name || `User #${id}`

const refreshAll = async () => {
  await Promise.all([fetchBalances(), fetchTypes(), isHrAdmin.value ? fetchEmployees() : Promise.resolve()])
}
</script>

<template>
  <section class="leave-balance-page">
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
          Leave Balances
        </h1>
      </div>
      <VBtn variant="outlined" prepend-icon="tabler-refresh" @click="refreshAll">
        Refresh
      </VBtn>
    </div>

    <VCard class="table-card">
      <div class="card-header px-6 pt-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h6 font-weight-bold">My Balances</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ balances.length }} leave type{{ balances.length !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>
      <VDivider />

      <VDataTable
        :items="balances"
        class="balance-table"
        hide-default-header
      >
        <template #headers>
          <tr class="table-header-row">
            <th class="text-start pl-6">Type</th>
            <th class="text-start">Balance</th>
            <th class="text-start">Pending</th>
            <th class="text-start">Used</th>
            <th class="text-start">Available</th>
          </tr>
        </template>

        <template #item="{ item }">
          <tr class="table-row">
            <td class="pl-6 py-3">
              <div class="d-flex align-center gap-2">
                <VIcon size="16" color="primary">tabler-calendar-time</VIcon>
                <span class="font-weight-semibold">{{ typeName(item.leaveTypeId) }}</span>
              </div>
            </td>
            <td><span class="mono">{{ item.balance }}</span></td>
            <td><span class="mono">{{ item.pending }}</span></td>
            <td><span class="mono">{{ item.used }}</span></td>
            <td>
              <VChip size="x-small" :color="available(item) > 0 ? 'success' : 'warning'" variant="tonal">
                {{ available(item) }}
              </VChip>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="text-center py-12">
            <VIcon size="48" color="secondary" class="mb-3">tabler-calendar-off</VIcon>
            <p class="text-body-1 text-medium-emphasis">No leave balances found</p>
          </div>
        </template>
      </VDataTable>
    </VCard>
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

.table-row td {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05) !important;
  font-size: 13.5px;
}

.mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
}
</style>
