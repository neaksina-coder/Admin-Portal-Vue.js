<script setup lang="ts">
import CrmActiveProject from '@/views/dashboards/crm/CrmActiveProject.vue'
import CrmActivityTimeline from '@/views/dashboards/crm/CrmActivityTimeline.vue'
import CrmAnalyticsSales from '@/views/dashboards/crm/CrmAnalyticsSales.vue'
import CrmEarningReportsYearlyOverview from '@/views/dashboards/crm/CrmEarningReportsYearlyOverview.vue'
import CrmOrderBarChart from '@/views/dashboards/crm/CrmOrderBarChart.vue'
import CrmProjectStatus from '@/views/dashboards/crm/CrmProjectStatus.vue'
import CrmRecentTransactions from '@/views/dashboards/crm/CrmRecentTransactions.vue'
import CrmRevenueGrowth from '@/views/dashboards/crm/CrmRevenueGrowth.vue'
import CrmSalesAreaCharts from '@/views/dashboards/crm/CrmSalesAreaCharts.vue'
import CrmSalesByCountries from '@/views/dashboards/crm/CrmSalesByCountries.vue'
import ChartJsLineChart from '@/views/charts/chartjs/ChartJsLineChart.vue'
import AppDateTimePicker from '@/@core/components/app-form-elements/AppDateTimePicker.vue'
import ChartJsBarChart from '@/views/charts/chartjs/ChartJsBarChart.vue'
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()

const BUSINESS_ID = Number(import.meta.env.VITE_BUSINESS_ID ?? 1)
const RANGE = '30d'

type OverviewPayload = {
  ordersCount?: number
  salesTotal?: number
  profitTotal?: number
  customersNew?: number
  growthPct?: number
}

type SeriesPoint = { period?: string; value?: number }
type SegmentPoint = { segment?: string; count?: number }

const overview = ref<OverviewPayload>({})
const revenueDaily = ref<SeriesPoint[]>([])
const revenueMonthly = ref<SeriesPoint[]>([])
const segments = ref<SegmentPoint[]>([])
const customersSeries = ref<SeriesPoint[]>([])
const ordersSeries = ref<SeriesPoint[]>([])

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const formatCount = (value: unknown) => kFormatter(toNumber(value))
const formatMoney = (value: unknown) => `$${kFormatter(toNumber(value))}`

const formatPeriodLabel = (value?: string, mode: 'day' | 'month' = 'day') => {
  if (!value)
    return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return String(value)

  if (mode === 'month')
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

const normalizeList = (payload: any) => {
  return payload?.items
    ?? payload?.data?.items
    ?? payload?.data?.results
    ?? payload?.data?.messages
    ?? payload?.data
    ?? payload?.results
    ?? payload
    ?? []
}

const loadDashboard = async () => {
  try {
    const [
      overviewRes,
      revenueDailyRes,
      revenueMonthlyRes,
      segmentsRes,
      customersRes,
      ordersRes,
    ] = await Promise.all([
      $api(`/dashboard/overview?businessId=${BUSINESS_ID}&range=${RANGE}`),
      $api(`/dashboard/revenue-series?businessId=${BUSINESS_ID}&range=${RANGE}&interval=day`),
      $api(`/dashboard/revenue-series?businessId=${BUSINESS_ID}&range=${RANGE}&interval=month`),
      $api(`/dashboard/segments?businessId=${BUSINESS_ID}`),
      $api(`/dashboard/customers-series?businessId=${BUSINESS_ID}&range=${RANGE}&interval=day`),
      $api(`/dashboard/orders-series?businessId=${BUSINESS_ID}&range=${RANGE}&interval=day`),
    ])

    const overviewPayload = overviewRes?.data ? overviewRes : overviewRes ?? {}
    overview.value = overviewPayload?.data ?? overviewPayload ?? {}

    revenueDaily.value = Array.isArray(normalizeList(revenueDailyRes?.data ? revenueDailyRes : revenueDailyRes ?? {}))
      ? normalizeList(revenueDailyRes?.data ? revenueDailyRes : revenueDailyRes ?? {})
      : []

    revenueMonthly.value = Array.isArray(normalizeList(revenueMonthlyRes?.data ? revenueMonthlyRes : revenueMonthlyRes ?? {}))
      ? normalizeList(revenueMonthlyRes?.data ? revenueMonthlyRes : revenueMonthlyRes ?? {})
      : []

    segments.value = Array.isArray(normalizeList(segmentsRes?.data ? segmentsRes : segmentsRes ?? {}))
      ? normalizeList(segmentsRes?.data ? segmentsRes : segmentsRes ?? {})
      : []

    customersSeries.value = Array.isArray(normalizeList(customersRes?.data ? customersRes : customersRes ?? {}))
      ? normalizeList(customersRes?.data ? customersRes : customersRes ?? {})
      : []

    ordersSeries.value = Array.isArray(normalizeList(ordersRes?.data ? ordersRes : ordersRes ?? {}))
      ? normalizeList(ordersRes?.data ? ordersRes : ordersRes ?? {})
      : []
  }
  catch (error) {
    console.error('Dashboard load failed', error)
  }
}

onMounted(() => {
  loadDashboard()
})

const chartJsCustomColors = {
  white: '#fff',
  yellow: '#ffe800',
  primary: '#836af9',
  areaChartBlue: '#2c9aff',
  barChartYellow: '#ffcf5c',
  polarChartGrey: '#4f5d70',
  polarChartInfo: '#299aff',
  lineChartYellow: '#d4e157',
  polarChartGreen: '#28dac6',
  lineChartPrimary: '#9e69fd',
  lineChartWarning: '#ff9800',
  horizontalBarInfo: '#26c6da',
  polarChartWarning: '#ff8131',
  scatterChartGreen: '#28c76f',
  warningShade: '#ffbd1f',
  areaChartBlueLight: '#84d0ff',
  areaChartGreyLight: '#edf1f4',
  scatterChartWarning: '#ff9f43',
}

const simpleStatisticsDemoCards = computed(() => [
  {
    icon: 'tabler-currency-dollar',
    color: 'success',
    title: 'Total Profit',
    subTitle: 'Last 30 days',
    stat: formatMoney(overview.value.profitTotal),
    change: overview.value.growthPct ?? 0,
  },
  {
    icon: 'tabler-users',
    color: 'primary',
    title: 'New Customers',
    subTitle: 'Last 30 days',
    stat: formatCount(overview.value.customersNew),
    change: overview.value.growthPct ?? 0,
  },
])

const orderSeriesValues = computed(() => ordersSeries.value.map(item => toNumber(item.value)).slice(-7))
const orderSeriesLabels = computed(() => ordersSeries.value.map(item => formatPeriodLabel(item.period, 'day')).slice(-7))

const revenueDailyValues = computed(() => revenueDaily.value.map(item => toNumber(item.value)).slice(-7))
const revenueDailyLabels = computed(() => revenueDaily.value.map(item => formatPeriodLabel(item.period, 'day')).slice(-7))

const revenueMonthlyValues = computed(() => revenueMonthly.value.map(item => toNumber(item.value)))
const revenueMonthlyLabels = computed(() => revenueMonthly.value.map(item => formatPeriodLabel(item.period, 'month')))

const customersValues = computed(() => customersSeries.value.map(item => toNumber(item.value)))
const customersLabels = computed(() => customersSeries.value.map(item => formatPeriodLabel(item.period, 'day')))

const segmentData = computed(() => segments.value
  .filter(item => item.segment && item.count !== undefined)
  .map(item => ({ segment: String(item.segment), count: toNumber(item.count) })))
</script>

<template>
  <VRow class="match-height">
    <VCol
      cols="12"
      md="4"
      sm="6"
      lg="2"
    >
      <CrmOrderBarChart
        title="Orders"
        subtitle="Last 30 days"
        :value="formatCount(overview.ordersCount)"
        :change="overview.growthPct ?? 0"
        :series-data="orderSeriesValues"
        :categories="orderSeriesLabels"
      />
    </VCol>

    <VCol
      cols="12"
      md="4"
      sm="6"
      lg="2"
    >
      <CrmSalesAreaCharts
        title="Sales"
        subtitle="Last 30 days"
        :value="formatMoney(overview.salesTotal)"
        :change="overview.growthPct ?? 0"
        :series-data="revenueDailyValues"
      />
    </VCol>

    <VCol
      v-for="demo in simpleStatisticsDemoCards"
      :key="demo.title"
      cols="12"
      sm="6"
      md="4"
      lg="2"
    >
      <VCard>
        <VCardText>
          <VAvatar
            :color="demo.color"
            variant="tonal"
            rounded
            size="44"
          >
            <VIcon
              :icon="demo.icon"
              size="28"
            />
          </VAvatar>

          <h5 class="text-h5 mt-3">
            {{ demo.title }}
          </h5>
          <p class="my-1">
            {{ demo.subTitle }}
          </p>
          <p class="mb-3 text-high-emphasis">
            {{ demo.stat }}
          </p>
          <VChip
            :color="demo.change >= 0 ? 'success' : 'error'"
            label
            size="small"
          >
            {{ `${demo.change >= 0 ? '+' : ''}${demo.change.toFixed(1)}%` }}
          </VChip>
        </VCardText>
      </VCard>
    </VCol>

    <!-- 👉 Revenue Growth -->
    <VCol
      cols="12"
      md="8"
      lg="4"
    >
      <CrmRevenueGrowth
        :amount="formatMoney(overview.salesTotal)"
        :growth-pct="overview.growthPct ?? 0"
        :series-data="revenueDailyValues"
        :labels="revenueDailyLabels"
      />
    </VCol>

    <!-- 👉 Earning Reports -->
    <VCol
      cols="12"
      md="7"
    >
      <CrmEarningReportsYearlyOverview :segments="segmentData" />
    </VCol>

    <!-- 👉 Latest Statistics -->
    <VCol
       cols="12"
      md="12"
      lg="5"
    >
      <VCard>
        <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
          <VCardTitle>Latest Statistics</VCardTitle>

          <template #append>
            <div class="date-picker-wrapper">
              <AppDateTimePicker
                model-value="2022-06-09"
                prepend-inner-icon="tabler-calendar"
                placeholder="Select Date"
                :config="$vuetify.display.smAndDown ? { position: 'auto center' } : { position: 'auto right' }"
              />
            </div>
          </template>
        </VCardItem>

        <VCardText>
          <ChartJsBarChart
            :colors="chartJsCustomColors"
            :labels="customersLabels"
            :values="customersValues"
          />
        </VCardText>
      </VCard>
    </VCol>
    <!-- Linear charts  -->
    <VCol
      cols="12"
      md="12"
    >
      <VCard title="Data Science">
        <VCardText>
          <ChartJsLineChart
            :colors="chartJsCustomColors"
            :labels="revenueMonthlyLabels"
            :values="revenueMonthlyValues"
            dataset-label="Revenue"
          />
        </VCardText>
      </VCard>
    </VCol>
     
    <!-- 👉 Browser States -->
    <!-- <VCol
      cols="12"
      md="4"
    >
      <CrmSalesByCountries />
    </VCol> -->

    <!-- 👉 Project Status -->
    <!-- <VCol
      cols="12"
      md="4"
    >
      <CrmProjectStatus />
    </VCol> -->

    <!-- 👉 Active Project -->
    <!-- <VCol
      cols="12"
      md="4"
    >
      <CrmActiveProject />
    </VCol> -->

    <!-- 👉 Recent Transactions -->
    <!-- <VCol
      cols="12"
      md="6"
    >
      <CrmRecentTransactions />
    </VCol> -->

    <!-- 👉 Active timeline -->
    <!-- <VCol
      cols="12"
      md="6"
    >
      <CrmActivityTimeline />
    </VCol> -->
  </VRow>
</template>
