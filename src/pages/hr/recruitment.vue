<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

const isJobDialogOpen = ref(false)
const isCandidateDialogOpen = ref(false)

const jobForm = reactive({
  title: '',
  department: '',
  location: '',
  type: 'Full-time',
  manager: '',
  openings: 1,
  status: 'Open',
  description: '',
})

const candidateForm = reactive({
  name: '',
  role: '',
  email: '',
  phone: '',
  source: 'LinkedIn',
  stage: 'Applied',
  score: 0,
  notes: '',
  resume: [] as File[],
})

const resetJobForm = () => {
  jobForm.title = ''
  jobForm.department = ''
  jobForm.location = ''
  jobForm.type = 'Full-time'
  jobForm.manager = ''
  jobForm.openings = 1
  jobForm.status = 'Open'
  jobForm.description = ''
}

const resetCandidateForm = () => {
  candidateForm.name = ''
  candidateForm.role = ''
  candidateForm.email = ''
  candidateForm.phone = ''
  candidateForm.source = 'LinkedIn'
  candidateForm.stage = 'Applied'
  candidateForm.score = 0
  candidateForm.notes = ''
  candidateForm.resume = []
}

const kpis = [
  { label: 'Open Roles', value: 12, change: '+3 this month', icon: 'tabler-briefcase', color: 'primary' },
  { label: 'Active Candidates', value: 86, change: '14 in review', icon: 'tabler-users', color: 'info' },
  { label: 'Interviews Scheduled', value: 24, change: '8 today', icon: 'tabler-calendar-time', color: 'warning' },
  { label: 'Offers Sent', value: 5, change: '2 pending', icon: 'tabler-file-check', color: 'success' },
]

const pipelineStages = [
  { name: 'Applied', value: 32 },
  { name: 'Screening', value: 18 },
  { name: 'Interview', value: 14 },
  { name: 'Offer', value: 6 },
  { name: 'Hired', value: 4 },
]

const jobs = [
  { title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Phnom Penh', status: 'Open', applicants: 18 },
  { title: 'HR Generalist', department: 'People Ops', location: 'Remote', status: 'Open', applicants: 9 },
  { title: 'Sales Executive', department: 'Sales', location: 'Siem Reap', status: 'Paused', applicants: 6 },
  { title: 'Product Designer', department: 'Product', location: 'Hybrid', status: 'Open', applicants: 12 },
]

const applicants = [
  { name: 'Sokha Mey', role: 'Frontend Engineer', stage: 'Interview', score: 86, updated: '2 hrs ago' },
  { name: 'Vannak Dara', role: 'Product Designer', stage: 'Screening', score: 74, updated: 'Today' },
  { name: 'Pisey Chan', role: 'HR Generalist', stage: 'Offer', score: 92, updated: 'Yesterday' },
  { name: 'Rithy Long', role: 'Sales Executive', stage: 'Applied', score: 65, updated: '3 days ago' },
]

const interviews = [
  { candidate: 'Sokha Mey', role: 'Frontend Engineer', time: '10:00 AM', interviewer: 'Lina K.' },
  { candidate: 'Vannak Dara', role: 'Product Designer', time: '1:30 PM', interviewer: 'Kosal T.' },
  { candidate: 'Rithy Long', role: 'Sales Executive', time: '3:00 PM', interviewer: 'Sophea N.' },
]

const statusColor = (status: string) => {
  if (status === 'Open')
    return 'success'
  if (status === 'Paused')
    return 'warning'
  return 'secondary'
}

const stageColor = (stage: string) => {
  if (stage === 'Offer')
    return 'success'
  if (stage === 'Interview')
    return 'info'
  if (stage === 'Screening')
    return 'warning'
  return 'secondary'
}
</script>

<template>
  <section class="hr-recruitment">
    <div class="d-flex flex-wrap align-center justify-space-between mb-6 gap-3">
      <div>
        <p class="text-overline text-primary mb-1" style="letter-spacing:0.12em">
          Recruitment / ATS
        </p>
        <h1 class="text-h4 font-weight-bold mb-1">
          Hiring Pipeline Overview
        </h1>
        <p class="text-medium-emphasis mb-0">
          Track open roles, candidates, interviews, and offers in one place.
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <VBtn color="primary" prepend-icon="tabler-plus" @click="isJobDialogOpen = true">
          Create Job
        </VBtn>
        <VBtn variant="outlined" color="secondary" prepend-icon="tabler-user-plus" @click="isCandidateDialogOpen = true">
          New Candidate
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
            <VCardTitle class="section-title">Open Jobs</VCardTitle>
            <VCardSubtitle>Active roles and applicant volume</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-left">Role</th>
                  <th class="text-left">Department</th>
                  <th class="text-left">Location</th>
                  <th class="text-left">Applicants</th>
                  <th class="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="job in jobs" :key="job.title">
                  <td class="font-weight-medium">{{ job.title }}</td>
                  <td>{{ job.department }}</td>
                  <td>{{ job.location }}</td>
                  <td>{{ job.applicants }}</td>
                  <td>
                    <VChip size="small" :color="statusColor(job.status)" variant="tonal">
                      {{ job.status }}
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
            <VCardTitle class="section-title">Pipeline Snapshot</VCardTitle>
            <VCardSubtitle>Candidate distribution by stage</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div v-for="stage in pipelineStages" :key="stage.name" class="mb-4">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="text-body-2 font-weight-medium">{{ stage.name }}</span>
                <span class="text-caption text-medium-emphasis">{{ stage.value }}</span>
              </div>
              <VProgressLinear :model-value="stage.value * 2" height="8" rounded color="primary" />
            </div>
            <VAlert type="info" variant="tonal" density="comfortable" class="mt-2">
              4 candidates are ready for offer review.
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="mt-4">
      <VCol cols="12" lg="7">
        <VCard class="section-card h-100">
          <VCardItem>
            <VCardTitle class="section-title">Top Candidates</VCardTitle>
            <VCardSubtitle>Latest activity and screening scores</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <VTable class="text-no-wrap">
              <thead>
                <tr>
                  <th class="text-left">Candidate</th>
                  <th class="text-left">Role</th>
                  <th class="text-left">Stage</th>
                  <th class="text-left">Score</th>
                  <th class="text-left">Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="candidate in applicants" :key="candidate.name">
                  <td class="font-weight-medium">{{ candidate.name }}</td>
                  <td>{{ candidate.role }}</td>
                  <td>
                    <VChip size="small" :color="stageColor(candidate.stage)" variant="tonal">
                      {{ candidate.stage }}
                    </VChip>
                  </td>
                  <td>{{ candidate.score }}</td>
                  <td class="text-medium-emphasis">{{ candidate.updated }}</td>
                </tr>
              </tbody>
            </VTable>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" lg="5">
        <VCard class="section-card h-100">
          <VCardItem>
            <VCardTitle class="section-title">Today’s Interviews</VCardTitle>
            <VCardSubtitle>Upcoming schedules</VCardSubtitle>
          </VCardItem>
          <VCardText>
            <div v-for="interview in interviews" :key="interview.candidate" class="interview-card">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="font-weight-medium">{{ interview.candidate }}</div>
                  <div class="text-caption text-medium-emphasis">{{ interview.role }}</div>
                </div>
                <VChip size="small" color="primary" variant="tonal">{{ interview.time }}</VChip>
              </div>
              <div class="text-caption text-medium-emphasis mt-2">
                Interviewer: {{ interview.interviewer }}
              </div>
            </div>
            <VBtn block variant="outlined" color="primary" prepend-icon="tabler-calendar-plus" class="mt-2">
              Schedule Interview
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VDialog v-model="isJobDialogOpen" max-width="640">
      <VCard>
        <VCardTitle class="dialog-title">Create Job</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <VTextField v-model="jobForm.title" label="Job Title" placeholder="Senior Frontend Engineer" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="jobForm.department" label="Department" placeholder="Engineering" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="jobForm.location" label="Location" placeholder="Phnom Penh / Remote" />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="jobForm.type"
                label="Employment Type"
                :items="['Full-time', 'Part-time', 'Contract', 'Internship']"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="jobForm.manager" label="Hiring Manager" placeholder="Manager name" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="jobForm.openings" label="Openings" type="number" min="1" />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="jobForm.status"
                label="Status"
                :items="['Open', 'Paused', 'Closed']"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea v-model="jobForm.description" label="Description" rows="3" placeholder="Role summary and requirements" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn variant="text" @click="resetJobForm(); isJobDialogOpen = false">Cancel</VBtn>
          <VBtn color="primary" @click="isJobDialogOpen = false">Save</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog v-model="isCandidateDialogOpen" max-width="640">
      <VCard>
        <VCardTitle class="dialog-title">New Candidate</VCardTitle>
        <VCardText>
          <VRow>
            <VCol cols="12" sm="6">
              <VTextField v-model="candidateForm.name" label="Full Name" placeholder="Candidate name" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="candidateForm.role" label="Applied Role" placeholder="Role" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="candidateForm.email" label="Email" type="email" />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="candidateForm.phone" label="Phone" />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="candidateForm.source"
                label="Source"
                :items="['LinkedIn', 'Referral', 'Career Site', 'Agency', 'Other']"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VSelect
                v-model="candidateForm.stage"
                label="Stage"
                :items="['Applied', 'Screening', 'Interview', 'Offer', 'Hired']"
              />
            </VCol>
            <VCol cols="12" sm="6">
              <VTextField v-model="candidateForm.score" label="Score" type="number" min="0" max="100" />
            </VCol>
            <VCol cols="12" sm="6">
              <VFileInput
                v-model="candidateForm.resume"
                label="Resume"
                show-size
                prepend-icon="tabler-paperclip"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea v-model="candidateForm.notes" label="Notes" rows="3" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardActions class="justify-end gap-2">
          <VBtn variant="text" @click="resetCandidateForm(); isCandidateDialogOpen = false">Cancel</VBtn>
          <VBtn color="primary" @click="isCandidateDialogOpen = false">Save</VBtn>
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

.interview-card {
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
