<script setup lang="ts">
import AddNewUserDrawer from '@/views/apps/user/list/AddNewUserDrawer.vue'
import type { UserProperties } from '@db/apps/users/types'

definePage({
  meta: {
    action: 'read',
    subject: 'Users',
  },
})

// 👉 Store
const searchQuery = ref('')
const selectedRole = ref()
const selectedPlan = ref()
const selectedStatus = ref()

// Data table options
const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const selectedRows = ref([])
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const router = useRouter()
const isDeleteDialogVisible = ref(false)
const pendingDeleteUserId = ref<number | null>(null)
const userData = useCookie<any>('userData')
const isSuperuser = computed(() => userData.value?.role === 'superuser')

watch(isSuperuser, value => {
  if (!value)
    selectedRole.value = undefined
}, { immediate: true })

// Update data table options
const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

// Headers
const headers = [
  { title: 'User', key: 'user' },
  { title: 'Role', key: 'role' },
  { title: 'Plan', key: 'plan' },
  { title: 'Billing', key: 'billing' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// 👉 Fetching users
const { data: usersData, execute: fetchUsers } = await useApi<any>(createUrl('/users', {
  query: {
    q: searchQuery,
    status: selectedStatus,
    plan: selectedPlan,
    role: selectedRole,
    itemsPerPage,
    page,
    sortBy,
    orderBy,
  },
}))

const users = computed((): UserProperties[] => (usersData.value?.users ?? []).map((u: any) => ({
  ...u,
  currentPlan: u.currentPlan ?? u.plan ?? '',
  billing: u.billing ?? '',
  status: u.status ?? '',
})))
const visibleUsers = computed(() => (isSuperuser.value
  ? users.value.filter(user => ['admin', 'superuser'].includes((user.role || '').toLowerCase()))
  : users.value))
const totalUsers = computed(() => (isSuperuser.value
  ? visibleUsers.value.length
  : (usersData.value?.totalUsers ?? 0)))

// 👉 search filters
const defaultRoles = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' },
  { label: 'Superuser', value: 'superuser' },
]
const defaultPlans = [
  { label: 'Basic', value: 'basic' },
  { label: 'Company', value: 'company' },
  { label: 'Enterprise', value: 'enterprise' },
  { label: 'Team', value: 'team' },
]
const defaultStatuses = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
]

const { data: filtersData } = await useApi<any>('/users/filters')

const normalizeItems = (items: any[]) => items.map(item => ({
  title: item.title ?? item.label ?? item.value,
  value: item.value,
}))

const rawRoles = computed(() => (filtersData.value?.roles?.length ? filtersData.value.roles : defaultRoles))
const rawPlans = computed(() => (filtersData.value?.plans?.length ? filtersData.value.plans : defaultPlans))
const rawStatuses = computed(() => (filtersData.value?.statuses?.length ? filtersData.value.statuses : defaultStatuses))

const roles = computed(() => normalizeItems(isSuperuser.value
  ? rawRoles.value.filter((role: any) => role.value !== 'user')
  : rawRoles.value.filter((role: any) => role.value !== 'superuser')))

const roleEditOptions = [
  { title: 'Admin', value: 'admin' },
  { title: 'Superuser', value: 'superuser' },
]

const plans = computed(() => normalizeItems(rawPlans.value))
const status = computed(() => normalizeItems(rawStatuses.value))

const resolveUserRoleVariant = (role: string) => {
  const roleLowerCase = role.toLowerCase()

  if (roleLowerCase === 'subscriber')
    return { color: 'success', icon: 'tabler-user' }
  if (roleLowerCase === 'author')
    return { color: 'error', icon: 'tabler-device-desktop' }
  if (roleLowerCase === 'maintainer')
    return { color: 'info', icon: 'tabler-chart-pie' }
  if (roleLowerCase === 'editor')
    return { color: 'warning', icon: 'tabler-edit' }
  if (roleLowerCase === 'admin')
    return { color: 'primary', icon: 'tabler-crown' }

  return { color: 'primary', icon: 'tabler-user' }
}

const resolveUserStatusVariant = (stat: string) => {
  const statLowerCase = stat.toLowerCase()
  if (statLowerCase === 'pending')
    return 'warning'
  if (statLowerCase === 'active')
    return 'success'
  if (statLowerCase === 'inactive')
    return 'secondary'

  return 'primary'
}

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const goToEdit = (id: number) => {
  router.push({ name: 'apps-user-view-id', params: { id }, query: { edit: '1' } })
}

const openDeleteDialog = (id: number) => {
  pendingDeleteUserId.value = id
  isDeleteDialogVisible.value = true
}

const isAddNewUserDrawerVisible = ref(false)

// 👉 Add new user
const addNewUser = async (userData: UserProperties) => {
  try {
    const endpoint = userData.role === 'superuser' ? '/users/superusers' : '/users'
    await $api(endpoint, {
      method: 'POST',
      body: userData,
    })

    showSnackbar('User created successfully.')
    fetchUsers()
  }
  catch (error) {
    showSnackbar('Failed to create user.', 'error')
  }
}

const updateUserRole = async (id: number, role: string) => {
  try {
    await $api(`/users/${id}/role`, {
      method: 'PUT',
      body: { role },
    })
    showSnackbar('Role updated successfully.')
    fetchUsers()
  }
  catch (error) {
    showSnackbar('Failed to update role.', 'error')
  }
}

// 👉 Delete user
const deleteUser = async (id: number) => {
  await $api(`/users/${id}`, {
    method: 'DELETE',
  })

  // Delete from selectedRows
  const index = selectedRows.value.findIndex(row => row === id)
  if (index !== -1)
    selectedRows.value.splice(index, 1)

  // refetch User
  // TODO: Make this async
  fetchUsers()
}

const onDeleteConfirm = async (confirmed: boolean) => {
  if (!confirmed || pendingDeleteUserId.value === null)
    return

  await deleteUser(pendingDeleteUserId.value)
  pendingDeleteUserId.value = null
  showSnackbar('User deleted successfully.')
}

const widgetData = ref([
  { title: 'Session', value: '21,459', change: 29, desc: 'Total Users', icon: 'tabler-users', iconColor: 'primary' },
  { title: 'Paid Users', value: '4,567', change: 18, desc: 'Last Week Analytics', icon: 'tabler-user-plus', iconColor: 'error' },
  { title: 'Active Users', value: '19,860', change: -14, desc: 'Last Week Analytics', icon: 'tabler-user-check', iconColor: 'success' },
  { title: 'Pending Users', value: '237', change: 42, desc: 'Last Week Analytics', icon: 'tabler-user-search', iconColor: 'warning' },
])
</script>

<template>
  <section>
    <!-- 👉 Widgets -->
    <div class="d-flex mb-6">
      <VRow>
        <template
          v-for="(data, id) in widgetData"
          :key="id"
        >
          <VCol
            cols="12"
            md="3"
            sm="6"
          >
            <VCard>
              <VCardText>
                <div class="d-flex justify-space-between">
                  <div class="d-flex flex-column gap-y-1">
                    <div class="text-body-1 text-high-emphasis">
                      {{ data.title }}
                    </div>
                    <div class="d-flex gap-x-2 align-center">
                      <h4 class="text-h4">
                        {{ data.value }}
                      </h4>
                      <div
                        class="text-base"
                        :class="data.change > 0 ? 'text-success' : 'text-error'"
                      >
                        ({{ prefixWithPlus(data.change) }}%)
                      </div>
                    </div>
                    <div class="text-sm">
                      {{ data.desc }}
                    </div>
                  </div>
                  <VAvatar
                    :color="data.iconColor"
                    variant="tonal"
                    rounded
                    size="42"
                  >
                    <VIcon
                      :icon="data.icon"
                      size="26"
                    />
                  </VAvatar>
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </template>
      </VRow>
    </div>

    <VCard class="mb-6">
      <VCardItem class="pb-4">
        <VCardTitle>Filters</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <!-- 👉 Select Role -->
          <VCol
            cols="12"
            :sm="isSuperuser ? 4 : 6"
          >
            <AppSelect
              v-model="selectedRole"
              placeholder="Select Role"
              :items="roles"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <!-- 👉 Select Plan -->
          <VCol
            cols="12"
            :sm="isSuperuser ? 4 : 6"
          >
            <AppSelect
              v-model="selectedPlan"
              placeholder="Select Plan"
              :items="plans"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <!-- 👉 Select Status -->
          <VCol
            v-if="isSuperuser"
            cols="12"
            sm="4"
          >
            <AppSelect
              v-model="selectedStatus"
              placeholder="Select Status"
              :items="status"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4">
        <!-- <div class="me-3 d-flex gap-3">
          <AppSelect
            :model-value="itemsPerPage"
            :items="[
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
              { value: -1, title: 'All' },
            ]"
            style="inline-size: 6.25rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
        </div> -->
        <VSpacer />

        <div class="app-user-search-filter d-flex align-center flex-wrap gap-4">
          <!-- 👉 Search  -->
          <div style="inline-size: 15.625rem;">
            <AppTextField
              v-model="searchQuery"
              placeholder="Search User"
            />
          </div>

          <!-- 👉 Export button -->
          <VBtn
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-upload"
          >
            Export
          </VBtn>

          <!-- 👉 Add user button -->
          <VBtn
            prepend-icon="tabler-plus"
            @click="isAddNewUserDrawerVisible = true"
          >
            Add New User
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <!-- SECTION datatable -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:model-value="selectedRows"
        v-model:page="page"
        :items-per-page-options="[
          { value: 20, title: '20' },
          { value: 50, title: '50' },
          { value: 100, title: '100' },
          { value: -1, title: '$vuetify.dataFooter.itemsPerPageAll' },
        ]"
        :items="visibleUsers"
        item-value="id"
        :items-length="totalUsers"
        :headers="headers"
        class="text-no-wrap"
        show-select
        @update:options="updateOptions"
      >
        <!-- User -->
        <template #item.user="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VAvatar
              size="34"
              :variant="!item.avatar ? 'tonal' : undefined"
              :color="!item.avatar ? resolveUserRoleVariant(item.role).color : undefined"
            >
              <VImg
                v-if="item.avatar"
                :src="item.avatar"
              />
              <span v-else>{{ avatarText(item.fullName) }}</span>
            </VAvatar>
            <div class="d-flex flex-column">
              <h6 class="text-base">
                <RouterLink
                  :to="{ name: 'apps-user-view-id', params: { id: item.id } }"
                  class="font-weight-medium text-link"
                >
                  {{ item.fullName }}
                </RouterLink>
              </h6>
              <div class="text-sm">
                {{ item.email }}
              </div>
            </div>
          </div>
        </template>

        <!-- 👉 Role -->
        <template #item.role="{ item }">
          <div class="d-flex align-center gap-x-2">
            <VIcon
              :size="22"
              :icon="resolveUserRoleVariant(item.role).icon"
              :color="resolveUserRoleVariant(item.role).color"
            />

            <div class="text-capitalize text-high-emphasis text-body-1">
              <AppSelect
                v-if="isSuperuser"
                :model-value="item.role"
                density="compact"
                hide-details
                :items="roleEditOptions"
                style="inline-size: 9rem;"
                @update:model-value="updateUserRole(item.id, $event)"
              />
              <span v-else>
                {{ item.role }}
              </span>
            </div>
          </div>
        </template>

        <!-- Plan -->
        <template #item.plan="{ item }">
          <div class="text-body-1 text-high-emphasis text-capitalize">
            {{ item.currentPlan }}
          </div>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <VChip
            :color="resolveUserStatusVariant(item.status)"
            size="small"
            label
            class="text-capitalize"
          >
            {{ item.status }}
          </VChip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <IconBtn @click="openDeleteDialog(item.id)">
            <VIcon icon="tabler-trash" />
          </IconBtn>

          <IconBtn>
            <VIcon icon="tabler-eye" />
          </IconBtn>

          <VBtn
            icon
            variant="text"
            color="medium-emphasis"
          >
            <VIcon icon="tabler-dots-vertical" />
            <VMenu activator="parent">
              <VList>
                <VListItem :to="{ name: 'apps-user-view-id', params: { id: item.id } }">
                  <template #prepend>
                    <VIcon icon="tabler-eye" />
                  </template>

                  <VListItemTitle>View</VListItemTitle>
                </VListItem>

                <VListItem @click="goToEdit(item.id)">
                  <template #prepend>
                    <VIcon icon="tabler-pencil" />
                  </template>
                  <VListItemTitle>Edit</VListItemTitle>
                </VListItem>

                <VListItem @click="openDeleteDialog(item.id)">
                  <template #prepend>
                    <VIcon icon="tabler-trash" />
                  </template>
                  <VListItemTitle>Delete</VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </VBtn>
        </template>

        <!-- pagination -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalUsers"
          />
        </template>
      </VDataTableServer>
      <!-- SECTION -->
    </VCard>
    <!-- 👉 Add New User -->
    <AddNewUserDrawer
      v-model:is-drawer-open="isAddNewUserDrawerVisible"
      @user-data="addNewUser"
    />
    <ConfirmDialog
      v-model:is-dialog-visible="isDeleteDialogVisible"
      confirmation-question="Are you sure you want to delete this user?"
      confirm-title="Deleted!"
      confirm-msg="User has been deleted successfully."
      cancel-title="Cancelled"
      cancel-msg="User deletion cancelled."
      @confirm="onDeleteConfirm"
    />
    <VSnackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarText }}
    </VSnackbar>
  </section>
</template>


