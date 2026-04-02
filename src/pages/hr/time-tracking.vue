<script setup lang="ts">
import { title } from 'process'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

const isTimesheetDialogOpen = ref(false)
const isProjectDialogOpen = ref(false)

const timesheetForm = reactive({
  employee: '',
  project: '',
  date: '',
  hours: 8,
  overtime: 0,
  status: 'Submitted',
})

const projectForm = reactive({
  name: '',
  lead: '',
  budget: 160,
  startDate: '',
  status: 'Active',
})

const resetTimesheetForm = () => {
  timesheetForm.employee = ''
  timesheetForm.project = ''
  timesheetForm.date = ''
  timesheetForm.hours = 8
  timesheetForm.overtime = 0
  timesheetForm.status = 'Submitted'
}

const resetProjectForm = () => {
  projectForm.name = ''
  projectForm.lead = ''
  projectForm.budget = 160
  projectForm.startDate = ''
  projectForm.status = 'Active'
}

const kpis = [
  { label: 'Hours Logged', value: 1280, change: '+6% vs last week', icon: 'tabler-clock', color: 'primary' },
  { label: 'Overtime', value: 74, change: '12 pending review', icon: 'tabler-clock-exclamation', color: 'warning' },
  { label: 'Timesheets Pending', value: 18, change: '5 due today', icon: 'tabler-file-time', color: 'info' },
  { label: 'Approvals', value: 42, change: '8 awaiting', icon: 'tabler-checklist', color: 'success' },
]

const timesheets = [
  { employee: 'Sokha Mey', project: 'Invenza UI', hours: 40, overtime: 2, status: 'Submitted' },
  { employee: 'Vannak Dara', project: 'Website Redesign', hours: 36, overtime: 0, status: 'Approved' },
  { employee: 'Pisey Chan', project: 'HR Ops', hours: 38, overtime: 3, status: 'Pending' },
  { employee: 'Rithy Long', project: 'Sales CRM', hours: 42, overtime: 4, status: 'Submitted' },
]

const projects = [
  { name: 'Invenza UI', lead: 'Lina K.', budget: '220 hrs', utilization: 72 },
  { name: 'Website Redesign', lead: 'Kosal T.', budget: '180 hrs', utilization: 58 },
  { name: 'Sales CRM', lead: 'Sophea N.', budget: '140 hrs', utilization: 81 },
]

const approvals = [
  { approver: 'HR Admin', request: 'Overtime - Sales CRM', hours: 6, status: 'Awaiting' },
  { approver: 'Project Lead', request: 'Timesheet - Invenza UI', hours: 40, status: 'Approved' },
  { approver: 'HR Admin', request: 'Overtime - HR Ops', hours: 3, status: 'Awaiting' },
]

const report = [
  {title : 'Weekly Hours Summary', updated: 'Today', status: 'Ready'},
  {title : 'Overtime by Team', updated: 'Yesterday', status: 'Ready '},
  {title : 'Projet Utilization', updated: 'Mar 25', status: 'Scheduled'},
]
const reports = [
  { title: 'Weekly Hours Summary', updated: 'Today', status: 'Ready' },
  { title: 'Overtime by Team', updated: 'Yesterday', status: 'Ready' },
  { title: 'Project Utilization', updated: 'Mar 25', status: 'Scheduled' },
]

const statusColor = (status: string) => {
  if (status === 'Approved' || status === 'Ready')
    return 'success'
  if (status === 'Submitted')
    return 'info'
  if (status === 'Pending' || status === 'Awaiting' || status === 'Scheduled')
    return 'warning'
  return 'secondary'
}
</script>

<template>
  <section class="hr-timesheets">
    <div class="d-flex flex-wrap align-center justify-space-between mb-6 gap-3">
      <div>
        <p class="text-overline text-primary mb-1" style="letter-spacing:0.12em">
          Time Tracking & Timesheets
        </p>
        <h1 class="text-h4 font-weight-bold mb-1">
          Hours,  , and Approvals
        </h1>
        <p class="text-medium-emphasis mb-0">
          Track daily hours, overtime, and approval workflows.
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <VBtn color="primary" prepend-icon="tabler-plus" @click="isTimesheetDialogOpen = true">
          New Timesheet
        </VBtn>
        <VBtn variant="outlined" color="secondary" prepend-icon="tabler-folder-plus" @click="isProjectDialogOpen = true">
          New Project
        </VBtn>
      </div>
    </div>

    <VRow class="mb-4">
      <VCol v-for="item in kpis" :key="item.label" cols="12" sm="6" lg="3">
        <VCard class="kpi-card h-100">
          <VCardText>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="kpi-label">{{ item.label }}</span>
              <div class="kpi-icon" :class="`kpi-icon-${item.color}`">
                <VIcon size="18" :color="item.color">{{ item.icon }}</VIcon>
              </div>
            </div>
            <div class="kpi-value text-high-emphasis">{{ item.value }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.change }}</div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow>
      <VCol cols="12" lg="7">
        <VCard class="section-card h-100">
          <VCardItem>
            <VCardTitle class="section-title">Timesheets</VCardTitle>
            <VCardSubtitle>Hours by employee and project</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-left">Employee</th>
                  <th class="text-left">Project</th>
                  <th class="text-left">Hours</th>
                  <th class="text-left">Overtime</th>
                  <th class="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in timesheets" :key="row.employee + row.project">
                  <td class="font-weight-medium">{{ row.employee }}</td>
                  <td>{{ row.project }}</td>
                  <td>{{ row.hours }}</td>
                  <td>{{ row.overtime }}</td>
                  <td>
                    <VChip size="small" :color="statusColor(row.status)" variant="tonal">
                      {{ row.status }}
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" lg="5">
        <VCard class="section-card h-100">
          <VCardItem>
            <VCardTitle class="section-title">Projects</VCardTitle>
            <VCardSubtitle>Utilization vs budget</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div v-for="project in projects" :key="project.name" class="project-card">
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="font-weight-medium">{{ project.name }}</div>
                <span class="text-caption text-medium-emphasis">{{ project.budget }}</span>
              </div>
              <div class="text-caption text-medium-emphasis">Lead: {{ project.lead }}</div>
              <VProgressLinear :model-value="project.utilization" height="8" rounded color="primary" class="mt-2" />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-4">
      <VCol cols="12" lg="6">
        <VCard class="section-card h-100">
          <VCardItem>
            <VCardTitle class="section-title">Approvals</VCardTitle>
            <VCardSubtitle>Overtime and timesheet approvals</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-left">Approver</th>
                  <th class="text-left">Request</th>
                  <th class="text-left">Hours</th>
                  <th class="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="approval in approvals" :key="approval.request">
                  <td class="font-weight-medium">{{ approval.approver }}</td>
                  <td>{{ approval.request }}</td>
                  <td>{{ approval.hours }}</td>
                  <td>
                    <VChip size="small" :color="statusColor(approval.status)" variant="tonal">
                      {{ approval.status }}
                    </VChip>
                  </td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" lg="6">
        <VCard class="section-card h-100">
          <VCardItem>
            <VCardTitle class="section-title">Reports</VCardTitle>
            <VCardSubtitle>Exportable summaries</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div v-for="report in reports" :key="report.title" class="report-card">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">{{ report.title }}</div>
                  <div class="text-caption text-medium-emphasis">Updated {{ report.updated }}</div>
                </div>
                <VChip size="small" :color="statusColor(report.status)" variant="tonal">
                  {{ report.status }}
                </VChip>
              </div>
            </div>
            <VBtn block variant="outlined" color="primary" prepend-icon="tabler-download" class="mt-2">
              Export Report
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VDialog v-model="isTimesheetDialogOpen" max-width="560">
      <VCard>
        <VCardTitle class="dialog-title">New Timesheet</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <VTextField v-model="timesheetForm.employee" label="Employee" placeholder="Employee name" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="timesheetForm.project" label="Project" placeholder="Project name" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="timesheetForm.date" label="Date" type="date" />
            </VCol>
            <VCol cols="12" sm="3">
              <VTextField v-model="timesheetForm.hours" label="Hours" type="number" min="0" />
            </VCol>
            <VCol cols="12" sm="3">
              <VTextField v-model="timesheetForm.overtime" label="Overtime" type="number" min="0" />
            </VCol>
            <VCol cols="12">
              <VSelect
                v-model="timesheetForm.status"
                label="Status"
                :items="['Submitted', 'Pending', 'Approved']"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn variant="text" @click="isTimesheetDialogOpen = false">Cancel</VBtn>
          <VBtn color="primary" @click="isTimesheetDialogOpen = false">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="isProjectDialogOpen" max-width="560">
      <VCard>
        <VCardTitle class="dialog-title">New Project</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField v-model="projectForm.name" label="Project Name" placeholder="Project title" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="projectForm.lead" label="Project Lead" placeholder="Lead name" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="projectForm.startDate" label="Start Date" type="date" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="projectForm.budget" label="Budget Hours" type="number" min="0" />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="projectForm.status"
                label="Status"
                :items="['Active', 'Paused', 'Completed']"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn variant="text" @click="isProjectDialogOpen = false">Cancel</VBtn>
          <VBtn color="primary" @click="isProjectDialogOpen = false">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </section>
</template>

<style scoped>
.kpi-card,
.section-card {
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

.kpi-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon-primary { background: rgba(99, 102, 241, 0.12); }
.kpi-icon-info { background: rgba(56, 189, 248, 0.12); }
.kpi-icon-warning { background: rgba(245, 158, 11, 0.12); }
.kpi-icon-success { background: rgba(34, 197, 94, 0.12); }

.section-title {
  font-size: 14px !important;
  font-weight: 600 !important;
}

.project-card,
.report-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  margin-bottom: 12px;
}

.dialog-title {
  font-size: 16px;
  font-weight: 600;
}
</style>
