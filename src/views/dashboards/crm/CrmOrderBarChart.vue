<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  value?: string | number
  change?: number
  seriesData?: number[]
  categories?: string[]
}

const props = defineProps<Props>()

const fallbackSeries = [60, 50, 20, 45, 50, 30, 70]
const fallbackCategories = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const series = computed(() => [
  {
    name: 'Series',
    data: props.seriesData?.length ? props.seriesData : fallbackSeries,
  },
])

const displayValue = computed(() => (props.value ?? '124k'))
const displayChange = computed(() => {
  if (props.change === undefined || props.change === null)
    return '+12.6%'

  const sign = props.change >= 0 ? '+' : ''
  return `${sign}${props.change.toFixed(1)}%`
})

const changeClass = computed(() => (props.change ?? 0) >= 0 ? 'text-success' : 'text-error')

const chartOptions = computed(() => {
  return {
    chart: {
      height: 90,
      parentHeightOffset: 0,
      type: 'bar',
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      enabled: false,
    },
    plotOptions: {
      bar: {
        barHeight: '100%',
        columnWidth: '30%',
        startingShape: 'rounded',
        endingShape: 'rounded',
        borderRadius: 4,
        colors: {
          backgroundBarColors: [
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
            'rgba(var(--v-track-bg))',
          ],
          backgroundBarRadius: 4,
        },
      },
    },
    colors: ['rgba(var(--v-theme-primary),1)'],
    grid: {
      show: false,
      padding: {
        top: -30,
        left: -16,
        bottom: 0,
        right: -6,
      },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: props.categories?.length ? props.categories : fallbackCategories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
    responsive: [
      {
        breakpoint: 1441,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '30%',
              borderRadius: 4,
            },
          },
        },
      },
      {
        breakpoint: 1368,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '48%',
            },
          },
        },
      },
      {
        breakpoint: 1264,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 6,
              columnWidth: '30%',
              colors: {
                backgroundBarRadius: 6,
              },
            },
          },
        },
      },
      {
        breakpoint: 960,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '15%',
              borderRadius: 4,
            },
          },
        },
      },
      {
        breakpoint: 883,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '20%',
            },
          },
        },
      },
      {
        breakpoint: 768,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '25%',
            },
          },
        },
      },
      {
        breakpoint: 600,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '15%',
              borderRadius: 4,
            },
            colors: {
              backgroundBarRadius: 9,
            },
          },
        },
      },
      {
        breakpoint: 479,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 4,
            },
            colors: {
              backgroundBarRadius: 9,
            },
          },
          grid: {
            padding: {
              right: -15,
              left: -15,
            },
          },
        },
      },
      {
        breakpoint: 400,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 4,
            },
          },
        },
      },
    ],

  }
})
</script>

<template>
  <VCard>
    <VCardItem class="pb-3">
      <VCardTitle>{{ props.title ?? 'Orders' }}</VCardTitle>
      <VCardSubtitle>{{ props.subtitle ?? 'Last Week' }}</VCardSubtitle>
    </VCardItem>

    <VCardText>
      <VueApexCharts
        :options="chartOptions"
        :series="series"
        :height="62"
      />

      <div class="d-flex align-center justify-space-between gap-x-2 mt-3">
        <h4 class="text-h4 text-center">
          {{ displayValue }}
        </h4>
        <div class="text-sm" :class="changeClass">
          {{ displayChange }}
        </div>
      </div>
    </VCardText>
  </VCard>
</template>
