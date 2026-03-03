<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type LeaveRequest = {
  id: number
  userId?: number
  employeeName?: string
  leaveType?: string
  startDate?: string
  endDate?: string
  reason?: string
  status?: string
  note?: string
}

const userData = useCookie<any>('userData')
const role = computed(() => String(userData.value?.role || '').toLowerCase())
const isSuperuser = computed(() => role.value === 'superuser')
const isHrAdmin = computed(() => ['customer_owner', 'hr_admin'].includes(role.value))
const isEmployee = computed(() => role.value === 'employee')

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

const statusFilter = ref('')
const startDate = ref('')
const endDate = ref('')

const normalizeLeave = (item: any): LeaveRequest => ({
  id: Number(item?.id ?? item?.leaveId ?? 0),
  userId: item?.userId ?? item?.user_id ?? item?.employeeId ?? undefined,
  employeeName: item?.employeeName ?? item?.employee_name ?? item?.fullName ?? item?.name ?? '',
  leaveType: item?.leaveType ?? item?.type ?? '',
  startDate: item?.startDate ?? item?.start_date ?? '',
  endDate: item?.endDate ?? item?.end_date ?? '',
  reason: item?.reason ?? '',
  status: item?.status ?? 'pending',
  note: item?.note ?? '',
})

const leavesData = ref<any>(null)
const isFetching = ref(false)
let fetchLeaves = async () => {}

if (businessId.value) {
  const leavesApi = await useApi<any>(createUrl('/hr/leaves', {
    query: {
      businessId: computed(() => businessId.value || undefined),
      status: computed(() => statusFilter.value || undefined),
      startDate: computed(() => startDate.value || undefined),
      endDate: computed(() => endDate.value || undefined),
    },
  }))
  leavesData.value = leavesApi.data.value
  fetchLeaves = leavesApi.execute
  isFetching.value = leavesApi.isFetching.value
  watch(leavesApi.data, value => { leavesData.value = value })
  watch(leavesApi.isFetching, value => { isFetching.value = value })
}

const employeesData = ref<any>(null)
let fetchEmployees = async () => {}

if ((isHrAdmin.value || isSuperuser.value) && businessId.value) {
  const employeesApi = await useApi<any>(createUrl('/hr/employees', {
    query: {
      businessId: computed(() => businessId.value || undefined),
    },
  }))
  employeesData.value = employeesApi.data.value
  fetchEmployees = employeesApi.execute
  watch(employeesApi.data, value => { employeesData.value = value })
}

const leaves = computed(() => {
  const payload = leavesData.value
  const list = payload?.data ?? payload?.items ?? payload?.leaves ?? payload?.results ?? []
  return Array.isArray(list) ? list.map(normalizeLeave).filter(item => item.id) : []
})

const employeeNameMap = computed(() => {
  const payload = employeesData.value
  const list = payload?.data ?? payload?.items ?? payload?.employees ?? payload?.results ?? []
  if (!Array.isArray(list))
    return new Map<number, string>()
  return new Map<number, string>(
    list
      .map((item: any) => {
        const id = Number(item?.id ?? item?.userId ?? item?.user_id ?? 0)
        if (!id)
          return null
        const name = String(item?.fullName ?? item?.name ?? item?.full_name ?? 'Employee')
        return [id, name] as [number, string]
      })
      .filter(Boolean) as [number, string][],
  )
})

const resolveEmployeeName = (leave: LeaveRequest) => {
  if (leave.employeeName)
    return leave.employeeName
  if (leave.userId && employeeNameMap.value.has(leave.userId))
    return employeeNameMap.value.get(leave.userId) as string
  if (role.value === 'employee')
    return 'Me'
  return 'Employee'
}

// Counts for summary chips
const pendingCount  = computed(() => leaves.value.filter(l => l.status === 'pending').length)
const approvedCount = computed(() => leaves.value.filter(l => l.status === 'approved').length)
const rejectedCount = computed(() => leaves.value.filter(l => l.status === 'rejected').length)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const showSnackbar = (text: string, color = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

watch(businessId, value => {
  if (!value && !isSuperuser.value)
    showSnackbar('Business ID is missing. Please logout and login again.', 'error')
}, { immediate: true })

const isCreateOpen = ref(false)
const createForm = reactive({
  leaveType: '',
  startDate: '',
  endDate: '',
  reason: '',
})

const isSubmitting = ref(false)

const submitLeave = async () => {
  if (!createForm.leaveType || !createForm.startDate || !createForm.endDate) {
    showSnackbar('Please fill leave type, start date, and end date.', 'error')
    return
  }
  try {
    isSubmitting.value = true
    await $api('/hr/leaves/', {
      method: 'POST',
      body: {
        leaveType: createForm.leaveType,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        reason: createForm.reason,
      },
    })
    showSnackbar('Leave request submitted.')
    isCreateOpen.value = false
    createForm.leaveType = ''
    createForm.startDate = ''
    createForm.endDate = ''
    createForm.reason = ''
    fetchLeaves()
  }
  catch {
    showSnackbar('Failed to submit leave request.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}

const isNoteOpen = ref(false)
const noteAction = ref<'approve' | 'reject'>('approve')
const noteTargetId = ref<number | null>(null)
const noteText = ref('')
const isDeciding = ref(false)

const openNoteDialog = (id: number, action: 'approve' | 'reject') => {
  noteTargetId.value = id
  noteAction.value = action
  noteText.value = ''
  isNoteOpen.value = true
}

const submitDecision = async () => {
  if (!noteTargetId.value) return
  try {
    isDeciding.value = true
    await $api(`/hr/leaves/${noteTargetId.value}/${noteAction.value}`, {
      method: 'POST',
      body: noteText.value.trim() ? { note: noteText.value.trim() } : {},
    })
    showSnackbar(`Leave ${noteAction.value}d.`)
    isNoteOpen.value = false
    fetchLeaves()
  }
  catch {
    showSnackbar(`Failed to ${noteAction.value} leave.`, 'error')
  }
  finally {
    isDeciding.value = false
  }
}

// Leave type icon map
const leaveTypeIcon = (type: string) => {
  const t = String(type).toLowerCase()
  if (t.includes('sick'))      return 'tabler-heart-rate-monitor'
  if (t.includes('annual'))    return 'tabler-beach'
  if (t.includes('emergency')) return 'tabler-alert-triangle'
  if (t.includes('maternity') || t.includes('paternity')) return 'tabler-baby-carriage'
  if (t.includes('unpaid'))    return 'tabler-coin-off'
  return 'tabler-calendar-event'
}

// Initials helper
const getInitials = (name: string) =>
  String(name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

const avatarColors = ['teal', 'primary', 'secondary', 'warning', 'error', 'info', 'success']
const getAvatarColor = (name: string) =>
  avatarColors[String(name || '').charCodeAt(0) % avatarColors.length]

// Date formatter
const fmt = (d?: string) => {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return d }
}
</script>

<template>
  <section class="leave-page">
    <!-- Error alert -->
    <VAlert
      v-if="!businessId && !isSuperuser"
      type="error"
      variant="tonal"
      border="start"
      class="mb-6"
    >
      Business ID is missing. Please logout and login again.
    </VAlert>

    <!-- ── Page Header ── -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <p class="text-overline text-primary mb-0" style="letter-spacing:0.12em">
          Human Resources
        </p>
        <h1 class="text-h4 font-weight-bold">
          Leave Requests
        </h1>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        @click="isCreateOpen = true"
      >
        New Request
      </VBtn>
    </div>

    <!-- ── Summary chips ── -->
    <div class="d-flex align-center gap-3 flex-wrap mb-5">
      <div class="summary-chip summary-chip-warning">
        <VIcon size="15">tabler-clock-hour-4</VIcon>
        <span>Pending</span>
        <strong>{{ pendingCount }}</strong>
      </div>
      <div class="summary-chip summary-chip-success">
        <VIcon size="15">tabler-circle-check</VIcon>
        <span>Approved</span>
        <strong>{{ approvedCount }}</strong>
      </div>
      <div class="summary-chip summary-chip-error">
        <VIcon size="15">tabler-circle-x</VIcon>
        <span>Rejected</span>
        <strong>{{ rejectedCount }}</strong>
      </div>
      <div class="summary-chip summary-chip-default ml-auto">
        <VIcon size="15">tabler-list</VIcon>
        <span>Total</span>
        <strong>{{ leaves.length }}</strong>
      </div>
    </div>

    <!-- ── Filter card ── -->
    <VCard class="filter-card mb-5">
      <VCardText class="py-4">
        <VRow align="end">
          <VCol cols="12" sm="6" md="3">
            <AppSelect
              v-model="statusFilter"
              label="Status"
              density="compact"
              hide-details
              :items="[
                { title: 'All Statuses', value: '' },
                { title: 'Pending', value: 'pending' },
                { title: 'Approved', value: 'approved' },
                { title: 'Rejected', value: 'rejected' },
              ]"
              item-title="title"
              item-value="value"
              prepend-inner-icon="tabler-filter"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppTextField
              v-model="startDate"
              type="date"
              label="From"
              density="compact"
              hide-details
              prepend-inner-icon="tabler-calendar"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppTextField
              v-model="endDate"
              type="date"
              label="To"
              density="compact"
              hide-details
              prepend-inner-icon="tabler-calendar"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3" class="d-flex gap-2">
            <VBtn color="primary" block :loading="isFetching" prepend-icon="tabler-search" @click="fetchLeaves">
              Search
            </VBtn>
            <VBtn
              variant="text"
              color="secondary"
              icon
              @click="statusFilter = ''; startDate = ''; endDate = ''"
            >
              <VIcon>tabler-x</VIcon>
              <VTooltip activator="parent">Clear filters</VTooltip>
            </VBtn>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- ── Table card ── -->
    <VCard class="table-card">
      <div class="card-header px-6 pt-5 pb-4">
        <div class="d-flex align-center justify-space-between">
          <div>
            <h2 class="text-h6 font-weight-bold">All Leave Requests</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ leaves.length }} record{{ leaves.length !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>

      <VProgressLinear v-if="isFetching" indeterminate color="primary" height="2" />
      <VDivider />

      <VDataTable
        :items="leaves"
        :loading="isFetching"
        class="leave-table"
        hide-default-header
      >
        <template #headers>
          <tr class="table-header-row">
            <th class="text-start pl-6">Employee</th>
            <th class="text-start">Leave Type</th>
            <th class="text-start">Duration</th>
            <th class="text-start">Status</th>
            <th class="text-start">Reason</th>
            <th v-if="isHrAdmin || isSuperuser" class="text-end pr-6">Actions</th>
          </tr>
        </template>

        <template #item="{ item }">
          <tr class="table-row">
            <!-- Employee -->
            <td class="pl-6 py-3">
              <div class="d-flex align-center gap-3">
                <VAvatar size="36" :color="getAvatarColor(resolveEmployeeName(item))" class="avatar-sm">
                  <span class="text-caption font-weight-bold">
                    {{ getInitials(resolveEmployeeName(item)) }}
                  </span>
                </VAvatar>
                <div>
                  <p class="font-weight-semibold mb-0" style="line-height:1.3; font-size:13.5px">
                    {{ resolveEmployeeName(item) || '—' }}
                  </p>

                </div>
              </div>
            </td>

            <!-- Leave type with icon -->
            <td>
              <div class="d-flex align-center gap-2">
                <div class="leave-type-icon">
                  <VIcon size="14" color="primary">{{ leaveTypeIcon(item.leaveType || '') }}</VIcon>
                </div>
                <span class="text-body-2">{{ item.leaveType || '—' }}</span>
              </div>
            </td>

            <!-- Dates -->
            <td>
              <div class="date-range">
                <span class="date-badge">{{ fmt(item.startDate) }}</span>
                <VIcon size="13" color="secondary" class="mx-1">tabler-arrow-right</VIcon>
                <span class="date-badge">{{ fmt(item.endDate) }}</span>
              </div>
            </td>

            <!-- Status -->
            <td>
              <VChip
                size="small"
                variant="tonal"
                class="text-capitalize status-chip"
                :color="item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : 'warning'"
              >
                <template #prepend>
                  <VIcon size="12" class="mr-1">
                    {{ item.status === 'approved' ? 'tabler-check' : item.status === 'rejected' ? 'tabler-x' : 'tabler-clock' }}
                  </VIcon>
                </template>
                {{ item.status || 'pending' }}
              </VChip>
            </td>

            <!-- Reason -->
            <td>
              <span v-if="item.reason" class="reason-text">{{ item.reason }}</span>
              <span v-else class="text-medium-emphasis">—</span>
            </td>

            <!-- Actions -->
            <td v-if="isHrAdmin || isSuperuser" class="text-end pr-6">
              <div v-if="item.status === 'pending'" class="d-flex align-center justify-end gap-1">
                <VBtn
                  size="small"
                  color="success"
                  variant="tonal"
                  prepend-icon="tabler-check"
                  @click="openNoteDialog(item.id, 'approve')"
                >
                  Approve
                </VBtn>
                <VBtn
                  size="small"
                  color="error"
                  variant="tonal"
                  prepend-icon="tabler-x"
                  @click="openNoteDialog(item.id, 'reject')"
                >
                  Reject
                </VBtn>
              </div>
              <span v-else class="text-caption text-medium-emphasis">Decided</span>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="text-center py-14">
            <VIcon size="52" color="secondary" class="mb-3">tabler-calendar-off</VIcon>
            <p class="text-body-1 text-medium-emphasis">No leave requests found</p>
            <p class="text-caption text-disabled">Try adjusting the filters or submit a new request.</p>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- ── New Leave Dialog ── -->
    <VDialog v-model="isCreateOpen" max-width="560">
      <VCard class="dialog-card">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div class="d-flex align-center gap-3">
            <div class="dialog-icon-wrap">
              <VIcon size="20" color="primary">tabler-calendar-plus</VIcon>
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold">New Leave Request</h3>
              <p class="text-caption text-medium-emphasis mb-0">Submit a request for time off.</p>
            </div>
            <VSpacer />
            <VBtn icon size="small" variant="text" @click="isCreateOpen = false">
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </div>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="createForm.leaveType"
                label="Leave Type"
                placeholder="Annual, Sick, Emergency…"
                prepend-inner-icon="tabler-tag"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="createForm.startDate"
                type="date"
                label="Start Date"
                prepend-inner-icon="tabler-calendar"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="createForm.endDate"
                type="date"
                label="End Date"
                prepend-inner-icon="tabler-calendar"
              />
            </VCol>
            <VCol cols="12">
              <AppTextarea
                v-model="createForm.reason"
                label="Reason"
                placeholder="Briefly describe the reason for your leave…"
                rows="3"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardText class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="tonal" color="secondary" @click="isCreateOpen = false">Cancel</VBtn>
          <VBtn color="primary" :loading="isSubmitting" prepend-icon="tabler-send" @click="submitLeave">
            Submit Request
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ── Approve / Reject Dialog ── -->
    <VDialog v-model="isNoteOpen" max-width="480">
      <VCard class="dialog-card">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div class="d-flex align-center gap-3">
            <div
              class="dialog-icon-wrap"
              :style="{ background: noteAction === 'approve' ? 'rgba(var(--v-theme-success), 0.1)' : 'rgba(var(--v-theme-error), 0.1)' }"
            >
              <VIcon size="20" :color="noteAction === 'approve' ? 'success' : 'error'">
                {{ noteAction === 'approve' ? 'tabler-circle-check' : 'tabler-circle-x' }}
              </VIcon>
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold">
                {{ noteAction === 'approve' ? 'Approve Leave' : 'Reject Leave' }}
              </h3>
              <p class="text-caption text-medium-emphasis mb-0">
                Add an optional note for the employee.
              </p>
            </div>
            <VSpacer />
            <VBtn icon size="small" variant="text" @click="isNoteOpen = false">
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </div>

        <VDivider />

        <VCardText class="pa-6">
          <AppTextarea
            v-model="noteText"
            label="Note (optional)"
            :placeholder="noteAction === 'approve' ? 'Approved. Enjoy your time off!' : 'Please provide a reason for rejection…'"
            rows="4"
          />
        </VCardText>

        <VDivider />

        <VCardText class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="tonal" color="secondary" @click="isNoteOpen = false">Cancel</VBtn>
          <VBtn
            :color="noteAction === 'approve' ? 'success' : 'error'"
            :loading="isDeciding"
            :prepend-icon="noteAction === 'approve' ? 'tabler-check' : 'tabler-x'"
            @click="submitDecision"
          >
            {{ noteAction === 'approve' ? 'Approve' : 'Reject' }}
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar" :color="snackbarColor" :timeout="3000" location="top end" rounded="lg">
      <div class="d-flex align-center gap-2">
        <VIcon size="18">
          {{ snackbarColor === 'success' ? 'tabler-circle-check' : 'tabler-alert-circle' }}
        </VIcon>
        {{ snackbarText }}
      </div>
    </VSnackbar>
  </section>
</template>

<style scoped>
/* ── Summary chips ── */
.summary-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  border: 1px solid transparent;
}
.summary-chip strong { font-weight: 700; font-size: 13px; }
.summary-chip-warning {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
  border-color: rgba(var(--v-theme-warning), 0.2);
}
.summary-chip-success {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
  border-color: rgba(var(--v-theme-success), 0.2);
}
.summary-chip-error {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.2);
}
.summary-chip-default {
  background: rgba(var(--v-theme-on-surface), 0.04);
  color: rgba(var(--v-theme-on-surface), 0.6);
  border-color: rgba(var(--v-border-color), 0.1);
}

/* ── Cards ── */
.filter-card,
.table-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
}

/* ── Table ── */
.table-header-row th {
  font-size: 11px !important;
  font-weight: 600 !important;
  text-transform: uppercase !important;
  letter-spacing: 0.08em !important;
  color: rgba(var(--v-theme-on-surface), 0.45) !important;
  padding-top: 12px !important;
  padding-bottom: 12px !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.07) !important;
  background: rgba(var(--v-theme-on-surface), 0.015) !important;
}

.table-row { transition: background 0.15s; }
.table-row:hover { background: rgba(var(--v-theme-primary), 0.04) !important; }
.table-row td {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05) !important;
  font-size: 13.5px;
}

/* ── Avatar ── */
.avatar-sm { flex-shrink: 0; }

/* ── Leave type icon ── */
.leave-type-icon {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: rgba(var(--v-theme-primary), 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Date range ── */
.date-range {
  display: flex;
  align-items: center;
  white-space: nowrap;
}
.date-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), 0.08);
}

/* ── Status chip ── */
.status-chip { font-size: 12px !important; }

/* ── Reason text ── */
.reason-text {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* ── Dialog ── */
.dialog-card { border-radius: 16px !important; }

.dialog-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>

