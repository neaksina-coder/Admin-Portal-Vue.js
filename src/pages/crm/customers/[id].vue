<script setup lang="ts">
import { VForm } from 'vuetify/components/VForm'
import { requiredValidator, emailValidator } from '@core/utils/validators'
import { formatDate } from '@core/utils/formatters'

definePage({
  meta: {
    action: 'read',
    subject: 'Apps',
  },
})

type CustomerDetail = {
  id: number
  businessId: number
  name: string
  email: string
  phone?: string | null
  segment?: string
  notes?: string | null
  churnRiskScore?: number
  lifetimeValue?: number
  nextBestProduct?: string | null
  created_at?: string
  updated_at?: string
}

type ContactHistoryItem = {
  id: number
  businessId: number
  customerId: number
  channel: string
  summary: string
  contactedAt?: string
  created_at?: string
}

const route = useRoute('crm-customers-id')
const refVForm = ref<VForm>()

const businesses = ref<{ title: string; value: number }[]>([])
const isSubmitting = ref(false)
const isFetching = ref(false)
const isFetchingContacts = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const customer = ref<CustomerDetail | null>(null)
const contacts = ref<ContactHistoryItem[]>([])

const editForm = reactive({
  businessId: '',
  name: '',
  email: '',
  phone: '',
  segment: 'regular',
  notes: '',
})

const contactForm = reactive({
  channel: 'email',
  summary: '',
  contactedAt: '',
})

const segmentOptions = [
  { title: 'VIP', value: 'vip' },
  { title: 'Regular', value: 'regular' },
  { title: 'New', value: 'new' },
]

const channelOptions = [
  { title: 'Email', value: 'email' },
  { title: 'Phone', value: 'phone' },
  { title: 'SMS', value: 'sms' },
  { title: 'Meeting', value: 'meeting' },
]

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

const loadCustomer = async () => {
  try {
    isFetching.value = true
    const response = await $api(`/customers/${route.params.id}`)
    const payload = response?.data ? response : response ?? {}
    customer.value = payload?.data ?? payload ?? null
    if (customer.value) {
      editForm.businessId = String(customer.value.businessId)
      editForm.name = customer.value.name
      editForm.email = customer.value.email
      editForm.phone = customer.value.phone ?? ''
      editForm.segment = customer.value.segment ?? 'regular'
      editForm.notes = customer.value.notes ?? ''
    }
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to load customer.', 'error')
  }
  finally {
    isFetching.value = false
  }
}

const loadContacts = async () => {
  try {
    isFetchingContacts.value = true
    const response = await $api(`/customers/${route.params.id}/contacts`)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.contacts ?? payload?.results ?? []
    contacts.value = Array.isArray(list) ? list : []
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to load contact history.', 'error')
  }
  finally {
    isFetchingContacts.value = false
  }
}

const updateCustomer = async () => {
  try {
    isSubmitting.value = true
    await $api(`/customers/${route.params.id}`, {
      method: 'PUT',
      body: {
        businessId: Number(editForm.businessId),
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || undefined,
        segment: editForm.segment,
        notes: editForm.notes || undefined,
      },
    })
    showSnackbar('Customer updated.')
    loadCustomer()
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to update customer.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}

const addContactHistory = async () => {
  try {
    isSubmitting.value = true
    await $api(`/customers/${route.params.id}/contacts`, {
      method: 'POST',
      body: {
        channel: contactForm.channel,
        summary: contactForm.summary,
        contactedAt: contactForm.contactedAt || undefined,
      },
    })
    contactForm.channel = 'email'
    contactForm.summary = ''
    contactForm.contactedAt = ''
    showSnackbar('Contact history added.')
    loadContacts()
  }
  catch (error) {
    console.error(error)
    showSnackbar('Failed to add contact history.', 'error')
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  loadBusinesses()
  loadCustomer()
  loadContacts()
})
</script>

<template>
  <section>
    <VRow>
      <VCol cols="12" md="8">
        <VCard class="mb-6">
          <VCardItem>
            <VCardTitle>Customer Detail</VCardTitle>
          </VCardItem>
          <VCardText v-if="customer">
            <VRow>
              <VCol cols="12" md="6">
                <div class="text-body-1 text-high-emphasis">Churn Risk</div>
                <div>{{ customer.churnRiskScore ?? '-' }}</div>
              </VCol>
              <VCol cols="12" md="6">
                <div class="text-body-1 text-high-emphasis">Lifetime Value</div>
                <div>{{ customer.lifetimeValue ?? '-' }}</div>
              </VCol>
              <VCol cols="12" md="6">
                <div class="text-body-1 text-high-emphasis">Next Best Product</div>
                <div>{{ customer.nextBestProduct ?? '-' }}</div>
              </VCol>
              <VCol cols="12" md="6">
                <div class="text-body-1 text-high-emphasis">Created</div>
                <div>{{ customer.created_at ? formatDate(customer.created_at) : '-' }}</div>
              </VCol>
            </VRow>
          </VCardText>
          <VCardText v-else>
            <VAlert type="info" variant="tonal">
              Customer not found.
            </VAlert>
          </VCardText>
        </VCard>

        <VCard>
          <VCardItem>
            <VCardTitle>Edit Customer</VCardTitle>
          </VCardItem>
          <VCardText>
            <VForm ref="refVForm">
              <VRow>
                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="editForm.businessId"
                    :items="businesses"
                    label="Business"
                    :rules="[requiredValidator]"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppSelect
                    v-model="editForm.segment"
                    :items="segmentOptions"
                    label="Segment"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppTextField
                    v-model="editForm.name"
                    :rules="[requiredValidator]"
                    label="Name"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppTextField
                    v-model="editForm.email"
                    :rules="[requiredValidator, emailValidator]"
                    label="Email"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <AppTextField
                    v-model="editForm.phone"
                    label="Phone"
                  />
                </VCol>
                <VCol cols="12">
                  <AppTextarea
                    v-model="editForm.notes"
                    label="Notes"
                    rows="4"
                  />
                </VCol>
                <VCol cols="12">
                  <VBtn :loading="isSubmitting" @click="updateCustomer">
                    Save Changes
                  </VBtn>
                </VCol>
              </VRow>
            </VForm>
          </VCardText>
        </VCard>
      </VCol>

      <VCol cols="12" md="4">
        <VCard class="mb-6">
          <VCardItem>
            <VCardTitle>Add Contact History</VCardTitle>
          </VCardItem>
          <VCardText>
            <VRow>
              <VCol cols="12">
                <AppSelect
                  v-model="contactForm.channel"
                  :items="channelOptions"
                  label="Channel"
                />
              </VCol>
              <VCol cols="12">
                <AppTextarea
                  v-model="contactForm.summary"
                  label="Summary"
                  rows="4"
                />
              </VCol>
              <VCol cols="12">
                <AppDateTimePicker
                  v-model="contactForm.contactedAt"
                  label="Contacted At"
                  placeholder="Optional"
                  clearable
                />
              </VCol>
              <VCol cols="12">
                <VBtn :loading="isSubmitting" @click="addContactHistory">
                  Add Contact
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>

        <VCard>
          <VCardItem>
            <VCardTitle>Contact History</VCardTitle>
          </VCardItem>
          <VCardText>
            <VList density="compact">
              <VListItem
                v-for="item in contacts"
                :key="item.id"
              >
                <VListItemTitle>{{ item.summary }}</VListItemTitle>
                <VListItemSubtitle>
                  {{ item.channel }} · {{ item.contactedAt ? formatDate(item.contactedAt) : '-' }}
                </VListItemSubtitle>
              </VListItem>
              <VListItem v-if="!contacts.length">
                <VListItemTitle>No contact history yet.</VListItemTitle>
              </VListItem>
            </VList>
          </VCardText>
          <VCardText class="d-flex justify-end">
            <VBtn
              variant="tonal"
              color="secondary"
              prepend-icon="tabler-refresh"
              :loading="isFetchingContacts"
              @click="loadContacts"
            >
              Refresh
            </VBtn>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

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
