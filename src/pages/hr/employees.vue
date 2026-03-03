<script setup lang="ts">
definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type HrEmployee = {
  id: number
  fullName: string
  email: string
  phone?: string
  employeeId?: string
  department?: string
  status?: string
  isActive?: boolean
}

const userData = useCookie<any>('userData')
const role = computed(() => String(userData.value?.role || '').toLowerCase())
const isSuperuser = computed(() => role.value === 'superuser')
const isHrAdmin = computed(() => ['customer_owner', 'hr_admin'].includes(role.value))
const isEmployee = computed(() => role.value === 'employee')
const canListEmployees = computed(() => isSuperuser.value || isHrAdmin.value)

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

const search = ref('')

const normalizeEmployee = (item: any): HrEmployee => ({
  id: Number(item?.id ?? item?.userId ?? item?.user_id ?? 0),
  fullName: String(item?.fullName ?? item?.name ?? item?.full_name ?? 'Unknown'),
  email: String(item?.email ?? ''),
  phone: item?.phone ?? item?.phoneNumber ?? item?.phone_number ?? '',
  employeeId: item?.employeeId ?? item?.employee_id ?? '',
  department: item?.department ?? '',
  status: item?.status ?? (item?.is_active === false ? 'inactive' : 'active'),
  isActive: item?.isActive ?? item?.is_active ?? true,
})

const employeesData = ref<any>(null)
const pendingData = ref<any>(null)
const isFetchingEmployees = ref(false)
const isFetchingPending = ref(false)
let fetchEmployees = async () => {}
let fetchPending = async () => {}

if (canListEmployees.value && businessId.value) {
  const employeesApi = await useApi<any>(createUrl('/hr/employees', {
    query: {
      businessId: computed(() => businessId.value || undefined),
      q: search,
    },
  }))
  employeesData.value = employeesApi.data.value
  fetchEmployees = employeesApi.execute
  isFetchingEmployees.value = employeesApi.isFetching.value
  watch(employeesApi.data, value => { employeesData.value = value })
  watch(employeesApi.isFetching, value => { isFetchingEmployees.value = value })
}

if (canListEmployees.value && businessId.value) {
  const pendingApi = await useApi<any>(createUrl('/hr/employees/pending', {
    query: {
      businessId: computed(() => businessId.value || undefined),
    },
  }))
  pendingData.value = pendingApi.data.value
  fetchPending = pendingApi.execute
  isFetchingPending.value = pendingApi.isFetching.value
  watch(pendingApi.data, value => { pendingData.value = value })
  watch(pendingApi.isFetching, value => { isFetchingPending.value = value })
}

const selfEmployeeData = ref<any>(null)
let fetchSelfEmployee = async () => {}
if (isEmployee.value && userData.value?.id) {
  const selfApi = await useApi<any>(`/hr/employees/${userData.value.id}`)
  selfEmployeeData.value = selfApi.data.value
  fetchSelfEmployee = selfApi.execute
  watch(selfApi.data, value => { selfEmployeeData.value = value })
}

const employees = computed(() => {
  const payload = employeesData.value
  const list = payload?.data ?? payload?.items ?? payload?.employees ?? payload?.results ?? []
  return Array.isArray(list) ? list.map(normalizeEmployee).filter(item => item.id) : []
})

const pendingEmployees = computed(() => {
  const payload = pendingData.value
  const list = payload?.data ?? payload?.items ?? payload?.employees ?? payload?.results ?? []
  return Array.isArray(list) ? list.map(normalizeEmployee).filter(item => item.id) : []
})

const selfEmployee = computed(() => {
  const payload = selfEmployeeData.value
  const data = payload?.data ?? payload?.employee ?? payload
  return data ? normalizeEmployee(data) : null
})

const filteredEmployees = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q)
    return employees.value
  return employees.value.filter(item =>
    [item.fullName, item.email, item.employeeId, item.department].some(value =>
      String(value || '').toLowerCase().includes(q),
    ),
  )
})

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

const isFormOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const form = reactive({
  id: null as number | null,
  fullName: '',
  email: '',
  phone: '',
  employeeId: '',
  department: '',
  password: '',
})

const resetForm = () => {
  form.id = null
  form.fullName = ''
  form.email = ''
  form.phone = ''
  form.employeeId = ''
  form.department = ''
  form.password = ''
}

const openCreate = () => {
  resetForm()
  formMode.value = 'create'
  isFormOpen.value = true
}

const openEdit = (item: HrEmployee) => {
  form.id = item.id
  form.fullName = item.fullName
  form.email = item.email
  form.phone = item.phone || ''
  form.employeeId = item.employeeId || ''
  form.department = item.department || ''
  form.password = ''
  formMode.value = 'edit'
  isFormOpen.value = true
}

const isSaving = ref(false)

const saveEmployee = async () => {
  if (!form.fullName.trim() || !form.email.trim()) {
    showSnackbar('Please provide full name and email.', 'error')
    return
  }
  try {
    isSaving.value = true
    const payload = {
      businessId: businessId.value || undefined,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      employeeId: form.employeeId.trim() || undefined,
      department: form.department.trim() || undefined,
      ...(form.password.trim() ? { password: form.password.trim() } : {}),
    }
    if (formMode.value === 'create') {
      await $api('/hr/employees/', { method: 'POST', body: payload })
      showSnackbar('Employee created successfully.')
    }
    else if (form.id) {
      await $api(`/hr/employees/${form.id}`, { method: 'PUT', body: payload })
      showSnackbar('Employee updated successfully.')
    }
    isFormOpen.value = false
    resetForm()
    fetchEmployees()
  }
  catch {
    showSnackbar('Failed to save employee.', 'error')
  }
  finally {
    isSaving.value = false
  }
}

const approveEmployee = async (id: number) => {
  try {
    await $api(`/hr/employees/${id}/approve`, { method: 'POST' })
    showSnackbar('Employee approved.')
    fetchPending()
    fetchEmployees()
  }
  catch {
    showSnackbar('Failed to approve employee.', 'error')
  }
}

const deactivateEmployee = async (id: number) => {
  try {
    await $api(`/hr/employees/${id}/deactivate`, { method: 'POST' })
    showSnackbar('Employee deactivated.')
    fetchEmployees()
  }
  catch {
    showSnackbar('Failed to deactivate employee.', 'error')
  }
}

// Avatar initials helper
const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

// Avatar color based on name
const avatarColors = ['teal', 'primary', 'secondary', 'warning', 'error', 'info', 'success']
const getAvatarColor = (name: string) =>
  avatarColors[name.charCodeAt(0) % avatarColors.length]
</script>

<template>
  <section class="employee-page">
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
          Employees
        </h1>
      </div>
      <VBtn
        v-if="(isHrAdmin || isSuperuser) && canListEmployees"
        color="primary"
        prepend-icon="tabler-plus"
        @click="openCreate"
      >
        Add Employee
      </VBtn>
    </div>

    <!-- ── My Profile (employee self-view) ── -->
    <VCard v-if="isEmployee && selfEmployee" class="profile-card mb-6">
      <VCardText class="pa-6">
        <div class="d-flex align-center gap-4 mb-6">
          <VAvatar size="64" :color="getAvatarColor(selfEmployee.fullName)" class="avatar-initials">
            <span class="text-h5 font-weight-bold">{{ getInitials(selfEmployee.fullName) }}</span>
          </VAvatar>
          <div>
            <p class="text-overline text-medium-emphasis mb-0" style="letter-spacing:0.1em">
              My Profile
            </p>
            <h2 class="text-h5 font-weight-bold mb-1">
              {{ selfEmployee.fullName }}
            </h2>
            <VChip
              size="x-small"
              :color="selfEmployee.isActive ? 'success' : 'secondary'"
              variant="tonal"
              class="text-capitalize"
            >
              <template #prepend>
                <span
                  class="status-dot mr-1"
                  :style="{ background: selfEmployee.isActive ? 'rgb(var(--v-theme-success))' : 'rgb(var(--v-theme-secondary))' }"
                />
              </template>
              {{ selfEmployee.isActive ? 'Active' : 'Inactive' }}
            </VChip>
          </div>
        </div>

        <VRow>
          <VCol cols="12" md="4">
            <div class="profile-field">
              <div class="profile-field-icon">
                <VIcon size="16" color="primary">tabler-mail</VIcon>
              </div>
              <div>
                <p class="profile-field-label">Email</p>
                <p class="profile-field-value">{{ selfEmployee.email }}</p>
              </div>
            </div>
          </VCol>
          <VCol cols="12" md="4">
            <div class="profile-field">
              <div class="profile-field-icon">
                <VIcon size="16" color="primary">tabler-phone</VIcon>
              </div>
              <div>
                <p class="profile-field-label">Phone</p>
                <p class="profile-field-value">{{ selfEmployee.phone || '—' }}</p>
              </div>
            </div>
          </VCol>
          <VCol cols="12" md="4">
            <div class="profile-field">
              <div class="profile-field-icon">
                <VIcon size="16" color="primary">tabler-building</VIcon>
              </div>
              <div>
                <p class="profile-field-label">Department</p>
                <p class="profile-field-value">{{ selfEmployee.department || '—' }}</p>
              </div>
            </div>
          </VCol>
          <VCol cols="12" md="4">
            <div class="profile-field">
              <div class="profile-field-icon">
                <VIcon size="16" color="primary">tabler-id</VIcon>
              </div>
              <div>
                <p class="profile-field-label">Employee ID</p>
                <p class="profile-field-value">{{ selfEmployee.employeeId || '—' }}</p>
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- ── Employee Directory ── -->
    <VCard v-if="canListEmployees" class="directory-card mb-6">
      <!-- Card header -->
      <div class="card-header px-6 pt-5 pb-4">
        <div class="d-flex align-center justify-space-between flex-wrap gap-3">
          <div>
            <h2 class="text-h6 font-weight-bold">
              Employee Directory
            </h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ filteredEmployees.length }} employee{{ filteredEmployees.length !== 1 ? 's' : '' }} found
            </p>
          </div>
          <div style="min-width:260px">
            <AppTextField
              v-model="search"
              placeholder="Search name, email, department…"
              prepend-inner-icon="tabler-search"
              density="compact"
              hide-details
            />
          </div>
        </div>
      </div>

      <VProgressLinear v-if="isFetchingEmployees" indeterminate color="primary" height="2" />
      <VDivider />

      <!-- Table -->
      <VDataTable
        :items="filteredEmployees"
        :loading="isFetchingEmployees"
        class="employee-table"
        hide-default-header
      >
        <template #headers>
          <tr class="table-header-row">
            <th class="text-start pl-6">Employee</th>
            <th class="text-start">Department</th>
            <th class="text-start">Employee ID</th>
            <th class="text-start">Status</th>
            <th v-if="isHrAdmin || isSuperuser" class="text-end pr-6">
              Actions
            </th>
          </tr>
        </template>

        <template #item="{ item }">
          <tr class="table-row">
            <!-- Name + email -->
            <td class="pl-6 py-3">
              <div class="d-flex align-center gap-3">
                <VAvatar size="38" :color="getAvatarColor(item.fullName)" class="avatar-initials">
                  <span class="text-caption font-weight-bold">{{ getInitials(item.fullName) }}</span>
                </VAvatar>
                <div>
                  <p class="font-weight-semibold mb-0" style="line-height:1.3">{{ item.fullName }}</p>
                  <p class="text-caption text-medium-emphasis mb-0">{{ item.email }}</p>
                </div>
              </div>
            </td>
            <td>
              <span v-if="item.department" class="dept-badge">{{ item.department }}</span>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            <td>
              <code v-if="item.employeeId" class="emp-id-code">{{ item.employeeId }}</code>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            <td>
              <VChip
                size="small"
                :color="item.isActive ? 'success' : 'secondary'"
                variant="tonal"
                class="text-capitalize"
              >
                <template #prepend>
                  <span
                    class="status-dot mr-1"
                    :style="{ background: item.isActive ? 'rgb(var(--v-theme-success))' : 'rgb(var(--v-theme-secondary))' }"
                  />
                </template>
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </VChip>
            </td>
            <td v-if="isHrAdmin || isSuperuser" class="text-end pr-6">
              <div class="d-flex align-center justify-end gap-1">
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  color="primary"
                  @click="openEdit(item)"
                >
                  <VIcon size="17">tabler-pencil</VIcon>
                  <VTooltip activator="parent">Edit</VTooltip>
                </VBtn>
                <VBtn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="deactivateEmployee(item.id)"
                >
                  <VIcon size="17">tabler-user-off</VIcon>
                  <VTooltip activator="parent">Deactivate</VTooltip>
                </VBtn>
              </div>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="text-center py-12">
            <VIcon size="48" color="secondary" class="mb-3">tabler-users-off</VIcon>
            <p class="text-body-1 text-medium-emphasis">No employees found</p>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- ── Pending Approvals ── -->
    <VCard v-if="canListEmployees" class="pending-card">
      <div class="card-header px-6 pt-5 pb-4">
        <div class="d-flex align-center gap-3">
          <div class="pending-icon-wrap">
            <VIcon size="18" color="warning">tabler-clock-hour-4</VIcon>
          </div>
          <div>
            <h2 class="text-h6 font-weight-bold">
              Pending Approvals
            </h2>
            <p class="text-caption text-medium-emphasis mb-0">
              {{ pendingEmployees.length }} awaiting review
            </p>
          </div>
          <VSpacer />
          <VChip
            v-if="pendingEmployees.length"
            color="warning"
            variant="tonal"
            size="small"
          >
            {{ pendingEmployees.length }} pending
          </VChip>
        </div>
      </div>

      <VProgressLinear v-if="isFetchingPending" indeterminate color="warning" height="2" />
      <VDivider />

      <VDataTable
        :items="pendingEmployees"
        :loading="isFetchingPending"
        class="employee-table"
        hide-default-header
      >
        <template #headers>
          <tr class="table-header-row">
            <th class="text-start pl-6">Employee</th>
            <th class="text-start">Department</th>
            <th class="text-start">Employee ID</th>
            <th class="text-end pr-6">Actions</th>
          </tr>
        </template>

        <template #item="{ item }">
          <tr class="table-row">
            <td class="pl-6 py-3">
              <div class="d-flex align-center gap-3">
                <VAvatar size="38" :color="getAvatarColor(item.fullName)" variant="tonal" class="avatar-initials">
                  <span class="text-caption font-weight-bold">{{ getInitials(item.fullName) }}</span>
                </VAvatar>
                <div>
                  <p class="font-weight-semibold mb-0" style="line-height:1.3">{{ item.fullName }}</p>
                  <p class="text-caption text-medium-emphasis mb-0">{{ item.email }}</p>
                </div>
              </div>
            </td>
            <td>
              <span v-if="item.department" class="dept-badge">{{ item.department }}</span>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            <td>
              <code v-if="item.employeeId" class="emp-id-code">{{ item.employeeId }}</code>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            <td class="text-end pr-6">
              <VBtn
                size="small"
                color="success"
                variant="tonal"
                prepend-icon="tabler-check"
                @click="approveEmployee(item.id)"
              >
                Approve
              </VBtn>
            </td>
          </tr>
        </template>

        <template #no-data>
          <div class="text-center py-10">
            <VIcon size="40" color="success" class="mb-2">tabler-circle-check</VIcon>
            <p class="text-body-2 text-medium-emphasis">No pending approvals</p>
          </div>
        </template>
      </VDataTable>
    </VCard>

    <!-- ── Add / Edit Dialog ── -->
    <VDialog v-model="isFormOpen" max-width="600">
      <VCard class="dialog-card">
        <!-- Dialog header -->
        <div class="dialog-header px-6 pt-6 pb-4">
          <div class="d-flex align-center gap-3">
            <div class="dialog-icon-wrap">
              <VIcon size="20" color="primary">
                {{ formMode === 'create' ? 'tabler-user-plus' : 'tabler-user-edit' }}
              </VIcon>
            </div>
            <div>
              <h3 class="text-h6 font-weight-bold">
                {{ formMode === 'create' ? 'Add Employee' : 'Edit Employee' }}
              </h3>
              <p class="text-caption text-medium-emphasis mb-0">
                {{ formMode === 'create' ? 'Fill in details to register a new employee.' : 'Update the employee information.' }}
              </p>
            </div>
            <VSpacer />
            <VBtn icon size="small" variant="text" @click="isFormOpen = false">
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </div>

        <VDivider />

        <VCardText class="pa-6">
          <VRow>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.fullName"
                label="Full Name"
                placeholder="John Doe"
                prepend-inner-icon="tabler-user"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.email"
                label="Email"
                placeholder="john@company.com"
                prepend-inner-icon="tabler-mail"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.phone"
                label="Phone"
                placeholder="+855..."
                prepend-inner-icon="tabler-phone"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.employeeId"
                label="Employee ID"
                placeholder="EMP-001"
                prepend-inner-icon="tabler-id"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.department"
                label="Department"
                placeholder="HR, Engineering…"
                prepend-inner-icon="tabler-building"
              />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField
                v-model="form.password"
                label="Password"
                type="password"
                placeholder="Optional"
                prepend-inner-icon="tabler-lock"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardText class="d-flex justify-end gap-3 pa-4">
          <VBtn variant="tonal" color="secondary" @click="isFormOpen = false">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="isSaving" prepend-icon="tabler-check" @click="saveEmployee">
            {{ formMode === 'create' ? 'Create Employee' : 'Save Changes' }}
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
/* ── Status dot ── */
.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Profile card ── */
.profile-card {
  border-radius: 14px !important;
  border: 1px solid rgba(var(--v-border-color), 0.08) !important;
}

.avatar-initials {
  font-size: 14px;
  flex-shrink: 0;
}

.profile-field {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-border-color), 0.07);
}

.profile-field-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.profile-field-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(var(--v-theme-on-surface), 0.45);
  margin-bottom: 2px;
}

.profile-field-value {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 0;
}

/* ── Directory / Pending Cards ── */
.directory-card,
.pending-card {
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

.table-row {
  transition: background 0.15s;
}
.table-row:hover {
  background: rgba(var(--v-theme-primary), 0.04) !important;
}
.table-row td {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05) !important;
  font-size: 13.5px;
}

/* ── Department badge ── */
.dept-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  border: 1px solid rgba(var(--v-theme-primary), 0.15);
}

/* ── Employee ID code ── */
.emp-id-code {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-border-color), 0.1);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

/* ── Pending icon wrap ── */
.pending-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(var(--v-theme-warning), 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Dialog card ── */
.dialog-card {
  border-radius: 16px !important;
}

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
