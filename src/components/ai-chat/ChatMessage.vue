<template>
  <div :class="['ai-message', message.sender === 'visitor' ? 'ai-message-user' : 'ai-message-ai']">
    <div
      v-if="message.sender !== 'visitor'"
      class="ai-message-avatar"
    >
      <img
        v-if="aiAvatar && message.sender === 'ai'"
        :src="aiAvatar"
        alt="AI"
      >
      <span
        v-else
        class="ai-message-avatar-fallback"
      >
        {{ message.sender === 'admin' ? 'AD' : 'AI' }}
      </span>
    </div>
    <div class="ai-message-bubble">
      <div
        v-if="isImage"
        class="ai-attachment-image"
      >
        <img
          :src="message.attachmentUrl"
          :alt="message.attachmentName || 'Image attachment'"
        >
      </div>
      <div
        v-else-if="hasAttachment"
        class="ai-attachment-file"
      >
        <span class="ai-attachment-icon">
          <svg viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>
        <div class="ai-attachment-meta">
          <span class="ai-attachment-name">{{ message.attachmentName || 'Attachment' }}</span>
          <span
            v-if="formattedSize"
            class="ai-attachment-size"
          >
            {{ formattedSize }}
          </span>
        </div>
      </div>
      <p
        v-if="formattedContent"
        v-html="formattedContent"
      />
      <span class="ai-message-time">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ChatMessagePayload {
  id: number | string
  text: string
  sender: 'visitor' | 'ai' | 'admin'
  timestamp: string
  attachmentUrl?: string
  attachmentType?: string
  attachmentName?: string
  attachmentSize?: number
}

const props = defineProps({
  message: {
    type: Object as () => ChatMessagePayload,
    required: true,
  },
  aiAvatar: {
    type: String,
    default: '',
  },
})

const formattedContent = computed(() => {
  if (!props.message.text)
    return ''

  return props.message.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
})

const hasAttachment = computed(() => Boolean(props.message.attachmentUrl))
const isImage = computed(() => Boolean(props.message.attachmentUrl && props.message.attachmentType?.startsWith('image/')))

const formattedSize = computed(() => {
  const size = props.message.attachmentSize
  if (!size || Number.isNaN(size))
    return ''

  if (size < 1024)
    return `${size} B`

  const kb = size / 1024
  if (kb < 1024)
    return `${kb.toFixed(1)} KB`

  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
})

const formattedTime = computed(() => {
  return new Date(props.message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<style scoped>
.ai-message {
  display: flex;
  gap: 12px;
  max-width: 72%;
  animation: messageEnter 0.3s ease;
}

.ai-message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-message-ai {
  align-self: flex-start;
}

.ai-message-avatar img,
.ai-message-avatar-fallback {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  object-fit: cover;
  background: rgba(15, 118, 110, 0.15);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 12px;
  color: #0f766e;
}

.ai-message-bubble {
  background: #ffffff;
  border-radius: 16px;
  padding: 12px 16px;
  color: #0f172a;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.08);
}

.ai-message-user .ai-message-bubble {
  background: linear-gradient(140deg, #0ea5e9, #f97316);
  color: white;
  box-shadow: 0 14px 24px rgba(249, 115, 22, 0.2);
}

.ai-message-bubble p {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  word-break: break-word;
}

.ai-attachment-image {
  width: fit-content;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 8px;
  border: 1px solid rgba(15, 23, 42, 0.12);
}

.ai-attachment-image img {
  display: block;
  max-width: min(320px, 70vw);
  height: auto;
}

.ai-message-bubble:has(.ai-attachment-image):not(:has(p)) {
  padding: 8px 10px;
  width: fit-content;
  max-width: 100%;
}

.ai-attachment-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 118, 110, 0.12);
  margin-bottom: 8px;
}

.ai-message-user .ai-attachment-file {
  background: rgba(255, 255, 255, 0.2);
}

.ai-attachment-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(15, 118, 110, 0.18);
  display: grid;
  place-items: center;
  color: #0f766e;
}

.ai-message-user .ai-attachment-icon {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}

.ai-attachment-icon svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8px;
  fill: none;
}

.ai-attachment-meta {
  display: grid;
  gap: 2px;
}

.ai-attachment-name {
  font-size: 13px;
  font-weight: 600;
}

.ai-attachment-size {
  font-size: 11px;
  opacity: 0.7;
}

.ai-message-time {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.65;
}

.ai-message-bubble :deep(a) {
  color: inherit;
  text-decoration: underline;
}

@keyframes messageEnter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 640px) {
  .ai-message {
    max-width: 85%;
  }
}
</style>
