<template>
  <div :class="['ai-message', message.sender === 'user' ? 'ai-message-user' : 'ai-message-ai']">
    <div
      v-if="message.sender === 'ai'"
      class="ai-message-avatar"
    >
      <img
        v-if="aiAvatar"
        :src="aiAvatar"
        alt="AI"
      >
      <span
        v-else
        class="ai-message-avatar-fallback"
      >
        AI
      </span>
    </div>
    <div class="ai-message-bubble">
      <p v-html="formattedContent" />
      <span class="ai-message-time">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ChatMessagePayload {
  id: number | string
  text: string
  sender: 'user' | 'ai'
  timestamp: string
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
  return props.message.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
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
