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

const simpleStatisticsDemoCards = [
  {
    icon: 'tabler-credit-card',
    color: 'error',
    title: 'Total Profit',
    subTitle: 'Last week',
    stat: '1.28k',
    change: '-12.2%',
  },
  {
    icon: 'tabler-currency-dollar',
    color: 'success',
    title: 'Total Sales',
    subTitle: 'Last week',
    stat: '$4,673',
    change: '+25.2%',
  },
]
</script>

<template>
  <VRow class="match-height">
    <VCol
      cols="12"
      md="4"
      sm="6"
      lg="2"
    >
      <CrmOrderBarChart />
    </VCol>

    <VCol
      cols="12"
      md="4"
      sm="6"
      lg="2"
    >
      <CrmSalesAreaCharts />
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
            :color="demo.color"
            label
            size="small"
          >
            {{ demo.change }}
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
      <CrmRevenueGrowth />
    </VCol>

    <!-- 👉 Earning Reports -->
    <VCol
      cols="12"
      md="7"
    >
      <CrmEarningReportsYearlyOverview />
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
          <ChartJsBarChart :colors="chartJsCustomColors" />
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
          <ChartJsLineChart :colors="chartJsCustomColors" />
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
