<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

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

const analyticsData = ref<any>(null)
const isFetchingAnalytics = ref(false)
let fetchAnalytics = async () => {}

if (businessId.value) {
  const analyticsApi = await useApi<any>(createUrl('/hr/analytics', {
    query: {
      businessId: computed(() => businessId.value || undefined),
    },
  }))
  analyticsData.value = analyticsApi.data.value
  fetchAnalytics = analyticsApi.execute
  isFetchingAnalytics.value = analyticsApi.isFetching.value
  watch(analyticsApi.data, value => {
    analyticsData.value = value
  })
  watch(analyticsApi.isFetching, value => {
    isFetchingAnalytics.value = value
  })
}

const analytics = computed<any>(() => {
  const payload = analyticsData.value
  return payload?.data ?? payload ?? {}
})

const isLoading = computed(() => isFetchingAnalytics.value)

const refresh = async () => {
  await fetchAnalytics()
}

const formatNumber = (value?: number) => new Intl.NumberFormat('en-US').format(Number(value ?? 0))
const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value ?? 0))

const deptColors = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#fb7185', '#94a3b8']

const payrollKpis = computed(() => ([
  { label: 'Net Pay', value: analytics.value?.payroll?.kpis?.netPay ?? 0, icon: 'tabler-cash', color: 'success' },
  { label: 'Gross Pay', value: analytics.value?.payroll?.kpis?.grossPay ?? 0, icon: 'tabler-coin', color: 'primary' },
  { label: 'Deductions', value: analytics.value?.payroll?.kpis?.deductions ?? 0, icon: 'tabler-receipt-tax', color: 'warning' },
  { label: 'Employees Paid', value: analytics.value?.payroll?.kpis?.employeesPaid ?? 0, icon: 'tabler-users', color: 'secondary' },
]))

const payrollTrendCategories = computed(() => analytics.value?.payroll?.trend?.labels ?? [])
const payrollTrendSeries = computed(() => analytics.value?.payroll?.trend?.series ?? [])
const payrollTrendOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#38bdf8', '#22c55e'],
  plotOptions: { bar: { columnWidth: '48%', borderRadius: 6 } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: payrollTrendCategories.value,
    labels: { style: { colors: '#9ca3af', fontSize: '12px', fontFamily: 'inherit' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' } } },
  grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
  tooltip: { theme: 'dark' },
  legend: { position: 'top', fontSize: '12px', labels: { colors: '#9ca3af' } },
}))

const payrollSplitSeries = computed(() => analytics.value?.payroll?.split?.series ?? [])
const payrollSplitOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: analytics.value?.payroll?.split?.labels ?? [],
  colors: deptColors,
  legend: {
    position: 'bottom',
    fontSize: '12px',
    labels: { colors: '#9ca3af' },
    markers: { width: 8, height: 8, radius: 50 },
  },
  dataLabels: { enabled: false },
  stroke: { width: 2, colors: ['transparent'] },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          total: { show: true, label: 'Payroll', color: '#9ca3af', fontSize: '12px' },
          value: { color: '#e6edf3', fontSize: '22px', fontWeight: 700, fontFamily: 'inherit' },
        },
      },
    },
  },
  tooltip: { theme: 'dark' },
}))

const payrollBreakdown = computed(() => (analytics.value?.payroll?.breakdown ?? []).map((row: any) => ({
  name: row.name,
  dept: row.department,
  gross: row.grossPay,
  deductions: row.deductions,
  net: row.netPay,
  status: row.status,
})))
</script>

<template>
  <section class="payroll-analytics">
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
        <p class="text-overline text-success mb-0" style="letter-spacing:0.12em">
          Payroll
        </p>
        <h1 class="text-h4 font-weight-bold">
          Payroll Analytics
        </h1>
        <p class="text-medium-emphasis mb-0">
          Monthly payout trends, department split, and employee breakdown.
        </p>
      </div>
      <VBtn
        color="primary"
        variant="outlined"
        size="small"
        :loading="isLoading"
        prepend-icon="tabler-refresh"
        @click="refresh"
      >
        Refresh
      </VBtn>
    </div>

    <VCard v-if="!isHrAdmin" class="mb-6">
      <VCardText class="text-center py-10">
        <VIcon size="48" color="warning" class="mb-3">
          tabler-lock
        </VIcon>
        <p class="text-h6">
          Access Restricted
        </p>
        <p class="text-medium-emphasis">
          You do not have permission to view this analytics page.
        </p>
      </VCardText>
    </VCard>

    <template v-else>
      <VProgressLinear v-if="isLoading" indeterminate color="primary" height="2" class="mb-4 rounded" />

      <VRow class="mb-4">
        <VCol v-for="item in payrollKpis" :key="item.label" cols="12" sm="6" lg="3">
          <VCard class="mini-kpi h-100">
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="kpi-label">{{ item.label }}</span>
                <div class="kpi-icon-wrap" :class="`kpi-icon-${item.color}`">
                  <VIcon size="18" :color="item.color">{{ item.icon }}</VIcon>
                </div>
              </div>
              <div class="kpi-value text-high-emphasis">
                {{ item.label === 'Employees Paid' ? formatNumber(item.value) : formatCurrency(item.value) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" md="8">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Monthly Gross vs Net</VCardTitle>
              <VCardSubtitle>Last 6 months</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="bar" height="260" :options="payrollTrendOptions" :series="payrollTrendSeries" />
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="4">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Payroll by Department</VCardTitle>
              <VCardSubtitle>This month</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="donut" height="240" :options="payrollSplitOptions" :series="payrollSplitSeries" />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow class="mt-4">
        <VCol cols="12">
          <VCard class="table-card">
            <VCardItem>
              <VCardTitle class="chart-title">Employee Payroll Breakdown</VCardTitle>
              <VCardSubtitle>Gross, deductions, and net pay</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th class="text-left">Employee</th>
                    <th class="text-left">Department</th>
                    <th class="text-right">Gross</th>
                    <th class="text-right">Deductions</th>
                    <th class="text-right">Net</th>
                    <th class="text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in payrollBreakdown" :key="row.name">
                    <td>{{ row.name }}</td>
                    <td>{{ row.dept }}</td>
                    <td class="text-right">{{ formatCurrency(row.gross) }}</td>
                    <td class="text-right">{{ formatCurrency(row.deductions) }}</td>
                    <td class="text-right">{{ formatCurrency(row.net) }}</td>
                    <td>
                      <VChip
                        size="x-small"
                        :color="row.status === 'Paid' ? 'success' : row.status === 'Pending' ? 'warning' : 'secondary'"
                        variant="tonal"
                      >
                        {{ row.status }}
                      </VChip>
                    </td>
                  </tr>
                  <tr v-if="!payrollBreakdown.length">
                    <td colspan="6" class="text-center text-medium-emphasis py-6">
                      No payroll data available.
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </section>
</template>

<style scoped>
.mini-kpi,
.chart-card,
.table-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
}

.kpi-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.kpi-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-icon-success { background: rgba(34, 197, 94, 0.12); }
.kpi-icon-primary { background: rgba(56, 189, 248, 0.12); }
.kpi-icon-warning { background: rgba(245, 158, 11, 0.12); }
.kpi-icon-secondary { background: rgba(167, 139, 250, 0.12); }

.chart-title {
  font-size: 14px !important;
  font-weight: 600 !important;
}
</style>
