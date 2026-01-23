<script setup lang="ts">
import UserBioPanel from '@/views/apps/user/view/UserBioPanel.vue'
import UserTabAccount from '@/views/apps/user/view/UserTabAccount.vue'
import UserTabBillingsPlans from '@/views/apps/user/view/UserTabBillingsPlans.vue'
import UserTabConnections from '@/views/apps/user/view/UserTabConnections.vue'
import UserTabNotifications from '@/views/apps/user/view/UserTabNotifications.vue'
import UserTabSecurity from '@/views/apps/user/view/UserTabSecurity.vue'

const route = useRoute('apps-user-view-id')

const userTab = ref(null)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')
const isEditOnLoad = computed(() => String(route.query.edit ?? '') === '1')

definePage({
  meta: {
    action: 'read',
    subject: 'Users',
  },
})

const tabs = [
  { icon: 'tabler-users', title: 'Account' },
  { icon: 'tabler-lock', title: 'Security' },
  { icon: 'tabler-bookmark', title: 'Billing & Plan' },
  { icon: 'tabler-bell', title: 'Notifications' },
  { icon: 'tabler-link', title: 'Connections' },
]

const { data: userData } = await useApi<any>(`/users/${route.params.id}`)
const displayUserData = computed(() => {
  const u = userData.value
  if (!u)
    return null

  const fullName = u.fullName ?? u.full_name ?? ''
  const [firstName = '', lastName = ''] = fullName.split(' ')

  return {
    id: u.id,
    fullName,
    firstName,
    lastName,
    company: u.profile?.company ?? '',
    username: u.username ?? '',
    role: u.role ?? '',
    country: u.profile?.country ?? '',
    contact: u.profile?.contact ?? '',
    email: u.email ?? '',
    currentPlan: u.plan ?? '',
    billing: u.billing ?? '',
    status: u.status ?? '',
    avatar: u.avatar ?? '',
    taskDone: u.taskDone ?? 0,
    projectDone: u.projectDone ?? 0,
    taxId: u.taxId ?? '',
    language: u.language ?? 'English',
  }
})

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const updateUser = async (updatedUser: any) => {
  try {
    const payload = {
      fullName: updatedUser.fullName,
      company: updatedUser.company,
      country: updatedUser.country,
      contact: updatedUser.contact,
      status: updatedUser.status,
      plan: updatedUser.currentPlan || undefined,
      billing: updatedUser.billing || userData.value?.billing || undefined,
    }

    const response = await $api(`/users/${route.params.id}`, {
      method: 'PUT',
      body: payload,
    })

    const normalizedResponse = response?.user ?? response
    if (normalizedResponse)
      userData.value = normalizedResponse
    else if (userData.value)
      userData.value = {
        ...userData.value,
        fullName: payload.fullName ?? userData.value.fullName,
        status: payload.status ?? userData.value.status,
        plan: payload.plan ?? userData.value.plan,
        billing: payload.billing ?? userData.value.billing,
        profile: {
          ...(userData.value.profile ?? {}),
          company: payload.company ?? userData.value.profile?.company ?? '',
          country: payload.country ?? userData.value.profile?.country ?? '',
          contact: payload.contact ?? userData.value.profile?.contact ?? '',
        },
      }

    showSnackbar('User updated successfully.')
  }
  catch (error) {
    showSnackbar('Failed to update user.', 'error')
  }
}
</script>

<template>
  <VRow v-if="displayUserData">
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
    <UserBioPanel
      :user-data="displayUserData"
      :open-edit="isEditOnLoad"
      @update-user="updateUser"
    />
    </VCol>

    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VTabs
        v-model="userTab"
        class="v-tabs-pill"
      >
        <VTab
          v-for="tab in tabs"
          :key="tab.icon"
        >
          <VIcon
            :size="18"
            :icon="tab.icon"
            class="me-1"
          />
          <span>{{ tab.title }}</span>
        </VTab>
      </VTabs>

      <VWindow
        v-model="userTab"
        class="mt-6 disable-tab-transition"
        :touch="false"
      >
        <VWindowItem>
          <UserTabAccount />
        </VWindowItem>

        <VWindowItem>
          <UserTabSecurity />
        </VWindowItem>

        <VWindowItem>
          <UserTabBillingsPlans />
        </VWindowItem>

        <VWindowItem>
          <UserTabNotifications />
        </VWindowItem>

        <VWindowItem>
          <UserTabConnections />
        </VWindowItem>
      </VWindow>
    </VCol>
  </VRow>
  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      Invoice with ID  {{ route.params.id }} not found!
    </VAlert>
  </div>

  <VSnackbar
    v-model="snackbar"
    :color="snackbarColor"
    :timeout="3000"
    location="top"
  >
    {{ snackbarText }}
  </VSnackbar>
</template>
