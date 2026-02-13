<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type SalesSummary = {
  totalRevenue?: number
  totalSales?: number
}

type CustomerSummary = {
  totalCustomers?: number
}

type PaymentItem = {
  paymentStatus?: string
  amount?: number
}

const businessId = ref('')
const businesses = ref<{ title: string; value: number }[]>([])

const salesUrl = createUrl('/reports/sales/summary', {
  query: {
    businessId: computed(() => businessId.value || undefined),
  },
})

const customersUrl = createUrl('/reports/customers/summary', {
  query: {
    businessId: computed(() => businessId.value || undefined),
  },
})

const paymentsUrl = createUrl('/reports/payments', {
  query: {
    businessId: computed(() => businessId.value || undefined),
    limit: 100,
    skip: 0,
  },
})

const { data: salesData, execute: fetchSales, isFetching: isFetchingSales } = await useApi<any>(salesUrl)
const { data: customersData, execute: fetchCustomers, isFetching: isFetchingCustomers } = await useApi<any>(customersUrl)
const { data: paymentsData, execute: fetchPayments, isFetching: isFetchingPayments } = await useApi<any>(paymentsUrl)

const salesSummary = computed<SalesSummary>(() => {
  const payload = salesData.value
  return payload?.data ?? payload ?? {}
})

const customerSummary = computed<CustomerSummary>(() => {
  const payload = customersData.value
  return payload?.data ?? payload ?? {}
})

const paymentItems = computed<PaymentItem[]>(() => {
  const payload = paymentsData.value
  const list = payload?.items ?? payload?.data ?? payload?.results ?? payload?.payments ?? []

  return Array.isArray(list) ? list : []
})

const paymentStats = computed(() => {
  const counts: Record<string, number> = {
    pending: 0,
    paid: 0,
    failed: 0,
    refunded: 0,
    overdue: 0,
  }
  paymentItems.value.forEach(item => {
    const key = String(item.paymentStatus || '').toLowerCase()
    if (counts[key] !== undefined)
      counts[key] += 1
  })

  return counts
})

const totalPayments = computed(() => {
  return Object.values(paymentStats.value).reduce((a, b) => a + b, 0)
})

const chartColors = {
  paid: '#10b981',
  pending: '#f59e0b',
  failed: '#ef4444',
  overdue: '#8b5cf6',
  refunded: '#6b7280',
}

const donutChartData = computed(() => {
  const data = [
    { label: 'Paid', value: paymentStats.value.paid, color: chartColors.paid },
    { label: 'Pending', value: paymentStats.value.pending, color: chartColors.pending },
    { label: 'Failed', value: paymentStats.value.failed, color: chartColors.failed },
    { label: 'Overdue', value: paymentStats.value.overdue, color: chartColors.overdue },
    { label: 'Refunded', value: paymentStats.value.refunded, color: chartColors.refunded },
  ].filter(item => item.value > 0)

  let currentAngle = 0
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return data.map(item => {
    const percentage = total > 0 ? (item.value / total) * 100 : 0
    const angle = (percentage / 100) * 360
    const startAngle = currentAngle
    currentAngle += angle

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: currentAngle,
    }
  })
})

const createArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
  const start = polarToCartesian(50, 50, outerRadius, endAngle)
  const end = polarToCartesian(50, 50, outerRadius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  const innerStart = polarToCartesian(50, 50, innerRadius, endAngle)
  const innerEnd = polarToCartesian(50, 50, innerRadius, startAngle)

  return [
    'M', start.x, start.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, end.x, end.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ')
}

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

const barChartData = computed(() => {
  const maxValue = Math.max(...Object.values(paymentStats.value))
  return [
    { label: 'Paid', value: paymentStats.value.paid, color: chartColors.paid, height: maxValue > 0 ? (paymentStats.value.paid / maxValue) * 100 : 0 },
    { label: 'Pending', value: paymentStats.value.pending, color: chartColors.pending, height: maxValue > 0 ? (paymentStats.value.pending / maxValue) * 100 : 0 },
    { label: 'Failed', value: paymentStats.value.failed, color: chartColors.failed, height: maxValue > 0 ? (paymentStats.value.failed / maxValue) * 100 : 0 },
    { label: 'Overdue', value: paymentStats.value.overdue, color: chartColors.overdue, height: maxValue > 0 ? (paymentStats.value.overdue / maxValue) * 100 : 0 },
    { label: 'Refunded', value: paymentStats.value.refunded, color: chartColors.refunded, height: maxValue > 0 ? (paymentStats.value.refunded / maxValue) * 100 : 0 },
  ]
})

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

const loadDashboard = () => {
  if (!businessId.value)
    return
  fetchSales()
  fetchCustomers()
  fetchPayments()
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value)
}

onMounted(() => {
  loadBusinesses()
})
</script>

<template>
  <section class="analytics-dashboard">
    <!-- Header -->
    <div class="dashboard-header mb-8">
      <div>
        <h1 class="text-h3 font-weight-bold mb-2">Business Analytics</h1>
        <p class="text-body-1 text-medium-emphasis">Real-time insights and performance metrics</p>
      </div>
    </div>

    <!-- Business Selector -->
    <VCard class="selector-card mb-10" elevation="0">
      <VCardText class="pa-8">
        <VRow align="center">
          <VCol cols="12" md="8">
            <AppSelect
              v-model="businessId"
              :items="businesses"
              label="Select Business"
              placeholder="Choose a business to analyze"
              variant="outlined"
              density="comfortable"
              clearable
              prepend-inner-icon="tabler-building-store"
            />
          </VCol>
          <VCol cols="12" md="4" class="d-flex justify-end">
            <VBtn
              color="primary"
              size="x-large"
              :disabled="!businessId"
              elevation="2"
              class="px-10"
              @click="loadDashboard"
            >
              <VIcon icon="tabler-refresh" class="me-2" />
              Load Analytics
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Main Stats Grid -->
    <VRow class="mb-10">
      <!-- Revenue Card -->
      <VCol cols="12" md="4">
        <VCard class="stat-card h-100" elevation="0">
          <VCardText class="pa-8">
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <div class="text-overline text-medium-emphasis mb-2">Total Revenue</div>
                <div class="text-h3 font-weight-bold">
                  {{ formatCurrency(salesSummary.totalRevenue ?? 0) }}
                </div>
                <div class="text-caption text-success mt-2">
                  <VIcon icon="tabler-trending-up" size="16" class="me-1" />
                  All-time earnings
                </div>
              </div>
              <VAvatar size="72" color="primary" variant="tonal" class="stat-icon">
                <VIcon icon="tabler-currency-dollar" size="40" />
              </VAvatar>
            </div>
            
            <!-- Mini Line Chart Visualization -->
            <div class="mini-chart">
              <svg viewBox="0 0 200 60" class="chart-svg">
                <defs>
                  <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(99, 102, 241);stop-opacity:0.3" />
                    <stop offset="100%" style="stop-color:rgb(99, 102, 241);stop-opacity:0.05" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 40 L 25 35 L 50 30 L 75 38 L 100 25 L 125 20 L 150 15 L 175 18 L 200 10 L 200 60 L 0 60 Z"
                  fill="url(#revenueGradient)"
                />
                <path
                  d="M 0 40 L 25 35 L 50 30 L 75 38 L 100 25 L 125 20 L 150 15 L 175 18 L 200 10"
                  fill="none"
                  stroke="rgb(99, 102, 241)"
                  stroke-width="2.5"
                />
              </svg>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Sales Card -->
      <VCol cols="12" md="4">
        <VCard class="stat-card h-100" elevation="0">
          <VCardText class="pa-8">
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <div class="text-overline text-medium-emphasis mb-2">Total Sales</div>
                <div class="text-h3 font-weight-bold">
                  {{ formatNumber(salesSummary.totalSales ?? 0) }}
                </div>
                <div class="text-caption text-info mt-2">
                  <VIcon icon="tabler-shopping-bag" size="16" class="me-1" />
                  Completed orders
                </div>
              </div>
              <VAvatar size="72" color="success" variant="tonal" class="stat-icon">
                <VIcon icon="tabler-chart-line" size="40" />
              </VAvatar>
            </div>
            
            <!-- Mini Bar Chart -->
            <div class="mini-chart">
              <svg viewBox="0 0 200 60" class="chart-svg">
                <rect x="5" y="20" width="25" height="40" fill="rgba(34, 197, 94, 0.3)" rx="4" />
                <rect x="40" y="15" width="25" height="45" fill="rgba(34, 197, 94, 0.4)" rx="4" />
                <rect x="75" y="25" width="25" height="35" fill="rgba(34, 197, 94, 0.3)" rx="4" />
                <rect x="110" y="10" width="25" height="50" fill="rgba(34, 197, 94, 0.5)" rx="4" />
                <rect x="145" y="18" width="25" height="42" fill="rgba(34, 197, 94, 0.4)" rx="4" />
                <rect x="175" y="5" width="25" height="55" fill="rgba(34, 197, 94, 0.6)" rx="4" />
              </svg>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Customers Card -->
      <VCol cols="12" md="4">
        <VCard class="stat-card h-100" elevation="0">
          <VCardText class="pa-8">
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <div class="text-overline text-medium-emphasis mb-2">Total Customers</div>
                <div class="text-h3 font-weight-bold">
                  {{ formatNumber(customerSummary.totalCustomers ?? 0) }}
                </div>
                <div class="text-caption text-warning mt-2">
                  <VIcon icon="tabler-user-check" size="16" class="me-1" />
                  Active users
                </div>
              </div>
              <VAvatar size="72" color="info" variant="tonal" class="stat-icon">
                <VIcon icon="tabler-users" size="40" />
              </VAvatar>
            </div>
            
            <!-- Mini Progress Rings -->
            <div class="mini-chart d-flex justify-space-around align-center">
              <div class="progress-ring">
                <svg viewBox="0 0 60 60" width="50" height="50">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" stroke-width="6" />
                  <circle cx="30" cy="30" r="25" fill="none" stroke="rgb(59, 130, 246)" stroke-width="6" 
                    stroke-dasharray="157" stroke-dashoffset="47" stroke-linecap="round" 
                    transform="rotate(-90 30 30)" />
                </svg>
                <div class="ring-label">70%</div>
              </div>
              <div class="progress-ring">
                <svg viewBox="0 0 60 60" width="50" height="50">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" stroke-width="6" />
                  <circle cx="30" cy="30" r="25" fill="none" stroke="rgb(59, 130, 246)" stroke-width="6" 
                    stroke-dasharray="157" stroke-dashoffset="31" stroke-linecap="round" 
                    transform="rotate(-90 30 30)" />
                </svg>
                <div class="ring-label">80%</div>
              </div>
              <div class="progress-ring">
                <svg viewBox="0 0 60 60" width="50" height="50">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="#e5e7eb" stroke-width="6" />
                  <circle cx="30" cy="30" r="25" fill="none" stroke="rgb(59, 130, 246)" stroke-width="6" 
                    stroke-dasharray="157" stroke-dashoffset="78" stroke-linecap="round" 
                    transform="rotate(-90 30 30)" />
                </svg>
                <div class="ring-label">50%</div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Charts Section -->
    <VRow>
      <!-- Donut Chart -->
      <VCol cols="12" lg="5">
        <VCard class="chart-card h-100" elevation="0">
          <VCardItem>
            <VCardTitle class="text-h5 font-weight-bold">Payment Distribution</VCardTitle>
            <VCardSubtitle>Status breakdown analysis</VCardSubtitle>
            <template #append>
              <VBtn
                icon="tabler-refresh"
                variant="text"
                size="small"
                :loading="isFetchingPayments"
                @click="fetchPayments()"
              />
            </template>
          </VCardItem>
          <VCardText class="pa-8">
            <div class="donut-chart-container">
              <svg viewBox="0 0 100 100" class="donut-chart">
                <g v-if="totalPayments > 0">
                  <path
                    v-for="(segment, index) in donutChartData"
                    :key="index"
                    :d="createArc(segment.startAngle, segment.endAngle, 30, 45)"
                    :fill="segment.color"
                    class="donut-segment"
                    :class="{ 'segment-hover': true }"
                  />
                </g>
                <circle v-else cx="50" cy="50" r="37.5" fill="none" stroke="#e5e7eb" stroke-width="15" />
                
                <!-- Center Text -->
                <text x="50" y="45" text-anchor="middle" class="donut-center-value">
                  {{ totalPayments }}
                </text>
                <text x="50" y="55" text-anchor="middle" class="donut-center-label">
                  Total
                </text>
              </svg>
            </div>

            <!-- Legend -->
            <div class="chart-legend mt-8">
              <div
                v-for="segment in donutChartData"
                :key="segment.label"
                class="legend-item"
              >
                <div class="legend-color" :style="{ backgroundColor: segment.color }" />
                <div class="legend-content">
                  <div class="legend-label">{{ segment.label }}</div>
                  <div class="legend-value">
                    {{ segment.value }} <span class="legend-percentage">({{ segment.percentage.toFixed(1) }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Bar Chart -->
      <VCol cols="12" lg="7">
        <VCard class="chart-card h-100" elevation="0">
          <VCardItem>
            <VCardTitle class="text-h5 font-weight-bold">Payment Status Overview</VCardTitle>
            <VCardSubtitle>Detailed metrics by category</VCardSubtitle>
          </VCardItem>
          <VCardText class="pa-8">
            <!-- Bar Chart -->
            <div class="bar-chart-container">
              <div class="bar-chart">
                <div
                  v-for="bar in barChartData"
                  :key="bar.label"
                  class="bar-wrapper"
                >
                  <div class="bar-column">
                    <div class="bar-value">{{ bar.value }}</div>
                    <div
                      class="bar"
                      :style="{
                        height: `${bar.height}%`,
                        backgroundColor: bar.color,
                      }"
                    >
                      <div class="bar-fill" :style="{ backgroundColor: bar.color }" />
                    </div>
                  </div>
                  <div class="bar-label">{{ bar.label }}</div>
                </div>
              </div>
            </div>

            <!-- Stats Grid -->
            <VRow class="mt-8">
              <VCol
                v-for="stat in barChartData"
                :key="stat.label"
                cols="6"
                sm="4"
                lg="2.4"
              >
                <div class="stat-pill" :style="{ borderLeftColor: stat.color }">
                  <div class="text-caption text-medium-emphasis">{{ stat.label }}</div>
                  <div class="text-h6 font-weight-bold">{{ stat.value }}</div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </section>
</template>

<style scoped lang="scss">
.analytics-dashboard {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem;
}

.dashboard-header {
  margin-bottom: 2rem;
}

.selector-card {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%);
  border: 2px solid rgba(99, 102, 241, 0.1);
  border-radius: 20px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
  }
}

.stat-card {
 
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    border-color: rgba(99, 102, 241, 0.2);
  }
}

.stat-icon {
  transition: all 0.3s ease;

  .stat-card:hover & {
    transform: scale(1.1) rotate(5deg);
  }
}

.mini-chart {
  height: 60px;
  margin-top: 1rem;

  .chart-svg {
    width: 100%;
    height: 100%;
  }
}

.progress-ring {
  position: relative;
  text-align: center;

  .ring-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 10px;
    font-weight: 600;
    color: rgb(59, 130, 246);
  }
}

.chart-card {
   
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 24px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08);
  }
}

.donut-chart-container {
  max-width: 300px;
  margin: 0 auto;
}

.donut-chart {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
}

.donut-segment {
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
    filter: brightness(1.1);
  }
}

.donut-center-value {
  font-size: 14px;
  font-weight: 700;
  fill: #1f2937;
}

.donut-center-label {
  font-size: 6px;
  fill: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chart-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.02);
  }
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-content {
  flex: 1;
}

.legend-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.legend-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.legend-percentage {
  font-size: 0.75rem;
  font-weight: 400;
  color: #6b7280;
}

.bar-chart-container {
  padding: 2rem 0;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 280px;
  gap: 1.5rem;
  padding: 0 1rem;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.bar-column {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.bar-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.5rem;
  min-height: 28px;
}

.bar {
  width: 100%;
  max-width: 80px;
  border-radius: 12px 12px 0 0;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-height: 4px;

  &:hover {
    transform: scaleY(1.05);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

.bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px 12px 0 0;
  opacity: 0.9;
}

.bar-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  text-align: center;
  margin-top: 0.5rem;
}

.stat-pill {
  padding: 1rem;
  border-left: 4px solid;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
    transform: translateX(4px);
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  .stat-card,
  .chart-card {
    
    border-color: rgba(255, 255, 255, 0.582);
  }

  .donut-center-value {
    fill: #f9fafb;
  }

  .donut-center-label {
    fill: #9ca3af;
  }

  .legend-label {
    color: #d1d5db;
  }

  .legend-value {
    color: #f9fafb;
  }

  .legend-percentage {
    color: #9ca3af;
  }

  .bar-value {
    color: #f9fafb;
  }

  .bar-label {
    color: #9ca3af;
  }

  .stat-pill {
    background: rgba(255, 255, 255, 0.05);
  }
}

// Animations
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card,
.chart-card {
  animation: fadeInUp 0.6s ease-out backwards;

  @for $i from 1 through 6 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.1}s;
    }
  }
}
</style>
