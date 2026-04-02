<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type HrDashboard = {
  employees?: { total?: number; active?: number; pending?: number; inactive?: number }
  attendance?: { todayCheckedIn?: number; todayCheckedOut?: number; missingCheckout?: number }
  leave?: { pending?: number; approvedThisMonth?: number; rejectedThisMonth?: number }
  payroll?: { lastPeriodNetPay?: number; payslipsGenerated?: number; openPeriods?: number }
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

const dashboardData = ref<any>(null)
const isFetching = ref(false)
let fetchDashboard = async () => {}
const analyticsData = ref<any>(null)
const isFetchingAnalytics = ref(false)
let fetchAnalytics = async () => {}

if (businessId.value) {
  const dashboardApi = await useApi<any>(createUrl('/hr/dashboard', {
    query: {
      businessId: computed(() => businessId.value || undefined),
    },
  }))
  dashboardData.value = dashboardApi.data.value
  fetchDashboard = dashboardApi.execute
  isFetching.value = dashboardApi.isFetching.value
  watch(dashboardApi.data, value => {
    dashboardData.value = value
  })
  watch(dashboardApi.isFetching, value => {
    isFetching.value = value
  })

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

const summary = computed<HrDashboard>(() => {
  const payload = dashboardData.value
  return payload?.data ?? payload ?? {}
})

const analytics = computed<any>(() => {
  const payload = analyticsData.value
  return payload?.data ?? payload ?? {}
})

const isLoading = computed(() => isFetching.value || isFetchingAnalytics.value)

const refreshAll = async () => {
  await Promise.all([fetchDashboard(), fetchAnalytics()])
}

const formatNumber = (value?: number) => new Intl.NumberFormat('en-US').format(Number(value ?? 0))
const apiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

const snackbar = ref({ show: false, text: '', color: 'success' })
const showSnackbar = (text: string, color = 'success') => {
  snackbar.value = { show: true, text, color }
}

const drilldownOpen = ref(false)
const drilldownMetric = ref<'net_pay' | 'gross_pay' | 'headcount' | 'budget_spent' | ''>('')
const drilldownData = ref<any>(null)
const isDrilldownLoading = ref(false)

const drilldownTitles: Record<string, string> = {
  net_pay: 'Net Pay',
  gross_pay: 'Gross Pay',
  headcount: 'Headcount',
  budget_spent: 'Budget Spent',
}

const openDrilldown = async (metric: 'net_pay' | 'gross_pay' | 'headcount' | 'budget_spent') => {
  if (!businessId.value) {
    showSnackbar('Business ID is missing. Please logout and login again.', 'error')
    return
  }
  drilldownMetric.value = metric
  drilldownOpen.value = true
  isDrilldownLoading.value = true
  try {
    const accessToken = useCookie('accessToken').value
    const url = `${apiBase}/hr/analytics/drilldown?businessId=${businessId.value}&metric=${metric}`
    const res = await fetch(url, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    if (!res.ok) {
      showSnackbar('Failed to load drilldown.', 'error')
      isDrilldownLoading.value = false
      return
    }
    drilldownData.value = await res.json()
  } catch (err) {
    showSnackbar('Failed to load drilldown.', 'error')
  } finally {
    isDrilldownLoading.value = false
  }
}

const drilldown = computed(() => drilldownData.value?.data ?? {})

const exportReports = [
  { label: 'Payroll Breakdown', value: 'payroll_breakdown' },
  { label: 'Payroll Trend', value: 'payroll_trend' },
  { label: 'Performance Individuals', value: 'performance_individuals' },
  { label: 'Budget Categories', value: 'budget_categories' },
  { label: 'Budget Line', value: 'budget_line' },
  { label: 'Headcount Growth', value: 'headcount_growth' },
  { label: 'Hiring Pipeline', value: 'hiring_pipeline' },
]

const downloadCsv = async (report: string) => {
  if (!businessId.value) {
    showSnackbar('Business ID is missing. Please logout and login again.', 'error')
    return
  }
  try {
    const accessToken = useCookie('accessToken').value
    const url = `${apiBase}/hr/analytics/export?businessId=${businessId.value}&report=${report}`
    const res = await fetch(url, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    })
    if (!res.ok) {
      showSnackbar('Failed to export report.', 'error')
      return
    }
    const blob = await res.blob()
    const filename = res.headers.get('content-disposition')?.split('filename=')[1]?.replace(/\"/g, '') || `hr-${report}.csv`
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    showSnackbar('Report downloaded.')
  } catch (err) {
    showSnackbar('Failed to export report.', 'error')
  }
}

// ── Chart data derived from summary ──

const employeeChartOptions = computed(() => ({
  chart: { type: 'donut', sparkline: { enabled: false }, fontFamily: 'inherit' },
  labels: ['Active', 'Pending', 'Inactive'],
  colors: ['#2dd4bf', '#fbbf24', '#fb7185'],
  dataLabels: { enabled: false },
  legend: {
    position: 'bottom',
    fontFamily: 'inherit',
    fontSize: '12px',
    labels: { colors: '#9ca3af' },
    markers: { width: 8, height: 8, radius: 50 },
    itemMargin: { horizontal: 10 },
  },
  stroke: { width: 3, colors: ['transparent'] },
  plotOptions: {
    pie: {
      donut: {
        size: '72%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total',
            color: '#9ca3af',
            fontSize: '12px',
            fontFamily: 'inherit',
            formatter: () => String(summary.value.employees?.total ?? 0),
          },
          value: { color: '#e6edf3', fontSize: '22px', fontWeight: 700, fontFamily: 'inherit' },
        },
      },
    },
  },
  tooltip: { theme: 'dark' },
}))

const employeeChartSeries = computed(() => [
  summary.value.employees?.active ?? 0,
  summary.value.employees?.pending ?? 0,
  summary.value.employees?.inactive ?? 0,
  
])

const attendanceChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#2dd4bf', '#a78bfa', '#fb7185'],
  plotOptions: {
    bar: { columnWidth: '55%', borderRadius: 6, distributed: false },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: ['Checked In', 'Checked Out', 'Missing'],
    labels: { style: { colors: '#9ca3af', fontSize: '12px', fontFamily: 'inherit' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' } },
  },
  grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
  tooltip: { theme: 'dark' },
  legend: { show: false },
}))

const attendanceChartSeries = computed(() => [{
  name: 'Attendance',
  data: [
    { x: 'Checked In',  y: summary.value.attendance?.todayCheckedIn  ?? 0, fillColor: '#2dd4bf' },
    { x: 'Checked Out', y: summary.value.attendance?.todayCheckedOut ?? 0, fillColor: '#a78bfa' },
    { x: 'Missing',     y: summary.value.attendance?.missingCheckout ?? 0, fillColor: '#fb7185' },
  ],
}])

const leaveChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#fbbf24', '#2dd4bf', '#fb7185'],
  plotOptions: {
    bar: { horizontal: true, barHeight: '55%', borderRadius: 5, distributed: true },
  },
  dataLabels: { enabled: false },
  xaxis: {
    labels: { style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: { style: { colors: '#9ca3af', fontSize: '12px', fontFamily: 'inherit' } },
  },
  grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
  tooltip: { theme: 'dark' },
  legend: { show: false },
}))

const leaveChartSeries = computed(() => [{
  name: 'Leaves',
  data: [
    { x: 'Pending',  y: summary.value.leave?.pending          ?? 0 },
    { x: 'Approved', y: summary.value.leave?.approvedThisMonth ?? 0 },
    { x: 'Rejected', y: summary.value.leave?.rejectedThisMonth ?? 0 },
  ],
}])

// Attendance progress percents
const totalStaff = computed(() => summary.value.employees?.active ?? 1)
const checkedInPct = computed(() => Math.round(((summary.value.attendance?.todayCheckedIn ?? 0) / totalStaff.value) * 100))
const checkedOutPct = computed(() => Math.round(((summary.value.attendance?.todayCheckedOut ?? 0) / totalStaff.value) * 100))
const missingPct = computed(() => Math.round(((summary.value.attendance?.missingCheckout ?? 0) / totalStaff.value) * 100))

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value ?? 0))

const deptColors = ['#22c55e', '#38bdf8', '#f59e0b', '#a78bfa', '#fb7185', '#94a3b8']

// --- Payroll Analytics ---
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

// --- Employee Performance ---
const performanceKpis = computed(() => ([
  { label: 'Avg Score', value: analytics.value?.performance?.kpis?.avgScore ?? 0, icon: 'tabler-star', color: 'warning' },
  { label: 'Goals Achieved', value: analytics.value?.performance?.kpis?.goalsAchieved ?? 0, icon: 'tabler-target', color: 'success' },
  { label: 'Reviews Completed', value: analytics.value?.performance?.kpis?.reviewsCompleted ?? 0, icon: 'tabler-clipboard-check', color: 'primary' },
  { label: 'Under Performers', value: analytics.value?.performance?.kpis?.underPerformers ?? 0, icon: 'tabler-alert-triangle', color: 'error' },
]))

const scoreBandsOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#fb7185'],
  plotOptions: { bar: { columnWidth: '55%', borderRadius: 6 } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: analytics.value?.performance?.scoreBands?.labels ?? [],
    labels: { style: { colors: '#9ca3af', fontSize: '12px', fontFamily: 'inherit' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: { labels: { style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' } } },
  grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
  tooltip: { theme: 'dark' },
}))
const scoreBandsSeries = computed(() => ([
  { name: 'Employees', data: analytics.value?.performance?.scoreBands?.series ?? [] },
]))

const radarOptions = computed(() => ({
  chart: { type: 'radar', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#22c55e', '#38bdf8'],
  xaxis: { categories: analytics.value?.performance?.radar?.labels ?? [] },
  yaxis: { show: false },
  stroke: { width: 2 },
  fill: { opacity: 0.15 },
  markers: { size: 3 },
  legend: { position: 'top', fontSize: '12px', labels: { colors: '#9ca3af' } },
}))
const radarSeries = computed(() => analytics.value?.performance?.radar?.series ?? [])

const performanceTable = computed(() => (analytics.value?.performance?.individuals ?? []).map((row: any) => ({
  name: row.name,
  dept: row.department,
  score: row.score,
  goals: row.goalsAchieved,
  rating: row.rating,
  trend: row.trend,
})))

// --- Budget & Cost Forecasting ---
const budgetKpis = computed(() => ([
  { label: 'Annual Budget', value: analytics.value?.budget?.kpis?.annualBudget ?? 0, icon: 'tabler-wallet', color: 'primary' },
  { label: 'Spent YTD', value: analytics.value?.budget?.kpis?.spentYtd ?? 0, icon: 'tabler-coin', color: 'warning' },
  { label: 'Forecasted Spend', value: analytics.value?.budget?.kpis?.forecastedSpend ?? 0, icon: 'tabler-trending-up', color: 'success' },
  { label: 'Remaining', value: analytics.value?.budget?.kpis?.remaining ?? 0, icon: 'tabler-pig-money', color: 'secondary' },
]))

const budgetLineOptions = computed(() => ({
  chart: { type: 'line', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#38bdf8', '#f59e0b', '#22c55e'],
  stroke: { curve: 'smooth', width: 3 },
  dataLabels: { enabled: false },
  xaxis: {
    categories: analytics.value?.budget?.line?.labels ?? [],
    labels: { style: { colors: '#9ca3af', fontSize: '12px', fontFamily: 'inherit' } },
  },
  yaxis: { labels: { style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' } } },
  grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
  tooltip: { theme: 'dark' },
  legend: { position: 'top', fontSize: '12px', labels: { colors: '#9ca3af' } },
}))
const budgetLineSeries = computed(() => analytics.value?.budget?.line?.series ?? [])

const budgetCategories = computed(() => (analytics.value?.budget?.categories ?? []).map((row: any, idx: number) => ({
  name: row.name,
  used: row.usedPct ?? 0,
  amount: row.allocated ?? 0,
  color: ['success', 'primary', 'warning', 'secondary', 'error'][idx % 5],
})))

const quarterlyForecast = computed(() => analytics.value?.budget?.quarterlyForecast ?? [])

// --- Headcount & Hiring ---
const headcountKpis = computed(() => ([
  { label: 'Total Headcount', value: analytics.value?.headcount?.kpis?.totalHeadcount ?? 0, icon: 'tabler-users', color: 'primary' },
  { label: 'New Hires', value: analytics.value?.headcount?.kpis?.newHires ?? 0, icon: 'tabler-user-plus', color: 'success' },
  { label: 'Attrition', value: analytics.value?.headcount?.kpis?.attrition ?? 0, icon: 'tabler-user-minus', color: 'error' },
  { label: 'Open Positions', value: analytics.value?.headcount?.kpis?.openPositions ?? 0, icon: 'tabler-briefcase', color: 'warning' },
]))

const headcountLineOptions = computed(() => ({
  chart: { type: 'line', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#22c55e'],
  stroke: { curve: 'smooth', width: 3 },
  dataLabels: { enabled: false },
  xaxis: {
    categories: analytics.value?.headcount?.growth?.labels ?? [],
    labels: { style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' } },
  },
  yaxis: { labels: { style: { colors: '#9ca3af', fontSize: '11px', fontFamily: 'inherit' } } },
  grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
  tooltip: { theme: 'dark' },
}))
const headcountLineSeries = computed(() => analytics.value?.headcount?.growth?.series ?? [])

const headcountDonutOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: analytics.value?.headcount?.departmentSplit?.labels ?? [],
  colors: deptColors,
  dataLabels: { enabled: false },
  legend: { show: false },
  stroke: { width: 2, colors: ['transparent'] },
  plotOptions: { pie: { donut: { size: '70%' } } },
  tooltip: { theme: 'dark' },
}))
const headcountDonutSeries = computed(() => analytics.value?.headcount?.departmentSplit?.series ?? [])
const headcountLegend = computed(() => {
  const labels = analytics.value?.headcount?.departmentSplit?.labels ?? []
  const series = analytics.value?.headcount?.departmentSplit?.series ?? []
  return labels.map((label: string, idx: number) => ({
    label,
    value: series[idx] ?? 0,
    color: deptColors[idx % deptColors.length],
  }))
})

const hiringPipeline = computed(() => analytics.value?.headcount?.pipeline ?? [])
</script>

<template>
  <section class="hr-dashboard">
    <!-- Access error -->
    <VAlert
      v-if="!businessId && !isSuperuser"
      type="error"
      variant="tonal"
      border="start"
      class="mb-6"
    >
      Business ID is missing. Please logout and login again.
    </VAlert>

    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <p class="text-overline text-teal mb-0" style="letter-spacing:0.12em">
          Human Resources
        </p>
        <h1 class="text-h4 font-weight-bold">
          HR Dashboard
        </h1>
      </div>
      <div class="d-flex align-center gap-3">
        <VChip size="small" color="success" variant="tonal">
          <template #prepend>
            <span class="live-dot mr-1" />
          </template>
          Live
        </VChip>
        <VMenu>
          <template #activator="{ props }">
            <VBtn
              v-bind="props"
              color="secondary"
              variant="tonal"
              size="small"
              prepend-icon="tabler-download"
            >
              Export CSV
            </VBtn>
          </template>
          <VList density="compact">
            <VListItem
              v-for="item in exportReports"
              :key="item.value"
              @click="downloadCsv(item.value)"
            >
              <VListItemTitle>{{ item.label }}</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
        <VBtn
          color="primary"
          variant="outlined"
          size="small"
          :loading="isLoading"
          prepend-icon="tabler-refresh"
          @click="refreshAll"
        >
          Refresh
        </VBtn>
      </div>
    </div>

    <!-- Access denied -->
    <VCard v-if="!isHrAdmin" class="mb-6">
      <VCardText class="text-center py-10">
        <VIcon size="48" color="warning" class="mb-3">
          tabler-lock
        </VIcon>
        <p class="text-h6">
          Access Restricted
        </p>
        <p class="text-medium-emphasis">
          You do not have permission to view this dashboard.
        </p>
      </VCardText>
    </VCard>

    <template v-else>
      <!-- Loading bar -->
      <VProgressLinear v-if="isLoading" indeterminate color="primary" height="2" class="mb-4 rounded" />

      <!-- ── KPI Cards ── -->
      <VRow class="mb-4">
        <!-- Employees -->
        <VCol cols="12" sm="6" lg="3">
          <VCard class="kpi-card kpi-teal h-100">
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="kpi-label">Employees</span>
                <div class="kpi-icon-wrap kpi-icon-teal">
                  <VIcon size="18" color="teal">tabler-users</VIcon>
                </div>
              </div>
              <div class="kpi-value text-teal">
                {{ formatNumber(summary.employees?.total) }}
              </div>
              <div class="d-flex gap-2 flex-wrap mt-2">
                <VChip size="x-small" color="teal" variant="tonal">
                  Active {{ formatNumber(summary.employees?.active) }}
                </VChip>
                <VChip size="x-small" color="warning" variant="tonal">
                  Pending {{ formatNumber(summary.employees?.pending) }}
                </VChip>
                <VChip size="x-small" color="error" variant="tonal">
                  Inactive {{ formatNumber(summary.employees?.inactive) }}
                </VChip>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Attendance -->
        <VCol cols="12" sm="6" lg="3">
          <VCard class="kpi-card kpi-amber h-100">
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="kpi-label">Attendance Today</span>
                <div class="kpi-icon-wrap kpi-icon-amber">
                  <VIcon size="18" color="warning">tabler-clock</VIcon>
                </div>
              </div>
              <div class="kpi-value text-warning">
                {{ formatNumber(summary.attendance?.todayCheckedIn) }}
              </div>
              <div class="d-flex gap-2 flex-wrap mt-2">
                <VChip size="x-small" color="secondary" variant="tonal">
                  Out {{ formatNumber(summary.attendance?.todayCheckedOut) }}
                </VChip>
                <VChip size="x-small" color="error" variant="tonal">
                  Missing {{ formatNumber(summary.attendance?.missingCheckout) }}
                </VChip>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Leave -->
        <VCol cols="12" sm="6" lg="3">
          <VCard class="kpi-card kpi-rose h-100">
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="kpi-label">Leave Pending</span>
                <div class="kpi-icon-wrap kpi-icon-rose">
                  <VIcon size="18" color="error">tabler-calendar-off</VIcon>
                </div>
              </div>
              <div class="kpi-value text-error">
                {{ formatNumber(summary.leave?.pending) }}
              </div>
              <div class="d-flex gap-2 flex-wrap mt-2">
                <VChip size="x-small" color="success" variant="tonal">
                  Approved {{ formatNumber(summary.leave?.approvedThisMonth) }}
                </VChip>
                <VChip size="x-small" color="error" variant="tonal">
                  Rejected {{ formatNumber(summary.leave?.rejectedThisMonth) }}
                </VChip>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Payroll -->
        <VCol cols="12" sm="6" lg="3">
          <VCard class="kpi-card kpi-violet h-100">
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="kpi-label">Net Pay (Last Period)</span>
                <div class="kpi-icon-wrap kpi-icon-violet">
                  <VIcon size="18" color="secondary">tabler-cash</VIcon>
                </div>
              </div>
              <div class="kpi-value text-secondary">
                {{ formatNumber(summary.payroll?.lastPeriodNetPay) }}
              </div>
              <div class="d-flex gap-2 flex-wrap mt-2">
                <VChip size="x-small" color="secondary" variant="tonal">
                  Payslips {{ formatNumber(summary.payroll?.payslipsGenerated) }}
                </VChip>
                <VChip size="x-small" color="warning" variant="tonal">
                  Open {{ formatNumber(summary.payroll?.openPeriods) }}
                </VChip>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- ── Charts Row ── -->
      <VRow>
        <!-- Workforce Donut -->
        <VCol cols="12" md="4">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Workforce Status</VCardTitle>
              <VCardSubtitle>Employee breakdown</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts
                type="donut"
                height="260"
                :options="employeeChartOptions"
                :series="employeeChartSeries"
              />
            </VCardText>
          </VCard>
        </VCol>

        <!-- Attendance Bar -->
        <VCol cols="12" md="4">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Attendance Today</VCardTitle>
              <VCardSubtitle>Check-in / out / missing</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts
                type="bar"
                height="220"
                :options="attendanceChartOptions"
                :series="attendanceChartSeries"
              />
              <!-- Progress bars -->
              <div class="mt-2 d-flex flex-column gap-3">
                <div>
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption text-medium-emphasis">Checked In</span>
                    <span class="text-caption font-weight-medium text-teal">{{ checkedInPct }}%</span>
                  </div>
                  <VProgressLinear :model-value="checkedInPct" color="teal" height="5" rounded />
                </div>
                <div>
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption text-medium-emphasis">Checked Out</span>
                    <span class="text-caption font-weight-medium" style="color:#a78bfa">{{ checkedOutPct }}%</span>
                  </div>
                  <VProgressLinear :model-value="checkedOutPct" color="secondary" height="5" rounded />
                </div>
                <div>
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption text-medium-emphasis">Missing</span>
                    <span class="text-caption font-weight-medium text-error">{{ missingPct }}%</span>
                  </div>
                  <VProgressLinear :model-value="missingPct" color="error" height="5" rounded />
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Leave Chart -->
        <VCol cols="12" md="4">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Leave Overview</VCardTitle>
              <VCardSubtitle>Pending · Approved · Rejected</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts
                type="bar"
                height="220"
                :options="leaveChartOptions"
                :series="leaveChartSeries"
              />
              <!-- Leave stat row -->
              <div class="leave-stats mt-2">
                <div class="leave-stat-item">
                  <span class="leave-stat-dot" style="background:#fbbf24" />
                  <span class="text-caption text-medium-emphasis">Pending</span>
                  <span class="text-caption font-weight-bold ml-auto" style="color:#fbbf24">
                    {{ formatNumber(summary.leave?.pending) }}
                  </span>
                </div>
                <div class="leave-stat-item">
                  <span class="leave-stat-dot" style="background:#2dd4bf" />
                  <span class="text-caption text-medium-emphasis">Approved</span>
                  <span class="text-caption font-weight-bold ml-auto" style="color:#2dd4bf">
                    {{ formatNumber(summary.leave?.approvedThisMonth) }}
                  </span>
                </div>
                <div class="leave-stat-item">
                  <span class="leave-stat-dot" style="background:#fb7185" />
                  <span class="text-caption text-medium-emphasis">Rejected</span>
                  <span class="text-caption font-weight-bold ml-auto" style="color:#fb7185">
                    {{ formatNumber(summary.leave?.rejectedThisMonth) }}
                  </span>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- ── Payroll Summary Banner ── -->
      <VRow class="mt-2">
        <VCol cols="12">
          <VCard class="payroll-banner">
            <VCardText class="py-5">
              <VRow align="center">
                <VCol cols="12" md="4" class="d-flex align-center gap-4">
                  <div class="payroll-icon-wrap">
                    <VIcon size="28" color="success">tabler-currency-dollar</VIcon>
                  </div>
                  <div>
                    <p class="text-overline text-medium-emphasis mb-0">
                      Last Period Net Pay
                    </p>
                    <p class="text-h4 font-weight-bold text-success mb-0">
                      {{ formatNumber(summary.payroll?.lastPeriodNetPay) }}
                    </p>
                  </div>
                </VCol>
                <VDivider vertical class="d-none d-md-flex mx-4" style="opacity:0.08" />
                <VCol cols="12" md="7">
                  <VRow>
                    <VCol cols="6" sm="4">
                      <div class="payroll-stat-card">
                        <p class="text-h5 font-weight-bold text-primary mb-1">
                          {{ formatNumber(summary.payroll?.payslipsGenerated) }}
                        </p>
                        <p class="text-caption text-medium-emphasis mb-0">
                          Payslips Generated
                        </p>
                      </div>
                    </VCol>
                    <VCol cols="6" sm="4">
                      <div class="payroll-stat-card">
                        <p class="text-h5 font-weight-bold mb-1" :class="(summary.payroll?.openPeriods ?? 0) > 0 ? 'text-warning' : 'text-success'">
                          {{ formatNumber(summary.payroll?.openPeriods) }}
                        </p>
                        <p class="text-caption text-medium-emphasis mb-0">
                          Open Periods
                        </p>
                      </div>
                    </VCol>
                    <VCol cols="12" sm="4" class="d-flex align-center">
                      <VChip
                        :color="(summary.payroll?.openPeriods ?? 0) > 0 ? 'warning' : 'success'"
                        variant="tonal"
                        size="small"
                        :prepend-icon="(summary.payroll?.openPeriods ?? 0) > 0 ? 'tabler-alert-triangle' : 'tabler-check'"
                      >
                        {{ (summary.payroll?.openPeriods ?? 0) > 0 ? 'Needs attention' : 'All settled' }}
                      </VChip>
                    </VCol>
                  </VRow>
                </VCol>
              </VRow>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- ── Payroll Analytics ── -->
      <div class="section-header mt-8">
        <p class="text-overline text-teal mb-1">Payroll Analytics</p>
        <h2 class="text-h5 font-weight-bold mb-0">Pay Insights</h2>
      </div>

      <VRow class="mb-4">
        <VCol v-for="item in payrollKpis" :key="item.label" cols="12" sm="6" lg="3">
          <VCard
            class="mini-kpi h-100 kpi-clickable"
            role="button"
            @click="item.label === 'Net Pay' ? openDrilldown('net_pay') : item.label === 'Gross Pay' ? openDrilldown('gross_pay') : undefined"
          >
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
              <VCardSubtitle>Split of total payroll</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="donut" height="260" :options="payrollSplitOptions" :series="payrollSplitSeries" />
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
                    <td class="text-right text-warning">{{ formatCurrency(row.deductions) }}</td>
                    <td class="text-right text-success">{{ formatCurrency(row.net) }}</td>
                    <td>
                      <VChip size="x-small" :color="row.status === 'Paid' ? 'success' : 'warning'" variant="tonal">
                        {{ row.status }}
                      </VChip>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- ── Employee Performance ── -->
      <div class="section-header mt-10">
        <p class="text-overline text-amber mb-1">Employee Performance</p>
        <h2 class="text-h5 font-weight-bold mb-0">Performance Pulse</h2>
      </div>

      <VRow class="mb-4">
        <VCol v-for="item in performanceKpis" :key="item.label" cols="12" sm="6" lg="3">
          <VCard class="mini-kpi h-100">
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="kpi-label">{{ item.label }}</span>
                <div class="kpi-icon-wrap" :class="`kpi-icon-${item.color}`">
                  <VIcon size="18" :color="item.color">{{ item.icon }}</VIcon>
                </div>
              </div>
              <div class="kpi-value text-high-emphasis">
                {{ formatNumber(item.value) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" md="6">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Score Distribution</VCardTitle>
              <VCardSubtitle>Performance bands</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="bar" height="240" :options="scoreBandsOptions" :series="scoreBandsSeries" />
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="6">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Department Comparison</VCardTitle>
              <VCardSubtitle>Radar view</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="radar" height="240" :options="radarOptions" :series="radarSeries" />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow class="mt-4">
        <VCol cols="12">
          <VCard class="table-card">
            <VCardItem>
              <VCardTitle class="chart-title">Individual Performance</VCardTitle>
              <VCardSubtitle>Progress, ratings, and trends</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th class="text-left">Employee</th>
                    <th class="text-left">Department</th>
                    <th class="text-left">Progress</th>
                    <th class="text-left">Rating</th>
                    <th class="text-left">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in performanceTable" :key="row.name">
                    <td>{{ row.name }}</td>
                    <td>{{ row.dept }}</td>
                    <td style="min-width:180px">
                      <div class="d-flex align-center justify-space-between">
                        <span class="text-caption text-medium-emphasis">{{ row.score }}%</span>
                        <span class="text-caption text-medium-emphasis">Goals {{ row.goals }}</span>
                      </div>
                      <VProgressLinear :model-value="row.score" height="6" rounded color="success" />
                    </td>
                    <td>
                      <div class="d-flex align-center gap-1">
                        <VIcon v-for="star in 5" :key="star" size="16" :color="star <= row.rating ? 'warning' : 'secondary'">
                          {{ star <= row.rating ? 'tabler-star-filled' : 'tabler-star' }}
                        </VIcon>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-center gap-1">
                        <VIcon
                          size="16"
                          :color="row.trend === 'up' ? 'success' : row.trend === 'down' ? 'error' : 'secondary'"
                        >
                          {{ row.trend === 'up' ? 'tabler-arrow-up-right' : row.trend === 'down' ? 'tabler-arrow-down-right' : 'tabler-minus' }}
                        </VIcon>
                        <span class="text-caption text-medium-emphasis text-capitalize">{{ row.trend }}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- ── Budget & Cost Forecasting ── -->
      <div class="section-header mt-10">
        <p class="text-overline text-primary mb-1">Budget & Cost Forecasting</p>
        <h2 class="text-h5 font-weight-bold mb-0">Budget Outlook</h2>
      </div>

      <VRow class="mb-4">
        <VCol v-for="item in budgetKpis" :key="item.label" cols="12" sm="6" lg="3">
          <VCard
            class="mini-kpi h-100 kpi-clickable"
            role="button"
            @click="item.label === 'Spent YTD' ? openDrilldown('budget_spent') : undefined"
          >
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="kpi-label">{{ item.label }}</span>
                <div class="kpi-icon-wrap" :class="`kpi-icon-${item.color}`">
                  <VIcon size="18" :color="item.color">{{ item.icon }}</VIcon>
                </div>
              </div>
              <div class="kpi-value text-high-emphasis">
                {{ formatCurrency(item.value) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" md="8">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Budget vs Actual vs Forecast</VCardTitle>
              <VCardSubtitle>12-month view</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="line" height="260" :options="budgetLineOptions" :series="budgetLineSeries" />
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="4">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Category Utilization</VCardTitle>
              <VCardSubtitle>Spend by category</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <div class="d-flex flex-column gap-4">
                <div v-for="cat in budgetCategories" :key="cat.name">
                  <div class="d-flex justify-space-between mb-1">
                    <span class="text-caption text-medium-emphasis">{{ cat.name }}</span>
                    <span class="text-caption font-weight-medium">{{ cat.used }}%</span>
                  </div>
                  <VProgressLinear :model-value="cat.used" :color="cat.color" height="6" rounded />
                  <div class="text-caption text-medium-emphasis mt-1">
                    {{ formatCurrency(cat.amount) }}
                  </div>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow class="mt-4">
        <VCol v-for="item in quarterlyForecast" :key="item.label" cols="12" md="4">
          <VCard class="forecast-card h-100">
            <VCardText>
              <p class="text-overline text-medium-emphasis mb-1">{{ item.label }}</p>
              <p class="text-h5 font-weight-bold mb-0">{{ formatCurrency(item.value) }}</p>
              <p class="text-caption text-medium-emphasis mb-0">{{ item.note }}</p>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <!-- ── Headcount & Hiring ── -->
      <div class="section-header mt-10">
        <p class="text-overline text-success mb-1">Headcount & Hiring</p>
        <h2 class="text-h5 font-weight-bold mb-0">Team Growth</h2>
      </div>

      <VRow class="mb-4">
        <VCol v-for="item in headcountKpis" :key="item.label" cols="12" sm="6" lg="3">
          <VCard
            class="mini-kpi h-100 kpi-clickable"
            role="button"
            @click="item.label === 'Total Headcount' ? openDrilldown('headcount') : undefined"
          >
            <VCardText>
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="kpi-label">{{ item.label }}</span>
                <div class="kpi-icon-wrap" :class="`kpi-icon-${item.color}`">
                  <VIcon size="18" :color="item.color">{{ item.icon }}</VIcon>
                </div>
              </div>
              <div class="kpi-value text-high-emphasis">
                {{ formatNumber(item.value) }}
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12" md="8">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Headcount Growth</VCardTitle>
              <VCardSubtitle>Last 15 months</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="line" height="260" :options="headcountLineOptions" :series="headcountLineSeries" />
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="4">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Department Distribution</VCardTitle>
              <VCardSubtitle>Live headcount mix</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="donut" height="220" :options="headcountDonutOptions" :series="headcountDonutSeries" />
              <div class="legend-list mt-2">
                <div v-for="item in headcountLegend" :key="item.label" class="legend-row">
                  <span class="legend-dot" :style="{ background: item.color }" />
                  <span class="text-caption text-medium-emphasis">{{ item.label }}</span>
                  <span class="text-caption font-weight-medium ml-auto">{{ item.value }}</span>
                </div>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow class="mt-4">
        <VCol cols="12">
          <VCard class="table-card">
            <VCardItem>
              <VCardTitle class="chart-title">Hiring Pipeline</VCardTitle>
              <VCardSubtitle>Stages and priorities</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th class="text-left">Stage</th>
                    <th class="text-right">Applicants</th>
                    <th class="text-left">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in hiringPipeline" :key="row.stage">
                    <td>{{ row.stage }}</td>
                    <td class="text-right">{{ formatNumber(row.applicants) }}</td>
                    <td>
                      <VChip
                        size="x-small"
                        :color="row.priority === 'High' ? 'error' : row.priority === 'Medium' ? 'warning' : row.priority === 'Complete' ? 'success' : 'secondary'"
                        variant="tonal"
                      >
                        {{ row.priority }}
                      </VChip>
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>

    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="2500">
      {{ snackbar.text }}
    </VSnackbar>

    <VDialog v-model="drilldownOpen" max-width="980">
      <VCard>
        <VCardItem>
          <VCardTitle>{{ drilldownTitles[drilldownMetric] || 'Drilldown' }}</VCardTitle>
          <VCardSubtitle>Last 2 months comparison</VCardSubtitle>
          <template #append>
            <VBtn icon="tabler-x" variant="text" @click="drilldownOpen = false" />
          </template>
        </VCardItem>
        <VCardText>
          <VProgressLinear v-if="isDrilldownLoading" indeterminate color="primary" height="2" class="mb-4 rounded" />

          <VRow v-else>
            <VCol cols="12" md="4">
              <VCard class="mini-kpi h-100">
                <VCardText>
                  <p class="kpi-label mb-1">Previous</p>
                  <p class="text-h5 font-weight-bold mb-0">
                    {{ drilldownMetric === 'headcount' ? formatNumber(drilldown.totals?.previous) : formatCurrency(drilldown.totals?.previous) }}
                  </p>
                  <p class="text-caption text-medium-emphasis mb-0">{{ drilldown.labels?.[0] || '' }}</p>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" md="4">
              <VCard class="mini-kpi h-100">
                <VCardText>
                  <p class="kpi-label mb-1">Current</p>
                  <p class="text-h5 font-weight-bold mb-0">
                    {{ drilldownMetric === 'headcount' ? formatNumber(drilldown.totals?.current) : formatCurrency(drilldown.totals?.current) }}
                  </p>
                  <p class="text-caption text-medium-emphasis mb-0">{{ drilldown.labels?.[1] || '' }}</p>
                </VCardText>
              </VCard>
            </VCol>
            <VCol cols="12" md="4">
              <VCard class="mini-kpi h-100">
                <VCardText>
                  <p class="kpi-label mb-1">Change</p>
                  <p class="text-h5 font-weight-bold mb-0">
                    {{
                      drilldownMetric === 'headcount'
                        ? formatNumber((drilldown.totals?.current ?? 0) - (drilldown.totals?.previous ?? 0))
                        : formatCurrency((drilldown.totals?.current ?? 0) - (drilldown.totals?.previous ?? 0))
                    }}
                  </p>
                  <p class="text-caption text-medium-emphasis mb-0">Current - Previous</p>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <VRow v-if="(drilldown.departments || []).length" class="mt-4">
            <VCol cols="12">
              <VCard class="table-card">
                <VCardItem>
                  <VCardTitle class="chart-title">Department Breakdown</VCardTitle>
                </VCardItem>
                <VCardText>
                  <VTable class="text-no-wrap">
                    <thead>
                      <tr>
                        <th class="text-left">Department</th>
                        <th class="text-right">Previous</th>
                        <th class="text-right">Current</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in drilldown.departments" :key="row.department">
                        <td>{{ row.department }}</td>
                        <td class="text-right">
                          {{ drilldownMetric === 'headcount' ? formatNumber(row.previous) : formatCurrency(row.previous) }}
                        </td>
                        <td class="text-right">
                          {{ drilldownMetric === 'headcount' ? formatNumber(row.current) : formatCurrency(row.current) }}
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <VRow v-if="(drilldown.employees || []).length" class="mt-4">
            <VCol cols="12">
              <VCard class="table-card">
                <VCardItem>
                  <VCardTitle class="chart-title">Employee Breakdown</VCardTitle>
                </VCardItem>
                <VCardText>
                  <VTable class="text-no-wrap">
                    <thead>
                      <tr>
                        <th class="text-left">Employee</th>
                        <th class="text-left">Department</th>
                        <th class="text-right">Previous</th>
                        <th class="text-right">Current</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in drilldown.employees" :key="row.employeeId">
                        <td>{{ row.name }}</td>
                        <td>{{ row.department }}</td>
                        <td class="text-right">{{ formatCurrency(row.previous) }}</td>
                        <td class="text-right">{{ formatCurrency(row.current) }}</td>
                      </tr>
                    </tbody>
                  </VTable>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>

          <VRow v-if="(drilldown.categories || []).length" class="mt-4">
            <VCol cols="12">
              <VCard class="table-card">
                <VCardItem>
                  <VCardTitle class="chart-title">Budget Categories</VCardTitle>
                </VCardItem>
                <VCardText>
                  <VTable class="text-no-wrap">
                    <thead>
                      <tr>
                        <th class="text-left">Category</th>
                        <th class="text-right">Allocated</th>
                        <th class="text-right">Spent</th>
                        <th class="text-right">Used %</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="row in drilldown.categories" :key="row.name">
                        <td>{{ row.name }}</td>
                        <td class="text-right">{{ formatCurrency(row.allocated) }}</td>
                        <td class="text-right">{{ formatCurrency(row.spent) }}</td>
                        <td class="text-right">{{ row.usedPct }}%</td>
                      </tr>
                    </tbody>
                  </VTable>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VDialog>
  </section>
</template>

<style scoped>
/* ── Live dot ── */
.live-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentcolor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.35; }
}

/* ── KPI Cards ── */
.kpi-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.kpi-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
}

.kpi-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(var(--v-theme-on-surface), 0.45);
}

.kpi-value {
  font-size: 36px;
  font-weight: 700;
  line-height: 1.1;
  margin: 4px 0 4px;
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
.kpi-icon-teal   { background: rgba(45, 212, 191, 0.12); }
.kpi-icon-amber  { background: rgba(251, 191, 36, 0.12); }
.kpi-icon-rose   { background: rgba(251, 113, 133, 0.12); }
.kpi-icon-violet { background: rgba(167, 139, 250, 0.12); }
.kpi-icon-success { background: rgba(34, 197, 94, 0.12); }
.kpi-icon-primary { background: rgba(56, 189, 248, 0.12); }
.kpi-icon-warning { background: rgba(245, 158, 11, 0.12); }
.kpi-icon-secondary { background: rgba(167, 139, 250, 0.12); }
.kpi-icon-error { background: rgba(251, 113, 133, 0.12); }

/* ── Chart Cards ── */
.chart-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
}
.chart-title { font-size: 14px !important; font-weight: 600 !important; }

/* --- Section headers --- */
.section-header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 16px;
}

/* --- Mini KPI --- */
.mini-kpi {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
.kpi-clickable {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.kpi-clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18) !important;
}

/* --- Tables & forecast cards --- */
.table-card,
.forecast-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
}
.forecast-card {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.06) 0%, transparent 70%) !important;
}

/* --- Donut legend --- */
.legend-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), 0.06);
}
.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Leave stat rows ── */
.leave-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.leave-stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), 0.07);
}
.leave-stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Payroll Banner ── */
.payroll-banner {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.04) 0%, transparent 60%) !important;
}
.payroll-icon-wrap {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: rgba(52, 211, 153, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.payroll-stat-card {
  padding: 12px 0;
}
</style>
