<script setup lang="ts">
import { useTheme } from 'vuetify'

interface Props {
  title?: string
  subtitle?: string
  value?: string | number
  change?: number
  seriesData?: number[]
}

const props = defineProps<Props>()

const vuetifyTheme = useTheme()

const currentTheme = vuetifyTheme.current.value.colors

const fallbackSeries = [200, 55, 400, 250]

const series = computed(() => [
  {
    name: 'Series',
    data: props.seriesData?.length ? props.seriesData : fallbackSeries,
  },
])

const displayValue = computed(() => (props.value ?? '175k'))
const displayChange = computed(() => {
  if (props.change === undefined || props.change === null)
    return '-16.2%'

  const sign = props.change >= 0 ? '+' : ''
  return `${sign}${props.change.toFixed(1)}%`
})

const changeClass = computed(() => (props.change ?? 0) >= 0 ? 'text-success' : 'text-error')

const chartOptions = {
  chart: {
    type: 'area',
    parentHeightOffset: 0,
    toolbar: {
      show: false,
    },
    sparkline: {
      enabled: true,
    },
  },
  markers: {
    colors: 'transparent',
    strokeColors: 'transparent',
  },
  grid: {
    show: false,
  },
  colors: [currentTheme.success],
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 0.9,
      opacityFrom: 0.5,
      opacityTo: 0.07,
      stops: [0, 80, 100],
    },
  },
  dataLabels: {
    enabled: false,
  },
  stroke: {
    width: 2,
    curve: 'smooth',
  },
  xaxis: {
    show: true,
    lines: {
      show: false,
    },
    labels: {
      show: false,
    },
    stroke: {
      width: 0,
    },
    axisBorder: {
      show: false,
    },
  },
  yaxis: {
    stroke: {
      width: 0,
    },
    show: false,
  },
  tooltip: {
    enabled: false,
  },
}
</script>

<template>
  <VCard>
    <VCardItem class="pb-3">
      <VCardTitle>
        {{ props.title ?? 'Sales' }}
      </VCardTitle>
      <VCardSubtitle>
        {{ props.subtitle ?? 'Last Year' }}
      </VCardSubtitle>
    </VCardItem>

    <VueApexCharts
      :options="chartOptions"
      :series="series"
      :height="68"
    />

    <VCardText class="pt-1">
      <div class="d-flex align-center justify-space-between gap-x-2">
        <h4 class="text-h4 text-center">
          {{ displayValue }}
        </h4>
        <span class="text-sm" :class="changeClass">
          {{ displayChange }}
        </span>
      </div>
    </VCardText>
  </VCard>
</template>
