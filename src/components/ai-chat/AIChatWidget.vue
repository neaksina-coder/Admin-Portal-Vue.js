<template>
  <div class="ai-chat-shell">
    <Transition name="ai-fade">
      <button
        v-show="!isOpen"
        class="ai-toggle"
        type="button"
        aria-label="Open AI assistant"
        @click="openChat"
      >
        <span class="ai-toggle-glow" />
        <svg
          class="ai-toggle-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M4 6.5a3.5 3.5 0 0 1 3.5-3.5h9A3.5 3.5 0 0 1 20 6.5v6a3.5 3.5 0 0 1-3.5 3.5H10l-4.6 3.1a.75.75 0 0 1-1.15-.63V16A3.5 3.5 0 0 1 4 12.5v-6Z" />
        </svg>
        <span
          v-if="unreadCount > 0"
          class="ai-badge"
        >
          {{ unreadCount }}
        </span>
      </button>
    </Transition>

    <Transition name="ai-rise">
      <div
        v-show="isOpen"
        class="ai-fullscreen"
      >
        <div
          class="ai-overlay"
          @click="closeChat"
        />

        <div
          class="ai-window"
          role="dialog"
          aria-modal="true"
        >
          <header class="ai-header">
            <div class="ai-header-left">
              <div class="ai-avatar">
                <img
                  v-if="aiAvatar"
                  :src="aiAvatar"
                  alt="AI assistant"
                >
                <span
                  v-else
                  class="ai-avatar-fallback"
                >
                  AI
                </span>
                <span
                  class="ai-status"
                  :class="{ online: isOnline }"
                />
              </div>
              <div>
                <p class="ai-title">
                  {{ aiName }}
                </p>
                <p class="ai-subtitle">
                  {{ isOnline ? 'Online now' : 'Offline' }}
                </p>
              </div>
            </div>
            <div class="ai-header-actions">
              <button
                class="ai-ghost-btn"
                type="button"
                @click="clearConversation"
              >
                New chat
              </button>
              <button
                class="ai-icon-btn"
                type="button"
                aria-label="Minimize"
                @click="closeChat"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                class="ai-icon-btn"
                type="button"
                aria-label="Close"
                @click="closeChat"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
          </header>

          <section
            ref="messagesContainer"
            class="ai-messages"
            aria-live="polite"
          >
            <div
              v-if="messages.length === 0"
              class="ai-welcome"
            >
              <p>{{ welcomeMessage }}</p>
              <div class="ai-welcome-hint">
                Try asking about plans, onboarding, or quick setup steps.
              </div>
            </div>

            <ChatMessage
              v-for="message in messages"
              :key="message.id"
              :message="message"
              :ai-avatar="aiAvatar"
            />

            <TypingIndicator v-if="isTyping" />
          </section>

          <QuickActions
            v-if="quickActions.length"
            :actions="quickActions"
            @action-click="handleQuickAction"
          />

          <ChatInput
            v-model="currentMessage"
            :is-sending="isSending"
            @send="sendMessage"
            @file-select="handleFileUpload"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import ChatInput from './ChatInput.vue'
import ChatMessage from './ChatMessage.vue'
import QuickActions from './QuickActions.vue'
import TypingIndicator from './TypingIndicator.vue'
import { useAIChatStore } from '@/stores/aiChatStore'

interface QuickAction {
  id: number
  label: string
  icon: string
}

const props = defineProps({
  aiName: {
    type: String,
    default: 'AI Assistant',
  },
  aiAvatar: {
    type: String,
    default: '',
  },
  welcomeMessage: {
    type: String,
    default: 'Hello. I can help with product, pricing, and onboarding questions.',
  },
  quickActions: {
    type: Array as () => QuickAction[],
    default: () => [
      {
        id: 1,
        label: 'Summarize this page',
        icon: 'M4 6h16M4 12h10M4 18h14',
      },
      {
        id: 2,
        label: 'Help me get started',
        icon: 'M12 5v14M5 12h14',
      },
      {
        id: 3,
        label: 'Show pricing options',
        icon: 'M4 8h16M6 8v8M18 8v8M4 16h16',
      },
    ],
  },
})

const chatStore = useAIChatStore()

const isOpen = ref(false)
const currentMessage = ref('')
const messagesContainer = ref<HTMLElement | null>(null)

const messages = computed(() => chatStore.messages)
const isTyping = computed(() => chatStore.isTyping)
const isSending = computed(() => chatStore.isSending)
const unreadCount = computed(() => chatStore.unreadCount)
const isOnline = computed(() => chatStore.isOnline)

const openChat = () => {
  isOpen.value = true
  chatStore.markAsRead()
  document.body.style.overflow = 'hidden'
  nextTick(scrollToBottom)
}

const closeChat = () => {
  isOpen.value = false
  document.body.style.overflow = ''
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isSending.value)
    return

  const message = currentMessage.value.trim()
  currentMessage.value = ''
  await chatStore.sendMessage(message)
  scrollToBottom()
}

const handleQuickAction = (action: QuickAction) => {
  currentMessage.value = action.label
  sendMessage()
}

const handleFileUpload = async (file: File) => {
  await chatStore.uploadFile(file)
  scrollToBottom()
}

const clearConversation = () => {
  chatStore.clearConversation()
  scrollToBottom()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value)
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  })
}

const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value)
    closeChat()
}

watch(
  () => chatStore.messages.length,
  () => {
    if (isOpen.value)
      scrollToBottom()
  },
)

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress)
  chatStore.initialize()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyPress)
  document.body.style.overflow = ''
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

.ai-chat-shell {
  --ai-ink: #0f172a;
  --ai-muted: #64748b;
  --ai-surface: #f8fafc;
  --ai-card: #ffffff;
  --ai-primary: #0f766e;
  --ai-secondary: #f97316;
  --ai-accent: #0ea5e9;
  --ai-shadow: 0 24px 60px rgba(15, 23, 42, 0.25);
  font-family: 'Space Grotesk', 'IBM Plex Sans', sans-serif;
}

.ai-toggle {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1100;
  border: none;
  border-radius: 999px;
  width: 62px;
  height: 62px;
  background: linear-gradient(140deg, var(--ai-primary), var(--ai-accent));
  color: white;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(14, 116, 144, 0.4);
  display: grid;
  place-items: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.ai-toggle:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 16px 30px rgba(14, 116, 144, 0.5);
}

.ai-toggle-glow {
  position: absolute;
  inset: -40%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.7), transparent 60%);
  opacity: 0.5;
  animation: pulseGlow 2.8s ease-in-out infinite;
}

.ai-toggle-icon {
  width: 28px;
  height: 28px;
  fill: currentColor;
  z-index: 1;
}

.ai-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--ai-secondary);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 2px solid white;
  z-index: 1;
}

.ai-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 24px;
}

.ai-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(6px);
}

.ai-window {
  position: relative;
  width: min(1040px, 96vw);
  height: min(84vh, 820px);
  background: radial-gradient(1000px 500px at 8% -10%, rgba(14, 165, 233, 0.15), transparent 60%),
    radial-gradient(900px 420px at 92% -15%, rgba(249, 115, 22, 0.18), transparent 55%),
    var(--ai-surface);
  border-radius: 26px;
  box-shadow: var(--ai-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 26px;
  background: linear-gradient(130deg, rgba(15, 118, 110, 0.95), rgba(14, 165, 233, 0.95));
  color: white;
}

.ai-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ai-avatar {
  position: relative;
  width: 48px;
  height: 48px;
}

.ai-avatar img,
.ai-avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 16px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.2);
  display: grid;
  place-items: center;
  font-weight: 700;
  letter-spacing: 1px;
}

.ai-avatar-fallback {
  color: white;
  font-size: 16px;
}

.ai-status {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid white;
  background: #94a3b8;
}

.ai-status.online {
  background: #22c55e;
}

.ai-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.ai-subtitle {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.ai-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-ghost-btn {
  border: 1px solid rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.ai-ghost-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.6);
}

.ai-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  display: grid;
  place-items: center;
  cursor: pointer;
  color: white;
  transition: transform 0.2s ease, background 0.2s ease;
}

.ai-icon-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

.ai-icon-btn svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2.2px;
  fill: none;
}

.ai-messages {
  flex: 1;
  padding: 24px 28px 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-welcome {
  background: var(--ai-card);
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
  color: var(--ai-ink);
  animation: fadeIn 0.4s ease;
}

.ai-welcome p {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
}

.ai-welcome-hint {
  font-size: 13px;
  color: var(--ai-muted);
}

.ai-messages::-webkit-scrollbar {
  width: 8px;
}

.ai-messages::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.2);
  border-radius: 999px;
}

.ai-fade-enter-active,
.ai-fade-leave-active {
  transition: opacity 0.25s ease;
}

.ai-fade-enter-from,
.ai-fade-leave-to {
  opacity: 0;
}

.ai-rise-enter-active {
  transition: opacity 0.3s ease;
}

.ai-rise-leave-active {
  transition: opacity 0.2s ease;
}

.ai-rise-enter-from,
.ai-rise-leave-to {
  opacity: 0;
}

.ai-rise-enter-from .ai-window,
.ai-rise-leave-to .ai-window {
  transform: translateY(30px) scale(0.96);
}

@keyframes pulseGlow {
  0%,
  100% {
    transform: scale(0.9);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.65;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .ai-window {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .ai-fullscreen {
    padding: 0;
  }
}

@media (max-width: 640px) {
  .ai-header {
    padding: 16px 18px;
  }

  .ai-toggle {
    width: 56px;
    height: 56px;
    right: 16px;
    bottom: 16px;
  }

  .ai-messages {
    padding: 20px 18px 8px;
  }
}
</style>
