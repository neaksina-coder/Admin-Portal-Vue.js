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
}

const summary = computed<HrDashboard>(() => {
  const payload = dashboardData.value
  return payload?.data ?? payload ?? {}
})

const formatNumber = (value?: number) => new Intl.NumberFormat('en-US').format(Number(value ?? 0))

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
        <VBtn
          color="primary"
          variant="outlined"
          size="small"
          :loading="isFetching"
          prepend-icon="tabler-refresh"
          @click="fetchDashboard"
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
      <VProgressLinear v-if="isFetching" indeterminate color="primary" height="2" class="mb-4 rounded" />

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
    </template>
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

/* ── Chart Cards ── */
.chart-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
}
.chart-title { font-size: 14px !important; font-weight: 600 !important; }

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
