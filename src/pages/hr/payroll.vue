<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type PayPeriod = {
  id: number
  periodStart?: string
  periodEnd?: string
  status?: string
}

type Payslip = {
  id: number
  userId?: number
  periodStart?: string
  periodEnd?: string
  grossPay?: number
  netPay?: number
  status?: string
}

type HrEmployee = {
  id: number
  fullName: string
}

const userData = useCookie<any>('userData')
const role = computed(() => String(userData.value?.role || '').toLowerCase())
const isSuperuser = computed(() => role.value === 'superuser')
const isHrAdmin = computed(() => ['customer_owner', 'hr_admin'].includes(role.value))

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

const normalizePeriod = (item: any): PayPeriod => ({
  id: Number(item?.id ?? item?.periodId ?? 0),
  periodStart: item?.periodStart ?? item?.period_start ?? '',
  periodEnd: item?.periodEnd ?? item?.period_end ?? '',
  status: item?.status ?? '',
})

const normalizePayslip = (item: any): Payslip => ({
  id: Number(item?.id ?? item?.payslipId ?? 0),
  userId: item?.userId ?? item?.user_id ?? item?.employeeId ?? undefined,
  periodStart: item?.periodStart ?? item?.period_start ?? '',
  periodEnd: item?.periodEnd ?? item?.period_end ?? '',
  grossPay: Number(item?.grossPay ?? item?.gross_pay ?? item?.total ?? 0) || 0,
  netPay: Number(item?.netPay ?? item?.net_pay ?? item?.netTotal ?? 0) || 0,
  status: item?.status ?? '',
})

const periodsData = ref<any>(null)
const payslipsData = ref<any>(null)
const employeesData = ref<any>(null)
let fetchPeriods = async () => {}
let fetchPayslips = async () => {}
let fetchEmployees = async () => {}

if (businessId.value) {
  const payslipsApi = await useApi<any>(createUrl('/hr/payroll/payslips', {
    query: { businessId: computed(() => businessId.value || undefined) },
  }))
  payslipsData.value = payslipsApi.data.value
  fetchPayslips = payslipsApi.execute
  watch(payslipsApi.data, value => { payslipsData.value = value })
}

if ((isHrAdmin.value || isSuperuser.value) && businessId.value) {
  const periodsApi = await useApi<any>(createUrl('/hr/payroll/periods', {
    query: { businessId: computed(() => businessId.value || undefined) },
  }))
  periodsData.value = periodsApi.data.value
  fetchPeriods = periodsApi.execute
  watch(periodsApi.data, value => { periodsData.value = value })

  const employeesApi = await useApi<any>(createUrl('/hr/employees', {
    query: { businessId: computed(() => businessId.value || undefined) },
  }))
  employeesData.value = employeesApi.data.value
  fetchEmployees = employeesApi.execute
  watch(employeesApi.data, value => { employeesData.value = value })
}

const payPeriods = computed(() => {
  const payload = periodsData.value
  const list = payload?.data ?? payload?.items ?? payload?.periods ?? payload?.results ?? []
  return Array.isArray(list) ? list.map(normalizePeriod).filter(item => item.id) : []
})

const payslips = computed(() => {
  const payload = payslipsData.value
  const list = payload?.data ?? payload?.items ?? payload?.payslips ?? payload?.results ?? []
  return Array.isArray(list) ? list.map(normalizePayslip).filter(item => item.id) : []
})

const employees = computed<HrEmployee[]>(() => {
  const payload = employeesData.value
  const list = payload?.data ?? payload?.items ?? payload?.employees ?? payload?.results ?? []
  if (!Array.isArray(list)) return []
  return list
    .map((item: any) => ({
      id: Number(item?.id ?? item?.userId ?? item?.user_id ?? 0),
      fullName: String(item?.fullName ?? item?.name ?? item?.full_name ?? 'Unknown'),
    }))
    .filter(item => item.id)
})

// Payslip filters
const payslipSearch = ref('')
const payslipStatus = ref<string | null>(null)
const payslipPeriod = ref<number | null>(null)

const filteredPayslips = computed(() => {
  const query = payslipSearch.value.trim().toLowerCase()
  const status = String(payslipStatus.value || '').toLowerCase()
  const periodId = payslipPeriod.value

  return payslips.value.filter(p => {
    const employeeName = resolveEmployee(p.userId).toLowerCase()
    const matchQuery = !query || employeeName.includes(query) || String(p.userId ?? '').includes(query)
    const matchStatus = !status || String(p.status || '').toLowerCase() === status
    const matchPeriod = !periodId
      || payPeriods.value.some(period =>
        period.id === periodId
        && period.periodStart === p.periodStart
        && period.periodEnd === p.periodEnd)

    return matchQuery && matchStatus && matchPeriod
  })
})

// Summary stats
const totalNetPay = computed(() =>
  payslips.value.reduce((sum, p) => sum + (p.netPay ?? 0), 0))
const totalGrossPay = computed(() =>
  payslips.value.reduce((sum, p) => sum + (p.grossPay ?? 0), 0))
const openPeriods = computed(() =>
  payPeriods.value.filter(p => (p.status || '').toLowerCase() !== 'closed').length)

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

// Pay period dialog
const isPeriodOpen = ref(false)
const isCreatingPeriod = ref(false)
const periodForm = reactive({ periodStart: '', periodEnd: '' })

const createPeriod = async () => {
  if (!periodForm.periodStart || !periodForm.periodEnd) {
    showSnackbar('Please provide period start and end dates.', 'error')
    return
  }
  try {
    isCreatingPeriod.value = true
    await $api('/hr/payroll/periods', {
      method: 'POST',
      body: {
        businessId: businessId.value || undefined,
        periodStart: periodForm.periodStart,
        periodEnd: periodForm.periodEnd,
      },
    })
    showSnackbar('Pay period created.')
    isPeriodOpen.value = false
    periodForm.periodStart = ''
    periodForm.periodEnd = ''
    fetchPeriods()
  }
  catch {
    showSnackbar('Failed to create pay period.', 'error')
  }
  finally {
    isCreatingPeriod.value = false
  }
}

// Pay settings
const isSavingSettings = ref(false)
const settingForm = reactive({
  userId: null as number | null,
  payType: 'monthly',
  monthlySalary: '',
  hourlyRate: '',
  overtimeRate: '',
})

const savePaySettings = async () => {
  if (!settingForm.userId) {
    showSnackbar('Select an employee.', 'error')
    return
  }
  try {
    isSavingSettings.value = true
    await $api('/hr/payroll/settings', {
      method: 'POST',
      body: {
        businessId: businessId.value || undefined,
        userId: settingForm.userId,
        payType: settingForm.payType,
        monthlySalary: settingForm.monthlySalary ? Number(settingForm.monthlySalary) : null,
        hourlyRate: settingForm.hourlyRate ? Number(settingForm.hourlyRate) : null,
        overtimeRate: settingForm.overtimeRate ? Number(settingForm.overtimeRate) : null,
      },
    })
    showSnackbar('Pay settings saved.')
  }
  catch {
    showSnackbar('Failed to save pay settings.', 'error')
  }
  finally {
    isSavingSettings.value = false
  }
}

// Run payroll
const isRunning = ref(false)
const runPayrollForm = reactive({ payPeriodId: null as number | null })

const runPayroll = async () => {
  if (!runPayrollForm.payPeriodId) {
    showSnackbar('Select a pay period.', 'error')
    return
  }
  try {
    isRunning.value = true
    await $api('/hr/payroll/run', {
      method: 'POST',
      body: {
        businessId: businessId.value || undefined,
        payPeriodId: runPayrollForm.payPeriodId,
      },
    })
    showSnackbar('Payroll run started.')
    fetchPayslips()
  }
  catch {
    showSnackbar('Failed to run payroll.', 'error')
  }
  finally {
    isRunning.value = false
  }
}

// Helpers
const fmt = (d?: string) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}

const fmtCurrency = (v?: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v ?? 0)

const periodStatusColor = (s?: string) => {
  const v = String(s || '').toLowerCase()
  if (v === 'closed')    return 'secondary'
  if (v === 'processed') return 'success'
  if (v === 'open')      return 'warning'
  return 'info'
}

const payslipStatusColor = (s?: string) => {
  const v = String(s || '').toLowerCase()
  if (v === 'paid')    return 'success'
  if (v === 'pending') return 'warning'
  if (v === 'failed')  return 'error'
  return 'secondary'
}

const payslipStatusIcon = (s?: string) => {
  const v = String(s || '').toLowerCase()
  if (v === 'paid')    return 'tabler-circle-check'
  if (v === 'pending') return 'tabler-clock'
  if (v === 'failed')  return 'tabler-circle-x'
  return 'tabler-minus'
}

const getInitials = (name: string) =>
  String(name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

const avatarColors = ['teal', 'primary', 'secondary', 'warning', 'error', 'info', 'success']
const getAvatarColor = (name: string) =>
  avatarColors[String(name || '').charCodeAt(0) % avatarColors.length]

const employeeMap = computed(() =>
  new Map(employees.value.map(e => [e.id, e.fullName])))

const resolveEmployee = (userId?: number) =>
  (userId && employeeMap.value.get(userId)) || `User #${userId ?? '—'}`

const exportPayslipsCsv = () => {
  const rows = filteredPayslips.value.map(p => ({
    Employee: resolveEmployee(p.userId),
    EmployeeId: p.userId ?? '',
    PeriodStart: p.periodStart ?? '',
    PeriodEnd: p.periodEnd ?? '',
    GrossPay: p.grossPay ?? 0,
    NetPay: p.netPay ?? 0,
    Status: p.status ?? '',
  }))

  if (!rows.length) {
    showSnackbar('No payslips to export.', 'warning')
    return
  }

  const headers = Object.keys(rows[0])
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => `"${String((r as any)[h] ?? '').replace(/\"/g, '""')}"`).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `payslips-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
</script>

<template>
  <section class="payroll-page">
    <!-- Error alert -->
    <VAlert
      v-if="!businessId && !isSuperuser"
      type="error"
      variant="tonal"
      border="start"
      class="mb-6"
    >
      Business ID is missing. Please logout and login again.
    </VAlert>

    <!-- ── Page Header ── -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <p class="text-overline text-primary mb-0" style="letter-spacing:0.12em">
          Human Resources
        </p>
        <h1 class="text-h4 font-weight-bold">
          Payroll
        </h1>
      </div>
      <VBtn
        v-if="isHrAdmin || isSuperuser"
        color="primary"
        prepend-icon="tabler-plus"
        @click="isPeriodOpen = true"
      >
        New Pay Period
      </VBtn>
    </div>

    <!-- ── Summary chips ── -->
    <div class="d-flex align-center gap-3 flex-wrap mb-5">
      <div class="summary-chip summary-chip-success">
        <VIcon size="15">tabler-currency-dollar</VIcon>
        <span>Total Net Pay</span>
        <strong>{{ fmtCurrency(totalNetPay) }}</strong>
      </div>
      <div class="summary-chip summary-chip-primary">
        <VIcon size="15">tabler-report-money</VIcon>
        <span>Total Gross</span>
        <strong>{{ fmtCurrency(totalGrossPay) }}</strong>
      </div>
      <div class="summary-chip summary-chip-warning">
        <VIcon size="15">tabler-clock</VIcon>
        <span>Open Periods</span>
        <strong>{{ openPeriods }}</strong>
      </div>
      <div class="summary-chip summary-chip-default ml-auto">
        <VIcon size="15">tabler-file-invoice</VIcon>
        <span>Payslips</span>
        <strong>{{ payslips.length }}</strong>
      </div>
    </div>

    <!-- ── Top section: Pay Periods + Run Payroll ── -->
    <VRow v-if="isHrAdmin || isSuperuser" class="mb-5">
      <!-- Pay Periods table -->
      <VCol cols="12" lg="7">
        <VCard class="table-card h-100">
          <div class="card-header px-6 pt-5 pb-4">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h2 class="text-h6 font-weight-bold">Pay Periods</h2>
                <p class="text-caption text-medium-emphasis mb-0">
                  {{ payPeriods.length }} period{{ payPeriods.length !== 1 ? 's' : '' }}
                </p>
              </div>
            </div>
          </div>
          <VDivider />
          <VDataTable
            :items="payPeriods"
            class="period-table"
            hide-default-header
          >
            <template #headers>
              <tr class="table-header-row">
                <th class="text-start pl-6">Period Start</th>
                <th class="text-start">Period End</th>
                <th class="text-start">Status</th>
              </tr>
            </template>
            <template #item="{ item }">
              <tr class="table-row">
                <td class="pl-6 py-3">
                  <span class="date-badge">{{ fmt(item.periodStart) }}</span>
                </td>
                <td>
                  <span class="date-badge">{{ fmt(item.periodEnd) }}</span>
                </td>
                <td>
                  <VChip
                    v-if="item.status"
                    size="small"
                    variant="tonal"
                    class="text-capitalize"
                    :color="periodStatusColor(item.status)"
                  >
                    {{ item.status }}
                  </VChip>
                  <span v-else class="text-medium-emphasis">—</span>
                </td>
              </tr>
            </template>
            <template #no-data>
              <div class="text-center py-10">
                <VIcon size="40" color="secondary" class="mb-2">tabler-calendar-off</VIcon>
                <p class="text-body-2 text-medium-emphasis">No pay periods yet</p>
              </div>
            </template>
          </VDataTable>
        </VCard>
      </VCol>

      <!-- Right column: Run Payroll + Pay Settings -->
      <VCol cols="12" lg="5">
        <VRow class="h-100">
          <!-- Run Payroll card -->
          <VCol cols="12">
            <VCard class="action-card run-payroll-card">
              <VCardText class="pa-6">
                <div class="d-flex align-center gap-3 mb-5">
                  <div class="action-icon-wrap action-icon-primary">
                    <VIcon size="22" color="primary">tabler-player-play</VIcon>
                  </div>
                  <div>
                    <h2 class="text-h6 font-weight-bold mb-0">Run Payroll</h2>
                    <p class="text-caption text-medium-emphasis mb-0">
                      Process payroll for a selected period.
                    </p>
                  </div>
                </div>
                <AppSelect
                  v-model="runPayrollForm.payPeriodId"
                  label="Select Pay Period"
                  prepend-inner-icon="tabler-calendar"
                  :items="payPeriods.map(p => ({
                    title: `${fmt(p.periodStart)} → ${fmt(p.periodEnd)}`,
                    value: p.id,
                  }))"
                  item-title="title"
                  item-value="value"
                  class="mb-4"
                />
                <VBtn
                  color="primary"
                  block
                  size="large"
                  :loading="isRunning"
                  prepend-icon="tabler-player-play"
                  @click="runPayroll"
                >
                  Run Payroll
                </VBtn>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>
    </VRow>

    <!-- ── Employee Pay Settings ── -->
    <VCard v-if="isHrAdmin || isSuperuser" class="settings-card mb-5">
      <div class="card-header px-6 pt-5 pb-4">
        <div class="d-flex align-center gap-3">
          <div class="action-icon-wrap action-icon-secondary">
            <VIcon size="20" color="secondary">tabler-settings</VIcon>
          </div>
          <div>
            <h2 class="text-h6 font-weight-bold mb-0">Employee Pay Settings</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              Configure salary or hourly rates per employee.
            </p>
          </div>
        </div>
      </div>
      <VDivider />
      <VCardText class="pa-6">
        <VRow>
          <VCol cols="12" md="4">
            <AppSelect
              v-model="settingForm.userId"
              label="Employee"
              prepend-inner-icon="tabler-user"
              :items="employees.map(e => ({ title: e.fullName, value: e.id }))"
              item-title="title"
              item-value="value"
            />
          </VCol>
          <VCol cols="12" md="4">
            <AppSelect
              v-model="settingForm.payType"
              label="Pay Type"
              prepend-inner-icon="tabler-tag"
              :items="[
                { title: 'Monthly Salary', value: 'monthly' },
                { title: 'Hourly Rate', value: 'hourly' },
              ]"
              item-title="title"
              item-value="value"
            />
          </VCol>
          <VCol cols="12" md="4">
            <AppTextField
              v-model="settingForm.monthlySalary"
              label="Monthly Salary"
              type="number"
              prepend-inner-icon="tabler-currency-dollar"
              :disabled="settingForm.payType !== 'monthly'"
            />
          </VCol>
          <VCol cols="12" md="4">
            <AppTextField
              v-model="settingForm.hourlyRate"
              label="Hourly Rate"
              type="number"
              prepend-inner-icon="tabler-clock-dollar"
              :disabled="settingForm.payType !== 'hourly'"
            />
          </VCol>
          <VCol cols="12" md="4">
            <AppTextField
              v-model="settingForm.overtimeRate"
              label="Overtime Rate"
              type="number"
              prepend-inner-icon="tabler-clock-exclamation"
            />
          </VCol>
          <VCol cols="12" md="4" class="d-flex align-end">
            <VBtn
              color="primary"
              block
              :loading="isSavingSettings"
              prepend-icon="tabler-check"
              @click="savePaySettings"
            >
              Save Settings
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- ── Payslips ── -->
    <VCard class="table-card">
      <div class="card-header px-6 pt-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h6 font-weight-bold">Payslips</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ filteredPayslips.length }} payslip{{ filteredPayslips.length !== 1 ? 's' : '' }} shown
            </p>
          </div>
          <div class="d-flex align-center gap-2">
            <VBtn
              variant="tonal"
              color="secondary"
              size="small"
              prepend-icon="tabler-download"
              @click="exportPayslipsCsv"
            >
              Export CSV
            </VBtn>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-3 mt-4">
          <AppTextField
            v-model="payslipSearch"
            label="Search employee or ID"
            prepend-inner-icon="tabler-search"
            style="min-width: 220px"
          />
          <AppSelect
            v-model="payslipStatus"
            label="Status"
            clearable
            :items="[
              { title: 'Paid', value: 'paid' },
              { title: 'Pending', value: 'pending' },
              { title: 'Failed', value: 'failed' },
            ]"
            item-title="title"
            item-value="value"
            style="min-width: 160px"
          />
          <AppSelect
            v-model="payslipPeriod"
            label="Pay Period"
            clearable
            :items="payPeriods.map(p => ({
              title: `${fmt(p.periodStart)} → ${fmt(p.periodEnd)}`,
              value: p.id,
            }))"
            item-title="title"
            item-value="value"
            style="min-width: 220px"
          />
        </div>
      </div>
      <VDivider />
      <VDataTable
        :items="filteredPayslips"
        class="payslip-table"
        hide-default-header
      >
        <template #headers>
          <tr class="table-header-row">
            <th class="text-start pl-6">Employee</th>
            <th class="text-start">Period</th>
            <th class="text-start">Gross Pay</th>
            <th class="text-start">Net Pay</th>
            <th class="text-start">Status</th>
          </tr>
        </template>
        <template #item="{ item }">
          <tr class="table-row">
            <!-- Employee -->
            <td class="pl-6 py-3">
              <div class="d-flex align-center gap-3">
                <VAvatar size="36" :color="getAvatarColor(resolveEmployee(item.userId))" class="avatar-sm">
                  <span class="text-caption font-weight-bold">
                    {{ getInitials(resolveEmployee(item.userId)) }}
                  </span>
                </VAvatar>
                <div>
                  <p class="font-weight-semibold mb-0" style="line-height:1.3; font-size:13.5px">
                    {{ resolveEmployee(item.userId) }}
                  </p>
                  <p class="text-caption text-medium-emphasis mb-0">ID {{ item.userId || '—' }}</p>
                </div>
              </div>
            </td>

            <!-- Period -->
            <td>
              <div class="d-flex align-center gap-1">
                <span class="date-badge">{{ fmt(item.periodStart) }}</span>
                <VIcon size="12" color="secondary">tabler-arrow-right</VIcon>
                <span class="date-badge">{{ fmt(item.periodEnd) }}</span>
              </div>
            </td>

            <!-- Gross -->
            <td>
              <span class="pay-amount pay-gross">{{ fmtCurrency(item.grossPay) }}</span>
            </td>

            <!-- Net -->
            <td>
              <span class="pay-amount pay-net">{{ fmtCurrency(item.netPay) }}</span>
            </td>

            <!-- Status -->
            <td>
              <VChip
                v-if="item.status"
                size="small"
                variant="tonal"
                class="text-capitalize"
                :color="payslipStatusColor(item.status)"
              >
                <template #prepend>
                  <VIcon size="12" class="mr-1">{{ payslipStatusIcon(item.status) }}</VIcon>
                </template>
                {{ item.status }}
              </VChip>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
          </tr>
        </template>
        <template #no-data>
          <div class="text-center py-14">
            <VIcon size="52" color="secondary" class="mb-3">tabler-file-invoice-off</VIcon>
            <p class="text-body-1 text-medium-emphasis">No payslips to show</p>
            <p class="text-caption text-disabled">Adjust filters or run payroll to generate payslips.</p>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- ── Create Pay Period Dialog ── -->
    <VDialog v-model="isPeriodOpen" max-width="480">
      <VCard class="dialog-card">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div class="d-flex align-center gap-3">
            <div class="dialog-icon-wrap">
              <VIcon size="20" color="primary">tabler-calendar-plus</VIcon>
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold">Create Pay Period</h3>
              <p class="text-caption text-medium-emphasis mb-0">
                Define a new payroll period date range.
              </p>
            </div>
            <VSpacer />
            <VBtn icon size="small" variant="text" @click="isPeriodOpen = false">
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </div>
        <VDivider />
        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="periodForm.periodStart"
                type="date"
                label="Period Start"
                prepend-inner-icon="tabler-calendar"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="periodForm.periodEnd"
                type="date"
                label="Period End"
                prepend-inner-icon="tabler-calendar"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VDivider />
        <VCardText class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="tonal" color="secondary" @click="isPeriodOpen = false">Cancel</VBtn>
          <VBtn color="primary" :loading="isCreatingPeriod" prepend-icon="tabler-check" @click="createPeriod">
            Create Period
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
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
/* ── Summary chips ── */
.summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid transparent;
}
.summary-chip strong { font-weight: 700; font-size: 13px; }
.summary-chip-success {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
  border-color: rgba(var(--v-theme-success), 0.2);
}
.summary-chip-primary {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  border-color: rgba(var(--v-theme-primary), 0.2);
}
.summary-chip-warning {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
  border-color: rgba(var(--v-theme-warning), 0.2);
}
.summary-chip-default {
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-color: rgba(var(--v-border-color), 0.1);
}

/* ── Cards ── */
.table-card,
.settings-card,
.action-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
}

/* ── Run Payroll card ── */
.run-payroll-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.04) 0%, transparent 60%) !important;
}

/* ── Action icon wraps ── */
.action-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.action-icon-primary  { background: rgba(var(--v-theme-primary), 0.1); }
.action-icon-secondary { background: rgba(var(--v-theme-secondary), 0.1); }

/* ── Table ── */
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

.table-row { transition: background 0.15s; }
.table-row:hover { background: rgba(var(--v-theme-primary), 0.04) !important; }
.table-row td {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05) !important;
  font-size: 13.5px;
}

/* ── Avatar ── */
.avatar-sm { flex-shrink: 0; }

/* ── Date badge ── */
.date-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), 0.08);
  white-space: nowrap;
}

/* ── Pay amounts ── */
.pay-amount {
  font-weight: 600;
  font-size: 13.5px;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.pay-gross { color: rgba(var(--v-theme-on-surface), 0.7); }
.pay-net   { color: rgb(var(--v-theme-success)); }

/* ── Dialog ── */
.dialog-card { border-radius: 16px !important; }

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
