<script lang="ts" setup>
import { computed, ref } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useChat } from './useChat'
import { useChatStore } from '@/views/apps/chat/useChatStore'

defineEmits<{
  (e: 'close'): void
}>()

const store = useChatStore()
const contactMeta = computed(() => {
  const id = store.activeChat?.contact?.id
  if (!id)
    return store.activeChat?.contact as any

  return (store.chatsContacts.find(c => c.id === id) ?? store.activeChat?.contact) as any
})
const visitorMeta = computed(() => contactMeta.value?.visitor ?? {})
const isDeleteDialogOpen = ref(false)

const openDeleteDialog = () => {
  if (!store.activeChat?.contact.id)
    return
  isDeleteDialogOpen.value = true
}

const confirmDelete = async () => {
  if (!store.activeChat?.contact.id)
    return

  isDeleteDialogOpen.value = false
  await store.deleteConversation(Number(store.activeChat.contact.id))
}

const { resolveAvatarBadgeVariant } = useChat()
</script>

<template>
  <template v-if="store.activeChat">
    <!-- Close Button -->
    <div
      class="pt-6 px-6"
      :class="$vuetify.locale.isRtl ? 'text-left' : 'text-right'"
    >
      <IconBtn @click="$emit('close')">
        <VIcon
          icon="tabler-x"
          class="text-medium-emphasis"
        />
      </IconBtn>
    </div>

    <!-- User Avatar + Name + Role -->
    <div class="text-center px-6">
      <VBadge
        location="bottom right"
        offset-x="7"
        offset-y="4"
        bordered
        :color="resolveAvatarBadgeVariant(store.activeChat.contact.status)"
        class="chat-user-profile-badge mb-5"
      >
        <VAvatar
          size="84"
          :variant="!store.activeChat.contact.avatar ? 'tonal' : undefined"
          :color="!store.activeChat.contact.avatar ? resolveAvatarBadgeVariant(store.activeChat.contact.status) : undefined"
        >
          <VImg
            v-if="store.activeChat.contact.avatar"
            :src="store.activeChat.contact.avatar"
          />
          <span
            v-else
            class="text-3xl"
          >{{ avatarText(store.activeChat.contact.fullName) }}</span>
        </VAvatar>
      </VBadge>
      <h5 class="text-h5">
        {{ store.activeChat.contact.fullName }}
      </h5>
      <p class="text-capitalize text-body-1 mb-0">
        {{ store.activeChat.contact.role }}
      </p>
    </div>

    <!-- User Data -->
    <PerfectScrollbar
      class="ps-chat-user-profile-sidebar-content text-medium-emphasis pb-6 px-6"
      :options="{ wheelPropagation: false }"
    >
      <!-- About -->
      <div class="my-6">
        <div class="text-sm text-disabled">
          ABOUT
        </div>
        <p class="mt-1 mb-6">
          {{ store.activeChat.contact.about }}
        </p>
      </div>

      <!-- Personal Information -->
      <div class="mb-6">
        <div class="text-sm text-disabled mb-1">
          PERSONAL INFORMATION
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-mail"
            size="22"
          />
          <div class="text-base">
            {{ visitorMeta?.email || contactMeta?.email || 'Not provided' }}
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-phone"
            size="22"
          />
          <div class="text-base">
            {{ visitorMeta?.phone || contactMeta?.phone || 'Not provided' }}
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-world"
            size="22"
          />
          <div class="text-base text-truncate">
            {{ visitorMeta?.sourceUrl || contactMeta?.sourceUrl || 'Not provided' }}
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-link"
            size="22"
          />
          <div class="text-base text-truncate">
            {{ visitorMeta?.referrer || contactMeta?.referrer || 'Not provided' }}
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-map-pin"
            size="22"
          />
          <div class="text-base">
            {{ visitorMeta?.timezone || contactMeta?.timezone || 'Not provided' }}
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-language"
            size="22"
          />
          <div class="text-base">
            {{ visitorMeta?.language || contactMeta?.language || 'Not provided' }}
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-device-desktop"
            size="22"
          />
          <div class="text-base">
            {{ [visitorMeta?.browser, visitorMeta?.os, visitorMeta?.device, contactMeta?.browser, contactMeta?.os, contactMeta?.device]
              .filter(Boolean)
              .filter((value, index, list) => list.indexOf(value) === index)
              .join(' • ') || 'Not provided' }}
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-graph"
            size="22"
          />
          <div class="text-base">
            {{ [visitorMeta?.utmSource, visitorMeta?.utmMedium, visitorMeta?.utmCampaign, contactMeta?.utmSource, contactMeta?.utmMedium, contactMeta?.utmCampaign]
              .filter(Boolean)
              .filter((value, index, list) => list.indexOf(value) === index)
              .join(' / ') || 'Not provided' }}
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-route"
            size="22"
          />
          <div class="text-base">
            {{ visitorMeta?.lastPage || contactMeta?.lastPage || 'Not provided' }}
          </div>
        </div>
      </div>

      <!-- Options -->
      <div>
        <div class="text-sm text-disabled mb-1">
          OPTIONS
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-badge"
            size="22"
          />
          <div class="text-base">
            Add Tag
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-star"
            size="22"
          />
          <div class="text-base">
            Important Contact
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            class="me-2"
            icon="tabler-photo"
            size="22"
          />
          <div class="text-base">
            Shared Media
          </div>
        </div>
        <div
          class="d-flex align-center text-high-emphasis pa-2 cursor-pointer"
          role="button"
          tabindex="0"
          @click="openDeleteDialog"
          @keydown.enter.prevent="openDeleteDialog"
        >
          <VIcon
            class="me-2"
            icon="tabler-trash"
            size="22"
          />
          <div class="text-base">
            Delete Contact
          </div>
        </div>
        <div class="d-flex align-center text-high-emphasis pa-2">
          <VIcon
            icon="tabler-ban"
            class="me-2"
            size="22"
          />
          <div class="text-base">
            Block Contact
          </div>
        </div>

        <VBtn
          block
          color="error"
          append-icon="tabler-trash"
          class="mt-6"
          @click="openDeleteDialog"
        >
          Delete Contact
        </VBtn>
      </div>
    </PerfectScrollbar>

    <VDialog
      v-model="isDeleteDialogOpen"
      width="420"
    >
      <VCard>
        <VCardTitle class="text-h6">
          Delete conversation?
        </VCardTitle>
        <VCardText>
          This will remove the conversation from the admin list.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="tonal"
            @click="isDeleteDialogOpen = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            @click="confirmDelete"
          >
            Delete
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </template>
</template>
