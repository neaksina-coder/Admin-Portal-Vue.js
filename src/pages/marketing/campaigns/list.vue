<script setup lang="ts">
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type CampaignItem = {
  id: number
  businessId: number
  name: string
  targetSegment?: string
  startDate?: string
  endDate?: string
  channel?: string
  created_at?: string
}

const filters = reactive({
  businessId: '',
  targetSegment: '',
})

const businesses = ref<{ title: string; value: number }[]>([])

const itemsPerPage = ref(20)
const page = ref(1)
const sortBy = ref()
const orderBy = ref()
const isCreateDialogOpen = ref(false)
const isSendDialogOpen = ref(false)
const isSubmitting = ref(false)
const isFetching = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const form = reactive({
  businessId: '',
  name: '',
  targetSegment: 'all',
  channel: 'email',
  startDate: '',
  endDate: '',
})

const sendTarget = ref<CampaignItem | null>(null)
const sendForm = reactive({
  subject: '',
  body: '',
})
const router = useRouter()

const normalizeDateTime = (value: string) => {
  if (!value)
    return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return value

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}T00:00:00`
}

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Business', key: 'businessId' },
  { title: 'Segment', key: 'targetSegment' },
  { title: 'Channel', key: 'channel' },
  { title: 'Start', key: 'startDate' },
  { title: 'End', key: 'endDate' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const segmentOptions = [
  { title: 'VIP', value: 'vip' },
  { title: 'Regular', value: 'regular' },
  { title: 'All', value: 'all' },
]

const channelOptions = [
  { title: 'Email', value: 'email' },
  { title: 'SMS', value: 'sms' },
  { title: 'Push', value: 'push' },
]

const updateOptions = (options: any) => {
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
  loadCampaigns()
}

const campaigns = ref<CampaignItem[]>([])
const totalCampaigns = ref(0)

const requestUrl = createUrl('/marketing', {
  query: {
    businessId: computed(() => filters.businessId || undefined),
    targetSegment: computed(() => filters.targetSegment || undefined),
    skip: computed(() => (page.value - 1) * itemsPerPage.value),
    limit: itemsPerPage,
    sortBy,
    orderBy,
  },
})

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

const loadBusinesses = async () => {
  try {
    const response = await $api('/businesses')
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.businesses ?? payload?.results ?? []
    businesses.value = Array.isArray(list)
      ? list.map((item: any) => ({
          title: item.name ?? item.tenantId ?? String(item.id),
          value: Number(item.id),
        }))
      : []
  }
  catch (error) {
    console.error(error)
  }
}

const resetForm = () => {
  form.businessId = ''
  form.name = ''
  form.targetSegment = 'all'
  form.channel = 'email'
  form.startDate = ''
  form.endDate = ''
}

const loadCampaigns = async () => {
  if (!filters.businessId) {
    campaigns.value = []
    totalCampaigns.value = 0
    return
  }

  try {
    isFetching.value = true
    const response = await $api(requestUrl.value)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.campaigns ?? payload?.results ?? []
    campaigns.value = Array.isArray(list) ? list : []
    totalCampaigns.value = payload?.total ?? payload?.count ?? payload?.totalItems ?? campaigns.value.length
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to load campaigns.', 'error')
  }
  finally {
    isFetching.value = false
  }
}

const createCampaign = async () => {
  if (!form.businessId) {
    showSnackbar('Please select a business.', 'error')
    return
  }
  if (!form.name.trim()) {
    showSnackbar('Please enter a campaign name.', 'error')
    return
  }
  if (!form.targetSegment) {
    showSnackbar('Please select a target segment.', 'error')
    return
  }
  if (!form.channel) {
    showSnackbar('Please select a channel.', 'error')
    return
  }

  try {
    isSubmitting.value = true
    await $api('/marketing', {
      method: 'POST',
      body: {
        businessId: Number(form.businessId),
        name: form.name,
        targetSegment: String(form.targetSegment).toLowerCase(),
        channel: String(form.channel).toLowerCase(),
        startDate: normalizeDateTime(form.startDate),
        endDate: normalizeDateTime(form.endDate),
      },
    })
    isCreateDialogOpen.value = false
    resetForm()
    loadCampaigns()
    showSnackbar('Campaign created.')
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to create campaign.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}

const openSendDialog = (item: CampaignItem) => {
  sendTarget.value = item
  sendForm.subject = ''
  sendForm.body = ''
  isSendDialogOpen.value = true
}

const sendCampaign = async () => {
  if (!sendTarget.value)
    return

  if (!sendForm.subject.trim()) {
    showSnackbar('Please enter an email subject.', 'error')
    return
  }
  if (!sendForm.body.trim()) {
    showSnackbar('Please enter an email body.', 'error')
    return
  }

  try {
    isSubmitting.value = true
    const normalizedSegment = String(sendTarget.value.targetSegment || '').toLowerCase()
    const response = await $api(`/marketing/${sendTarget.value.id}/send`, {
      method: 'POST',
      body: {
        subject: sendForm.subject.trim(),
        body: sendForm.body.trim(),
        campaignId: sendTarget.value.id,
        businessId: sendTarget.value.businessId,
        ...(normalizedSegment && normalizedSegment !== 'all'
          ? { targetSegment: normalizedSegment }
          : {}),
        channel: String(sendTarget.value.channel || '').toLowerCase(),
      },
    })
    const payload = response?.data ? response : response ?? {}
    const sentCount = payload?.data?.sent ?? payload?.sent
    if (Number(sentCount) > 0) {
      showSnackbar(`Campaign email sent (${sentCount}).`)
      router.push({ name: 'marketing-logs', query: { campaignId: sendTarget.value.id } })
    }
    else {
      showSnackbar('Send succeeded but 0 recipients. Check segment or customers.', 'error')
    }
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to send campaign.', 'error')
  }
  finally {
    isSubmitting.value = false
    isSendDialogOpen.value = false
    sendTarget.value = null
    sendForm.subject = ''  // ✅ Clear AFTER sending
    sendForm.body = ''     // ✅ Clear AFTER sending
  }
}

const resolveBusinessName = (businessId: number) => {
  const match = businesses.value.find(item => item.value === businessId)
  return match?.title ?? businessId
}

onMounted(() => {
  loadBusinesses()
})
</script>

<template>
  <section>
    <VCard class="mb-6">
      <VCardItem>
        <VCardTitle>Marketing Campaigns</VCardTitle>
      </VCardItem>

      <VCardText>
        <VRow>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="filters.businessId"
              :items="businesses"
              label="Business"
              placeholder="Select business"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
          <VCol cols="12" sm="6">
            <AppSelect
              v-model="filters.targetSegment"
              :items="segmentOptions"
              label="Target Segment"
              clearable
              clear-icon="tabler-x"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardText class="d-flex flex-wrap gap-4 align-center">
        <VBtn color="primary" @click="loadCampaigns()">
          Search
        </VBtn>
        <VBtn color="primary" variant="tonal" @click="isCreateDialogOpen = true">
          Create Campaign
        </VBtn>
        <VSpacer />
        <VBtn
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="isFetching"
          @click="loadCampaigns()"
        >
          Refresh
        </VBtn>
      </VCardText>

      <VDivider />

      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items-per-page-options="[
          { value: 20, title: '20' },
          { value: 50, title: '50' },
          { value: 100, title: '100' },
        ]"
        :items="campaigns"
        :items-length="totalCampaigns"
        :headers="headers"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.businessId="{ item }">
          <span>{{ resolveBusinessName(item.businessId) }}</span>
        </template>
        <template #item.startDate="{ item }">
          <span>{{ item.startDate ? formatDate(item.startDate) : '-' }}</span>
        </template>
        <template #item.endDate="{ item }">
          <span>{{ item.endDate ? formatDate(item.endDate) : '-' }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <IconBtn @click="openSendDialog(item)">
              <VIcon icon="tabler-send" />
            </IconBtn>
            <IconBtn :to="{ name: 'marketing-logs', query: { campaignId: item.id } }">
              <VIcon icon="tabler-clipboard-list" />
            </IconBtn>
          </div>
        </template>
      </VDataTableServer>
    </VCard>

    <VDialog v-model="isCreateDialogOpen" max-width="680">
      <VCard>
        <VCardItem>
          <VCardTitle>Create Campaign</VCardTitle>
        </VCardItem>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <AppSelect v-model="form.businessId" :items="businesses" label="Business" />
            </VCol>
            <VCol cols="12" md="6">
              <AppTextField v-model="form.name" label="Campaign Name" placeholder="Spring Promo" />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect v-model="form.targetSegment" :items="segmentOptions" label="Target Segment" />
            </VCol>
            <VCol cols="12" md="6">
              <AppSelect v-model="form.channel" :items="channelOptions" label="Channel" />
            </VCol>
            <VCol cols="12" md="6">
              <AppDateTimePicker v-model="form.startDate" label="Start Date" placeholder="Start date" />
            </VCol>
            <VCol cols="12" md="6">
              <AppDateTimePicker v-model="form.endDate" label="End Date" placeholder="End date" />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" @click="isCreateDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="isSubmitting" @click="createCampaign">
            Create
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

    <VDialog v-model="isSendDialogOpen" max-width="420">
      <VCard>
        <VCardItem>
          <VCardTitle>Send Campaign</VCardTitle>
        </VCardItem>
        <VCardText>
          Send emails for <strong>{{ sendTarget?.name }}</strong>?
          <VRow class="mt-4">
            <VCol cols="12">
              <AppTextField
                v-model="sendForm.subject"
                label="Email Subject"
                placeholder="Happy Chinese New Year 🎉"
              />
            </VCol>
            <VCol cols="12">
              <AppTextarea
                v-model="sendForm.body"
                label="Email Body"
                placeholder="Write your message here..."
                rows="6"
              />
            </VCol>
          </VRow>
        </VCardText>
        <VCardText class="d-flex justify-end gap-3">
          <VBtn variant="tonal" color="secondary" @click="isSendDialogOpen = false">
            Cancel
          </VBtn>
          <VBtn color="primary" :loading="isSubmitting" @click="sendCampaign">
            Send
          </VBtn>
        </VCardText>
      </VCard>
    </VDialog>

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
