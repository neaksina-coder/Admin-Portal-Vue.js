<script lang="ts" setup>
import { useChatStore } from '@/views/apps/chat/useChatStore'
import type { ChatOut } from '@db/apps/chat/types'

const store = useChatStore()

interface MessageGroup {
  senderId: ChatOut['messages'][number]['senderId']
  messages: Omit<ChatOut['messages'][number], 'senderId'>[]
}

const contact = computed(() => ({
  id: store.activeChat?.contact.id,
  avatar: store.activeChat?.contact.avatar,
}))

// Feedback icon
const resolveFeedbackIcon = (feedback: ChatOut['messages'][number]['feedback']) => {
  if (feedback.isSeen)
    return { icon: 'tabler-checks', color: 'success' }
  else if (feedback.isDelivered)
    return { icon: 'tabler-checks', color: undefined }
  else
    return { icon: 'tabler-check', color: undefined }
}

const formatAttachmentSize = (size?: number) => {
  if (!size || Number.isNaN(size))
    return ''

  if (size < 1024)
    return `${size} B`

  const kb = size / 1024
  if (kb < 1024)
    return `${kb.toFixed(1)} KB`

  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

const msgGroups = computed(() => {
  let messages: ChatOut['messages'] = []

  const _msgGroups: MessageGroup[] = []

  if (store.activeChat?.chat && store.activeChat.chat.messages.length) {
    messages = store.activeChat!.chat.messages

    let msgSenderId = messages[0].senderId

    let msgGroup: MessageGroup = {
      senderId: msgSenderId,
      messages: [],
    }

    messages.forEach((msg, index) => {
      if (msgSenderId === msg.senderId) {
        msgGroup.messages.push({
          message: msg.message,
          time: msg.time,
          feedback: msg.feedback,
          attachmentUrl: msg.attachmentUrl,
          attachmentType: msg.attachmentType,
          attachmentName: msg.attachmentName,
          attachmentSize: msg.attachmentSize,
        })
      }
      else {
        msgSenderId = msg.senderId
        _msgGroups.push(msgGroup)
        msgGroup = {
          senderId: msg.senderId,
          messages: [
            {
              message: msg.message,
              time: msg.time,
              feedback: msg.feedback,
              attachmentUrl: msg.attachmentUrl,
              attachmentType: msg.attachmentType,
              attachmentName: msg.attachmentName,
              attachmentSize: msg.attachmentSize,
            },
          ],
        }
      }

      if (index === messages.length - 1)
        _msgGroups.push(msgGroup)
    })
  }

  return _msgGroups
})
</script>

<template>
  <div class="chat-log pa-6">
    <div
      v-for="(msgGrp, index) in msgGroups"
      :key="msgGrp.senderId + String(index)"
      class="chat-group d-flex align-start"
      :class="[{
        'flex-row-reverse': msgGrp.senderId !== contact.id,
        'mb-6': msgGroups.length - 1 !== index,
      }]"
    >
      <div
        class="chat-avatar"
        :class="msgGrp.senderId !== contact.id ? 'ms-4' : 'me-4'"
      >
        <VAvatar size="32">
          <VImg :src="msgGrp.senderId === contact.id ? contact.avatar : store.profileUser?.avatar" />
        </VAvatar>
      </div>
      <div
        class="chat-body d-inline-flex flex-column"
        :class="msgGrp.senderId !== contact.id ? 'align-end' : 'align-start'"
      >
        <div
          v-for="(msgData, msgIndex) in msgGrp.messages"
          :key="msgData.time"
          class="chat-content py-2 px-4 elevation-2"
          style="background-color: rgb(var(--v-theme-surface));"
          :class="[
            msgGrp.senderId === contact.id ? 'chat-left' : 'bg-primary text-white chat-right',
            msgGrp.messages.length - 1 !== msgIndex ? 'mb-2' : 'mb-1',
            msgData.attachmentUrl && !msgData.message ? 'chat-content-attachment-only' : '',
          ]"
        >
          <div
            v-if="msgData.attachmentUrl && msgData.attachmentType?.startsWith('image/')"
            class="chat-attachment-image"
          >
            <img
              :src="msgData.attachmentUrl"
              :alt="msgData.attachmentName || 'Image attachment'"
            >
          </div>
          <div
            v-else-if="msgData.attachmentUrl"
            class="chat-attachment-file"
          >
            <VIcon
              icon="tabler-file"
              size="18"
            />
            <div class="chat-attachment-meta">
              <span class="chat-attachment-name">{{ msgData.attachmentName || 'Attachment' }}</span>
              <span
                v-if="formatAttachmentSize(msgData.attachmentSize)"
                class="chat-attachment-size"
              >
                {{ formatAttachmentSize(msgData.attachmentSize) }}
              </span>
            </div>
          </div>
          <p
            v-if="msgData.message"
            class="mb-0 text-base"
          >
            {{ msgData.message }}
          </p>
        </div>
        <div :class="{ 'text-right': msgGrp.senderId !== contact.id }">
          <VIcon
            v-if="msgGrp.senderId !== contact.id"
            size="16"
            :color="resolveFeedbackIcon(msgGrp.messages[msgGrp.messages.length - 1].feedback).color"
          >
            {{ resolveFeedbackIcon(msgGrp.messages[msgGrp.messages.length - 1].feedback).icon }}
          </VIcon>
          <span class="text-sm ms-2 text-disabled">{{ formatDate(msgGrp.messages[msgGrp.messages.length - 1].time, { hour: 'numeric', minute: 'numeric' }) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang=scss>
.chat-log {
  .chat-body {
    max-inline-size: calc(100% - 6.75rem);

    .chat-content {
      border-end-end-radius: 6px;
      border-end-start-radius: 6px;

      p {
        overflow-wrap: anywhere;
      }

      &.chat-left {
        border-start-end-radius: 6px;
      }

      &.chat-right {
        border-start-start-radius: 6px;
      }
    }
  }
}

.chat-attachment-image {
  width: fit-content;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.chat-attachment-image img {
  display: block;
  max-width: min(320px, 70vw);
  height: auto;
}

.chat-content-attachment-only {
  padding: 0.4rem !important;
  width: fit-content;
  max-width: 100%;
}

.chat-attachment-file {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.08);
  margin-bottom: 0.5rem;
}

.chat-attachment-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.chat-attachment-name {
  font-size: 0.85rem;
  font-weight: 600;
}

.chat-attachment-size {
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>
