<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type AttendanceLog = {
  id: number
  userId?: number
  employeeName?: string
  checkInAt?: string
  checkOutAt?: string
  status?: string
  note?: string
}

const userData = useCookie<any>('userData')
const role = computed(() => String(userData.value?.role || '').toLowerCase())
const isSuperuser = computed(() => role.value === 'superuser')
const isHrAdmin = computed(() => ['customer_owner', 'hr_admin'].includes(role.value))

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

const startDate = ref('')
const endDate = ref('')

const normalizeLog = (item: any): AttendanceLog => ({
  id: Number(item?.id ?? item?.logId ?? 0),
  userId: item?.userId ?? item?.user_id ?? item?.employeeId ?? undefined,
  employeeName: item?.employeeName ?? item?.employee_name ?? item?.fullName ?? item?.name ?? '',
  checkInAt: item?.checkInAt ?? item?.check_in_at ?? '',
  checkOutAt: item?.checkOutAt ?? item?.check_out_at ?? '',
  status: item?.status ?? '',
  note: item?.note ?? '',
})

const employeesData = ref<any>(null)
let fetchEmployees = async () => {}

if ((isHrAdmin.value || isSuperuser.value) && businessId.value) {
  const employeesApi = await useApi<any>(createUrl('/hr/employees', {
    query: { businessId: computed(() => businessId.value || undefined) },
  }))
  employeesData.value = employeesApi.data.value
  fetchEmployees = employeesApi.execute
  watch(employeesApi.data, value => { employeesData.value = value })
}

const attendanceData = ref<any>(null)
const isFetching = ref(false)
let fetchAttendance = async () => {}

if (businessId.value) {
  const attendanceApi = await useApi<any>(createUrl('/hr/attendance', {
    query: {
      businessId: computed(() => businessId.value || undefined),
      startDate: computed(() => startDate.value || undefined),
      endDate: computed(() => endDate.value || undefined),
    },
  }))
  attendanceData.value = attendanceApi.data.value
  fetchAttendance = attendanceApi.execute
  isFetching.value = attendanceApi.isFetching.value
  watch(attendanceApi.data, value => { attendanceData.value = value })
  watch(attendanceApi.isFetching, value => { isFetching.value = value })
}

const attendanceLogs = computed(() => {
  const payload = attendanceData.value
  const list = payload?.data ?? payload?.items ?? payload?.logs ?? payload?.results ?? []
  return Array.isArray(list) ? list.map(normalizeLog).filter(item => item.id) : []
})

const employeeNameMap = computed(() => {
  const payload = employeesData.value
  const list = payload?.data ?? payload?.items ?? payload?.employees ?? payload?.results ?? []
  if (!Array.isArray(list)) return new Map<number, string>()
  return new Map<number, string>(
    list.map((item: any) => {
      const id = Number(item?.id ?? item?.userId ?? item?.user_id ?? 0)
      if (!id) return null
      const name = String(item?.fullName ?? item?.name ?? item?.full_name ?? 'Employee')
      return [id, name] as [number, string]
    }).filter(Boolean) as [number, string][],
  )
})

const resolveEmployeeName = (log: AttendanceLog) => {
  if (log.employeeName) return log.employeeName
  if (log.userId && employeeNameMap.value.has(log.userId))
    return employeeNameMap.value.get(log.userId) as string
  if (role.value === 'employee') return 'Me'
  return String(log.userId ?? '—')
}

// Summary counts
const presentCount = computed(() =>
  attendanceLogs.value.filter(l => (l.status || '').toLowerCase() === 'present').length)
const checkedOutCount = computed(() =>
  attendanceLogs.value.filter(l => !!l.checkOutAt).length)
const missingCount = computed(() =>
  attendanceLogs.value.filter(l => l.checkInAt && !l.checkOutAt).length)

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

// Check in / out dialog
const isCheckOpen = ref(false)
const checkAction = ref<'check-in' | 'check-out'>('check-in')
const checkNote = ref('')
const isChecking = ref(false)

const openCheckDialog = (action: 'check-in' | 'check-out') => {
  checkAction.value = action
  checkNote.value = ''
  isCheckOpen.value = true
}

const submitCheck = async () => {
  try {
    isChecking.value = true
    await $api(`/hr/attendance/${checkAction.value}`, {
      method: 'POST',
      body: checkNote.value.trim() ? { note: checkNote.value.trim() } : {},
    })
    showSnackbar(`Successfully ${checkAction.value.replace('-', ' ')}.`)
    isCheckOpen.value = false
    fetchAttendance()
  }
  catch {
    showSnackbar(`Failed to ${checkAction.value.replace('-', ' ')}.`, 'error')
  }
  finally {
    isChecking.value = false
  }
}

// Edit dialog
const isEditOpen = ref(false)
const isSaving = ref(false)
const editForm = reactive({
  id: null as number | null,
  checkInAt: '',
  checkOutAt: '',
  status: '',
  note: '',
})

const openEdit = (item: AttendanceLog) => {
  editForm.id = item.id
  editForm.checkInAt = item.checkInAt || ''
  editForm.checkOutAt = item.checkOutAt || ''
  editForm.status = item.status || ''
  editForm.note = item.note || ''
  isEditOpen.value = true
}

const saveEdit = async () => {
  if (!editForm.id) return
  try {
    isSaving.value = true
    await $api(`/hr/attendance/${editForm.id}`, {
      method: 'PUT',
      body: {
        checkInAt: editForm.checkInAt || undefined,
        checkOutAt: editForm.checkOutAt || undefined,
        status: editForm.status || undefined,
        note: editForm.note || undefined,
      },
    })
    showSnackbar('Attendance updated.')
    isEditOpen.value = false
    fetchAttendance()
  }
  catch {
    showSnackbar('Failed to update attendance.', 'error')
  }
  finally {
    isSaving.value = false
  }
}

// Helpers
const getInitials = (name: string) =>
  String(name || '?').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

const avatarColors = ['teal', 'primary', 'secondary', 'warning', 'error', 'info', 'success']
const getAvatarColor = (name: string) =>
  avatarColors[String(name || '').charCodeAt(0) % avatarColors.length]

const fmtDateTime = (dt?: string) => {
  if (!dt) return null
  try {
    return new Date(dt).toLocaleString('en-US', {
      day: 'numeric', month: 'short',
      hour: '2-digit', minute: '2-digit', hour12: true,
    })
  }
  catch { return dt }
}

const fmtTime = (dt?: string) => {
  if (!dt) return null
  try {
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
  catch { return dt }
}

const statusColor = (s?: string) => {
  const v = String(s || '').toLowerCase()
  if (v === 'present') return 'success'
  if (v === 'absent')  return 'error'
  if (v === 'late')    return 'warning'
  return 'secondary'
}

const statusIcon = (s?: string) => {
  const v = String(s || '').toLowerCase()
  if (v === 'present') return 'tabler-circle-check'
  if (v === 'absent')  return 'tabler-circle-x'
  if (v === 'late')    return 'tabler-clock-exclamation'
  return 'tabler-minus'
}

// Duration calc
const calcDuration = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return null
  try {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime()
    if (diff <= 0) return null
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }
  catch { return null }
}
</script>

<template>
  <section class="attendance-page">
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
          Attendance
        </h1>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          color="success"
          variant="tonal"
          prepend-icon="tabler-login"
          @click="openCheckDialog('check-in')"
        >
          Check In
        </VBtn>
        <VBtn
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-logout"
          @click="openCheckDialog('check-out')"
        >
          Check Out
        </VBtn>
      </div>
    </div>

    <!-- ── Summary chips ── -->
    <div class="d-flex align-center gap-3 flex-wrap mb-5">
      <div class="summary-chip summary-chip-success">
        <VIcon size="15">tabler-circle-check</VIcon>
        <span>Present</span>
        <strong>{{ presentCount }}</strong>
      </div>
      <div class="summary-chip summary-chip-secondary">
        <VIcon size="15">tabler-logout</VIcon>
        <span>Checked Out</span>
        <strong>{{ checkedOutCount }}</strong>
      </div>
      <div class="summary-chip summary-chip-warning">
        <VIcon size="15">tabler-clock-exclamation</VIcon>
        <span>Missing Checkout</span>
        <strong>{{ missingCount }}</strong>
      </div>
      <div class="summary-chip summary-chip-default ml-auto">
        <VIcon size="15">tabler-list</VIcon>
        <span>Total Records</span>
        <strong>{{ attendanceLogs.length }}</strong>
      </div>
    </div>

    <!-- ── Filter card ── -->
    <VCard class="filter-card mb-5">
      <VCardText class="py-4">
        <VRow align="end">
          <VCol cols="12" sm="6" md="4">
            <AppTextField
              v-model="startDate"
              type="date"
              label="From"
              density="compact"
              hide-details
              prepend-inner-icon="tabler-calendar"
            />
          </VCol>
          <VCol cols="12" sm="6" md="4">
            <AppTextField
              v-model="endDate"
              type="date"
              label="To"
              density="compact"
              hide-details
              prepend-inner-icon="tabler-calendar"
            />
          </VCol>
          <VCol cols="12" md="4" class="d-flex gap-2">
            <VBtn
              color="primary"
              block
              :loading="isFetching"
              prepend-icon="tabler-search"
              @click="fetchAttendance"
            >
              Search
            </VBtn>
            <VBtn
              variant="text"
              color="secondary"
              icon
              @click="startDate = ''; endDate = ''"
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
            <h2 class="text-h6 font-weight-bold">Attendance Logs</h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ attendanceLogs.length }} record{{ attendanceLogs.length !== 1 ? 's' : '' }}
            </p>
          </div>
        </div>
      </div>

      <VProgressLinear v-if="isFetching" indeterminate color="primary" height="2" />
      <VDivider />

      <VDataTable
        :items="attendanceLogs"
        :loading="isFetching"
        class="attendance-table"
        hide-default-header
      >
        <template #headers>
          <tr class="table-header-row">
            <th class="text-start pl-6">Employee</th>
            <th class="text-start">Check In</th>
            <th class="text-start">Check Out</th>
            <th class="text-start">Duration</th>
            <th class="text-start">Status</th>
            <th class="text-start">Note</th>
            <th v-if="isHrAdmin" class="text-end pr-6">Actions</th>
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
                    {{ resolveEmployeeName(item) }}
                  </p>
                  <p class="text-caption text-medium-emphasis mb-0">ID {{ item.userId || '—' }}</p>
                </div>
              </div>
            </td>

            <!-- Check In -->
            <td>
              <div v-if="item.checkInAt" class="time-block time-block-in">
                <VIcon size="13" color="success">tabler-login</VIcon>
                <div>
                  <p class="time-val mb-0">{{ fmtTime(item.checkInAt) }}</p>
                  <p class="time-date mb-0">{{ fmtDateTime(item.checkInAt)?.split(',')[0] }}</p>
                </div>
              </div>
              <span v-else class="text-medium-emphasis">—</span>
            </td>

            <!-- Check Out -->
            <td>
              <div v-if="item.checkOutAt" class="time-block time-block-out">
                <VIcon size="13" color="secondary">tabler-logout</VIcon>
                <div>
                  <p class="time-val mb-0">{{ fmtTime(item.checkOutAt) }}</p>
                  <p class="time-date mb-0">{{ fmtDateTime(item.checkOutAt)?.split(',')[0] }}</p>
                </div>
              </div>
              <span v-else class="missing-badge">
                <VIcon size="12">tabler-clock-exclamation</VIcon>
                Missing
              </span>
            </td>

            <!-- Duration -->
            <td>
              <span
                v-if="calcDuration(item.checkInAt, item.checkOutAt)"
                class="duration-badge"
              >
                {{ calcDuration(item.checkInAt, item.checkOutAt) }}
              </span>
              <span v-else class="text-medium-emphasis">—</span>
            </td>

            <!-- Status -->
            <td>
              <VChip
                v-if="item.status"
                size="small"
                variant="tonal"
                class="text-capitalize"
                :color="statusColor(item.status)"
              >
                <template #prepend>
                  <VIcon size="12" class="mr-1">{{ statusIcon(item.status) }}</VIcon>
                </template>
                {{ item.status }}
              </VChip>
              <span v-else class="text-medium-emphasis">—</span>
            </td>

            <!-- Note -->
            <td>
              <span v-if="item.note" class="note-text">{{ item.note }}</span>
              <span v-else class="text-medium-emphasis">—</span>
            </td>

            <!-- Actions -->
            <td v-if="isHrAdmin" class="text-end pr-6">
              <VBtn
                icon
                size="small"
                variant="text"
                color="primary"
                @click="openEdit(item)"
              >
                <VIcon size="17">tabler-pencil</VIcon>
                <VTooltip activator="parent">Edit record</VTooltip>
              </VBtn>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="text-center py-14">
            <VIcon size="52" color="secondary" class="mb-3">tabler-clock-off</VIcon>
            <p class="text-body-1 text-medium-emphasis">No attendance records found</p>
            <p class="text-caption text-disabled">Try adjusting the date range.</p>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- ── Check In / Out Dialog ── -->
    <VDialog v-model="isCheckOpen" max-width="460">
      <VCard class="dialog-card">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div class="d-flex align-center gap-3">
            <div
              class="dialog-icon-wrap"
              :style="{
                background: checkAction === 'check-in'
                  ? 'rgba(var(--v-theme-success), 0.1)'
                  : 'rgba(var(--v-theme-secondary), 0.1)',
              }"
            >
              <VIcon size="20" :color="checkAction === 'check-in' ? 'success' : 'secondary'">
                {{ checkAction === 'check-in' ? 'tabler-login' : 'tabler-logout' }}
              </VIcon>
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold">
                {{ checkAction === 'check-in' ? 'Check In' : 'Check Out' }}
              </h3>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ checkAction === 'check-in' ? 'Record your arrival time.' : 'Record your departure time.' }}
              </p>
            </div>
            <VSpacer />
            <VBtn icon size="small" variant="text" @click="isCheckOpen = false">
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </div>

        <VDivider />

        <VCardText class="pa-6">
          <AppTextarea
            v-model="checkNote"
            label="Note (optional)"
            :placeholder="checkAction === 'check-in' ? 'Working from office…' : 'Leaving early today…'"
            rows="3"
          />
        </VCardText>

        <VDivider />

        <VCardText class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="tonal" color="secondary" @click="isCheckOpen = false">Cancel</VBtn>
          <VBtn
            :color="checkAction === 'check-in' ? 'success' : 'secondary'"
            :loading="isChecking"
            :prepend-icon="checkAction === 'check-in' ? 'tabler-login' : 'tabler-logout'"
            @click="submitCheck"
          >
            {{ checkAction === 'check-in' ? 'Confirm Check In' : 'Confirm Check Out' }}
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- ── Edit Attendance Dialog ── -->
    <VDialog v-model="isEditOpen" max-width="560">
      <VCard class="dialog-card">
        <div class="dialog-header px-6 pt-6 pb-4">
          <div class="d-flex align-center gap-3">
            <div class="dialog-icon-wrap">
              <VIcon size="20" color="primary">tabler-clock-edit</VIcon>
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold">Edit Attendance</h3>
              <p class="text-caption text-medium-emphasis mb-0">
                Manually adjust check-in, check-out, or status.
              </p>
            </div>
            <VSpacer />
            <VBtn icon size="small" variant="text" @click="isEditOpen = false">
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </div>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="editForm.checkInAt"
                type="datetime-local"
                label="Check In"
                prepend-inner-icon="tabler-login"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="editForm.checkOutAt"
                type="datetime-local"
                label="Check Out"
                prepend-inner-icon="tabler-logout"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect
                v-model="editForm.status"
                label="Status"
                prepend-inner-icon="tabler-tag"
                :items="[
                  { title: 'Present',  value: 'present' },
                  { title: 'Absent',   value: 'absent' },
                  { title: 'Late',     value: 'late' },
                ]"
                item-title="title"
                item-value="value"
              />
            </VCol>
            <VCol cols="12">
              <AppTextarea v-model="editForm.note" label="Note" rows="3" />
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardText class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="tonal" color="secondary" @click="isEditOpen = false">Cancel</VBtn>
          <VBtn color="primary" :loading="isSaving" prepend-icon="tabler-check" @click="saveEdit">
            Save Changes
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
.summary-chip-success {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
  border-color: rgba(var(--v-theme-success), 0.2);
}
.summary-chip-secondary {
  background: rgba(var(--v-theme-secondary), 0.1);
  color: rgb(var(--v-theme-secondary));
  border-color: rgba(var(--v-theme-secondary), 0.2);
}
.summary-chip-warning {
  background: rgba(var(--v-theme-warning), 0.1);
  color: rgb(var(--v-theme-warning));
  border-color: rgba(var(--v-theme-warning), 0.2);
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

/* ── Time block ── */
.time-block {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
}
.time-block-in {
  background: rgba(var(--v-theme-success), 0.07);
  border-color: rgba(var(--v-theme-success), 0.15);
}
.time-block-out {
  background: rgba(var(--v-theme-secondary), 0.07);
  border-color: rgba(var(--v-theme-secondary), 0.15);
}
.time-val {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}
.time-date {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  line-height: 1.2;
}

/* ── Missing badge ── */
.missing-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-warning));
  background: rgba(var(--v-theme-warning), 0.08);
  border: 1px solid rgba(var(--v-theme-warning), 0.2);
  padding: 3px 9px;
  border-radius: 999px;
}

/* ── Duration badge ── */
.duration-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-border-color), 0.1);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

/* ── Note text ── */
.note-text {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  max-width: 180px;
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
