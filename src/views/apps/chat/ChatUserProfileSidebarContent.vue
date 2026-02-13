<script lang="ts" setup>
import { ref } from 'vue'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useChat } from './useChat'
import { useChatStore } from '@/views/apps/chat/useChatStore'

defineEmits<{
  (e: 'close'): void
}>()

// composables
const store = useChatStore()
const { resolveAvatarBadgeVariant } = useChat()
const isUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const userStatusRadioOptions = [
  { title: 'Online', value: 'online', color: 'success' },
  { title: 'Away', value: 'away', color: 'warning' },
  { title: 'Do not disturb', value: 'busy', color: 'error' },
  { title: 'Offline', value: 'offline', color: 'secondary' },
]

const isAuthenticationEnabled = ref(true)
const isNotificationEnabled = ref(false)

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file)
    return

  isUploading.value = true
  await store.uploadAdminAvatar(file)
  isUploading.value = false

  if (target)
    target.value = ''
}
</script>

<template>
  <template v-if="store.profileUser">
    <!-- Close Button -->
    <div class="pt-2 me-2 text-end">
      <IconBtn @click="$emit('close')">
        <VIcon
          class="text-medium-emphasis"
          color="disabled"
          icon="tabler-x"
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
        :color="resolveAvatarBadgeVariant(store.profileUser.status)"
        class="chat-user-profile-badge mb-3"
      >
        <VAvatar
          size="84"
          :variant="!store.profileUser.avatar ? 'tonal' : undefined"
          :color="!store.profileUser.avatar ? resolveAvatarBadgeVariant(store.profileUser.status) : undefined"
          class="cursor-pointer"
          @click="triggerUpload"
        >
          <VImg
            v-if="store.profileUser.avatar"
            :src="store.profileUser.avatar"
          />
          <span
            v-else
            class="text-3xl"
          >{{ avatarText(store.profileUser.fullName) }}</span>
        </VAvatar>
      </VBadge>
      <div class="text-caption text-disabled mb-2">
        Click avatar to update
      </div>
      <VBtn
        variant="tonal"
        size="small"
        :loading="isUploading"
        @click="triggerUpload"
      >
        Upload Avatar
      </VBtn>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        hidden
        @change="handleUpload"
      >
      <h5 class="text-h5">
        {{ store.profileUser.fullName }}
      </h5>
      <p class="text-capitalize text-medium-emphasis mb-0">
        {{ store.profileUser.role }}
      </p>
    </div>

    <!-- User Data -->
    <PerfectScrollbar
      class="ps-chat-user-profile-sidebar-content pb-5 px-6"
      :options="{ wheelPropagation: false }"
    >
      <!-- About -->
      <div class="my-6 text-medium-emphasis">
        <div
          for="textarea-user-about"
          class="text-base text-disabled"
        >
          ABOUT
        </div>
        <AppTextarea
          id="textarea-user-about"
          v-model="store.profileUser.about"
          auto-grow
          class="mt-1"
          rows="3"
        />
      </div>

      <!-- Status -->
      <div class="mb-6">
        <div class="text-base text-disabled">
          STATUS
        </div>
        <VRadioGroup
          v-model="store.profileUser.status"
          class="mt-1"
        >
          <VRadio
            v-for="(radioOption, index) in userStatusRadioOptions"
            :id="`${index}`"
            :key="radioOption.title"
            :name="radioOption.title"
            :label="radioOption.title"
            :value="radioOption.value"
            :color="radioOption.color"
          />
        </VRadioGroup>
      </div>

      <!-- Settings -->
      <div class="text-medium-emphasis chat-settings-section">
        <div class="text-base text-disabled">
          SETTINGS
        </div>

        <div class="d-flex align-center pa-2">
          <VIcon
            class="me-2 text-high-emphasis"
            icon="tabler-lock"
            size="22"
          />
          <div class="text-high-emphasis d-flex align-center justify-space-between flex-grow-1">
            <div class="text-body-1 text-high-emphasis">
              Two-step Verification
            </div>
            <VSwitch
              id="two-step-verification"
              v-model="isAuthenticationEnabled"
              density="compact"
            />
          </div>
        </div>
        <div class="d-flex align-center pa-2">
          <VIcon
            class="me-2 text-high-emphasis"
            icon="tabler-bell"
            size="22"
          />
          <div class="text-high-emphasis d-flex align-center justify-space-between flex-grow-1">
            <div class="text-body-1 text-high-emphasis">
              Notification
            </div>
            <VSwitch
              id="chat-notification"
              v-model="isNotificationEnabled"
              density="compact"
            />
          </div>
        </div>
        <div class="d-flex align-center pa-2">
          <VIcon
            class="me-2 text-high-emphasis"
            icon="tabler-user-plus"
            size="22"
          />
          <div class="text-body-1 text-high-emphasis">
            Invite Friends
          </div>
        </div>
        <div class="d-flex align-center pa-2">
          <VIcon
            class="me-2 text-high-emphasis"
            icon="tabler-trash"
            size="22"
          />
          <div class="text-body-1 text-high-emphasis">
            Delete Account
          </div>
        </div>
      </div>

      <!-- Logout Button -->
      <VBtn
        color="primary"
        class="mt-12"
        block
        append-icon="tabler-logout"
      >
        Logout
      </VBtn>
    </PerfectScrollbar>
  </template>
</template>

<style lang="scss">
.chat-settings-section {
  .v-switch {
    .v-input__control {
      .v-selection-control__wrapper {
        block-size: 18px;
      }
    }
  }
}
</style>
