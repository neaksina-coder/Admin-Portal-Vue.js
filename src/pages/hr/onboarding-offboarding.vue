<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

const isOnboardingDialogOpen = ref(false)
const isOffboardingDialogOpen = ref(false)
const isUploadDialogOpen = ref(false)
const isCloseDialogOpen = ref(false)

const onboardingForm = reactive({
  employee: '',
  role: '',
  startDate: '',
  manager: '',
  status: 'Planned',
})

const offboardingForm = reactive({
  employee: '',
  lastDay: '',
  reason: '',
  assetsReturn: 'Pending',
})

const uploadForm = reactive({
  title: '',
  owner: '',
  status: 'Pending',
  file: [] as File[],
})

const closeForm = reactive({
  employee: '',
  assetsReturned: 'All returned',
  finalPay: 'Processed',
  notes: '',
})

const resetOnboardingForm = () => {
  onboardingForm.employee = ''
  onboardingForm.role = ''
  onboardingForm.startDate = ''
  onboardingForm.manager = ''
  onboardingForm.status = 'Planned'
}

const resetOffboardingForm = () => {
  offboardingForm.employee = ''
  offboardingForm.lastDay = ''
  offboardingForm.reason = ''
  offboardingForm.assetsReturn = 'Pending'
}

const resetUploadForm = () => {
  uploadForm.title = ''
  uploadForm.owner = ''
  uploadForm.status = 'Pending'
  uploadForm.file = []
}

const resetCloseForm = () => {
  closeForm.employee = ''
  closeForm.assetsReturned = 'All returned'
  closeForm.finalPay = 'Processed'
  closeForm.notes = ''
}

const kpis = [
  { label: 'Active Onboardings', value: 14, change: '5 starting this week', icon: 'tabler-user-check', color: 'primary' },
  { label: 'Tasks Due', value: 28, change: '9 overdue', icon: 'tabler-checklist', color: 'warning' },
  { label: 'Assets Assigned', value: 22, change: '3 pending pickup', icon: 'tabler-device-laptop', color: 'info' },
  { label: 'Offboardings', value: 4, change: '2 this month', icon: 'tabler-user-off', color: 'error' },
]

const onboardingTasks = [
  { task: 'Offer letter signed', owner: 'HR', due: 'Today', status: 'Completed' },
  { task: 'Workstation setup', owner: 'IT', due: 'Tomorrow', status: 'In Progress' },
  { task: 'Orientation session', owner: 'HR', due: 'Mar 28', status: 'Scheduled' },
  { task: 'Benefits enrollment', owner: 'Employee', due: 'Mar 30', status: 'Pending' },
]

const documents = [
  { name: 'Employment Contract', owner: 'HR', status: 'Signed', updated: '2 hrs ago' },
  { name: 'NDA Agreement', owner: 'Legal', status: 'Pending', updated: 'Yesterday' },
  { name: 'Employee Handbook', owner: 'HR', status: 'Acknowledged', updated: 'Mar 25' },
]

const assets = [
  { item: 'Laptop', assignee: 'Sokha Mey', status: 'Issued' },
  { item: 'ID Badge', assignee: 'Sokha Mey', status: 'Pending' },
  { item: 'Phone', assignee: 'Vannak Dara', status: 'Issued' },
]

const exits = [
  { employee: 'Pisey Chan', lastDay: 'Mar 29', assets: '1 pending', status: 'In Progress' },
  { employee: 'Rithy Long', lastDay: 'Apr 3', assets: 'All returned', status: 'Scheduled' },
]

const statusColor = (status: string) => {
  if (['Completed', 'Signed', 'Acknowledged', 'Issued'].includes(status))
    return 'success'
  if (['In Progress', 'Scheduled'].includes(status))
    return 'info'
  if (status === 'Pending')
    return 'warning'
  return 'secondary'
}
</script>

<template>
  <section class="hr-onboarding">
    <div class="d-flex flex-wrap align-center justify-space-between mb-6 gap-3">
      <div>
        <p class="text-overline text-primary mb-1" style="letter-spacing:0.12em">
          Onboarding / Offboarding
        </p>
        <h1 class="text-h4 font-weight-bold mb-1">
          Employee Lifecycle Hub
        </h1>
        <p class="text-medium-emphasis mb-0">
          Manage tasks, documents, and assets for hires and exits.
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <VBtn color="primary" prepend-icon="tabler-user-plus" @click="isOnboardingDialogOpen = true">
          Start Onboarding
        </VBtn>
        <VBtn variant="outlined" color="secondary" prepend-icon="tabler-user-minus" @click="isOffboardingDialogOpen = true">
          Start Offboarding
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
            <VCardTitle class="section-title">Checklist Progress</VCardTitle>
            <VCardSubtitle>Task owners, due dates, and status</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-left">Task</th>
                  <th class="text-left">Owner</th>
                  <th class="text-left">Due</th>
                  <th class="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="task in onboardingTasks" :key="task.task">
                  <td class="font-weight-medium">{{ task.task }}</td>
                  <td>{{ task.owner }}</td>
                  <td>{{ task.due }}</td>
                  <td>
                    <VChip size="small" :color="statusColor(task.status)" variant="tonal">
                      {{ task.status }}
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
            <VCardTitle class="section-title">Documents</VCardTitle>
            <VCardSubtitle>Signature and acknowledgment tracking</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div v-for="doc in documents" :key="doc.name" class="doc-card">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">{{ doc.name }}</div>
                  <div class="text-caption text-medium-emphasis">Owner: {{ doc.owner }}</div>
                </div>
                <VChip size="small" :color="statusColor(doc.status)" variant="tonal">
                  {{ doc.status }}
                </VChip>
              </div>
              <div class="text-caption text-medium-emphasis mt-2">Updated {{ doc.updated }}</div>
            </div>
            <VBtn
              block
              variant="outlined"
              color="primary"
              prepend-icon="tabler-upload"
              class="mt-2"
              @click="isUploadDialogOpen = true"
            >
              Upload Document
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-4">
      <VCol cols="12" lg="6">
        <VCard class="section-card h-100">
          <VCardItem>
            <VCardTitle class="section-title">Assets</VCardTitle>
            <VCardSubtitle>Assignment and return tracking</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-left">Item</th>
                  <th class="text-left">Assignee</th>
                  <th class="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="asset in assets" :key="asset.item + asset.assignee">
                  <td class="font-weight-medium">{{ asset.item }}</td>
                  <td>{{ asset.assignee }}</td>
                  <td>
                    <VChip size="small" :color="statusColor(asset.status)" variant="tonal">
                      {{ asset.status }}
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
            <VCardTitle class="section-title">Exit Summary</VCardTitle>
            <VCardSubtitle>Offboarding status and asset return</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div v-for="exit in exits" :key="exit.employee" class="exit-card">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">{{ exit.employee }}</div>
                  <div class="text-caption text-medium-emphasis">Last day: {{ exit.lastDay }}</div>
                </div>
                <VChip size="small" :color="statusColor(exit.status)" variant="tonal">
                  {{ exit.status }}
                </VChip>
              </div>
              <div class="text-caption text-medium-emphasis mt-2">Assets: {{ exit.assets }}</div>
            </div>
            <VBtn
              block
              variant="outlined"
              color="error"
              prepend-icon="tabler-clipboard-check"
              class="mt-2"
              @click="isCloseDialogOpen = true"
            >
              Close Offboarding
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VDialog v-model="isOnboardingDialogOpen" max-width="560">
      <VCard>
        <VCardTitle class="dialog-title">Start Onboarding</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <VTextField v-model="onboardingForm.employee" label="Employee Name" placeholder="Employee name" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="onboardingForm.role" label="Role" placeholder="Job title" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="onboardingForm.startDate" label="Start Date" type="date" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="onboardingForm.manager" label="Manager" placeholder="Manager name" />
            </VCol>
            <VCol cols="12">
              <VSelect
                v-model="onboardingForm.status"
                label="Status"
                :items="['Planned', 'In Progress', 'Completed']"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn
            variant="text"
            @click="resetOnboardingForm(); isOnboardingDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn color="primary" @click="isOnboardingDialogOpen = false">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="isOffboardingDialogOpen" max-width="560">
      <VCard>
        <VCardTitle class="dialog-title">Start Offboarding</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <VTextField v-model="offboardingForm.employee" label="Employee Name" placeholder="Employee name" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="offboardingForm.lastDay" label="Last Day" type="date" />
            </VCol>
            <VCol cols="12">
              <VTextField v-model="offboardingForm.reason" label="Reason" placeholder="Resignation, termination, etc." />
            </VCol>
            <VCol cols="12">
              <VSelect
                v-model="offboardingForm.assetsReturn"
                label="Assets Return"
                :items="['Pending', 'In Progress', 'Completed']"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn
            variant="text"
            @click="resetOffboardingForm(); isOffboardingDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn color="primary" @click="isOffboardingDialogOpen = false">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="isUploadDialogOpen" max-width="560">
      <VCard>
        <VCardTitle class="dialog-title">Upload Document</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VTextField v-model="uploadForm.title" label="Document Title" placeholder="Employment Contract" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="uploadForm.owner" label="Owner" placeholder="HR / Legal" />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="uploadForm.status"
                label="Status"
                :items="['Pending', 'Signed', 'Acknowledged']"
              />
            </VCol>
            <VCol cols="12">
              <VFileInput
                v-model="uploadForm.file"
                label="File"
                show-size
                prepend-icon="tabler-paperclip"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn variant="text" @click="resetUploadForm(); isUploadDialogOpen = false">Cancel</VBtn>
          <VBtn color="primary" @click="isUploadDialogOpen = false">Upload</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="isCloseDialogOpen" max-width="560">
      <VCard>
        <VCardTitle class="dialog-title">Close Offboarding</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <VTextField v-model="closeForm.employee" label="Employee Name" placeholder="Employee name" />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="closeForm.assetsReturned"
                label="Assets Return"
                :items="['All returned', 'Pending items', 'Lost/Damaged']"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="closeForm.finalPay"
                label="Final Pay"
                :items="['Processed', 'Pending', 'On Hold']"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea v-model="closeForm.notes" label="Notes" rows="3" placeholder="Exit notes or actions" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn variant="text" @click="resetCloseForm(); isCloseDialogOpen = false">Cancel</VBtn>
          <VBtn color="error" @click="isCloseDialogOpen = false">Close</VBtn>
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
.kpi-icon-error { background: rgba(239, 68, 68, 0.12); }

.section-title {
  font-size: 14px !important;
  font-weight: 600 !important;
}

.doc-card,
.exit-card {
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
