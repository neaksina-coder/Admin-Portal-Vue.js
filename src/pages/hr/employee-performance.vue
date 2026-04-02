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
const refresh = async () => { await fetchAnalytics() }

const formatNumber = (value?: number) => new Intl.NumberFormat('en-US').format(Number(value ?? 0))

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
</script>

<template>
  <section class="employee-performance">
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
        <p class="text-overline text-warning mb-0" style="letter-spacing:0.12em">
          Employee Performance
        </p>
        <h1 class="text-h4 font-weight-bold">
          Performance Insights
        </h1>
        <p class="text-medium-emphasis mb-0">
          Reviews, goals, and team score distribution.
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
        <VCol cols="12" md="7">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Score Distribution</VCardTitle>
              <VCardSubtitle>Performance bands</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="bar" height="260" :options="scoreBandsOptions" :series="scoreBandsSeries" />
            </VCardText>
          </VCard>
        </VCol>
        <VCol cols="12" md="5">
          <VCard class="h-100 chart-card">
            <VCardItem>
              <VCardTitle class="chart-title">Department Comparison</VCardTitle>
              <VCardSubtitle>Radar view</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VueApexCharts type="radar" height="260" :options="radarOptions" :series="radarSeries" />
            </VCardText>
          </VCard>
        </VCol>
      </VRow>

      <VRow class="mt-4">
        <VCol cols="12">
          <VCard class="table-card">
            <VCardItem>
              <VCardTitle class="chart-title">Individual Performance</VCardTitle>
              <VCardSubtitle>Progress, rating, and trend</VCardSubtitle>
            </VCardItem>
            <VCardText>
              <VTable class="text-no-wrap">
                <thead>
                  <tr>
                    <th class="text-left">Employee</th>
                    <th class="text-left">Department</th>
                    <th class="text-left">Score</th>
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
                  <tr v-if="!performanceTable.length">
                    <td colspan="5" class="text-center text-medium-emphasis py-6">
                      No performance data available.
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
.kpi-icon-error { background: rgba(251, 113, 133, 0.12); }

.chart-title {
  font-size: 14px !important;
  font-weight: 600 !important;
}
</style>
