# AI Chat Interface - Vue.js Implementation

## Overview
A Vue 3 implementation of an AI chat interface that starts as a minimized widget in the bottom-right corner and expands to full-screen when clicked.

---

## Project Structure

```
src/
├── components/
│   ├── AIChatWidget.vue          # Main chat component
│   ├── ChatMessage.vue            # Individual message component
│   ├── ChatInput.vue              # Input area component
│   ├── TypingIndicator.vue        # Typing animation
│   └── QuickActions.vue           # Quick action buttons
├── composables/
│   └── useAIChat.js               # Chat logic composable
├── services/
│   └── aiService.js               # API service
└── stores/
    └── chatStore.js               # Pinia store for state management
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
# Using npm
npm install pinia axios

# Using yarn
yarn add pinia axios

# Using pnpm
pnpm add pinia axios
```

### 2. Setup Pinia (main.js or main.ts)

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

---

## Components

### 1. AIChatWidget.vue (Main Component)

```vue
<template>
  <div class="ai-chat-container">
    <!-- Minimized Widget Button -->
    <Transition name="fade">
      <button
        v-show="!isOpen"
        class="ai-chat-toggle"
        @click="openChat"
        aria-label="Open AI Assistant"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
        </svg>
        <span v-if="unreadCount > 0" class="notification-badge">
          {{ unreadCount }}
        </span>
      </button>
    </Transition>

    <!-- Full Screen Chat Interface -->
    <Transition name="slide-up">
      <div v-show="isOpen" class="ai-chat-fullscreen">
        <!-- Overlay -->
        <div class="ai-chat-overlay" @click="closeChat"></div>

        <!-- Chat Window -->
        <div class="ai-chat-window">
          <!-- Header -->
          <div class="ai-chat-header">
            <div class="ai-header-info">
              <div class="ai-avatar">
                <img :src="aiAvatar" alt="AI Assistant" />
                <span class="status-indicator" :class="{ online: isOnline }"></span>
              </div>
              <div class="ai-title">
                <h3>{{ aiName }}</h3>
                <p class="status-text">{{ isOnline ? 'Online' : 'Offline' }}</p>
              </div>
            </div>
            <div class="ai-header-actions">
              <button
                class="minimize-btn"
                @click="closeChat"
                aria-label="Minimize"
              >
                −
              </button>
              <button
                class="close-btn"
                @click="closeChat"
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          <!-- Messages Area -->
          <div ref="messagesContainer" class="ai-chat-messages">
            <!-- Welcome Message -->
            <div v-if="messages.length === 0" class="welcome-message">
              <p>👋 {{ welcomeMessage }}</p>
            </div>

            <!-- Messages -->
            <ChatMessage
              v-for="message in messages"
              :key="message.id"
              :message="message"
              :ai-avatar="aiAvatar"
            />

            <!-- Typing Indicator -->
            <TypingIndicator v-if="isTyping" />
          </div>

          <!-- Quick Actions -->
          <QuickActions
            v-if="quickActions.length > 0"
            :actions="quickActions"
            @action-click="handleQuickAction"
          />

          <!-- Input Area -->
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

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'
import TypingIndicator from './TypingIndicator.vue'
import QuickActions from './QuickActions.vue'

// Props
const props = defineProps({
  aiName: {
    type: String,
    default: 'AI Assistant'
  },
  aiAvatar: {
    type: String,
    default: '/ai-avatar.png'
  },
  welcomeMessage: {
    type: String,
    default: 'Hello! How can I assist you today?'
  },
  quickActions: {
    type: Array,
    default: () => [
      { id: 1, icon: '📝', label: 'Help with form' },
      { id: 2, icon: '📊', label: 'Show analytics' },
      { id: 3, icon: '💡', label: 'Suggestions' }
    ]
  }
})

// Store
const chatStore = useChatStore()

// Reactive state
const isOpen = ref(false)
const currentMessage = ref('')
const messagesContainer = ref(null)

// Computed
const messages = computed(() => chatStore.messages)
const isTyping = computed(() => chatStore.isTyping)
const isSending = computed(() => chatStore.isSending)
const unreadCount = computed(() => chatStore.unreadCount)
const isOnline = computed(() => chatStore.isOnline)

// Methods
const openChat = () => {
  isOpen.value = true
  chatStore.markAsRead()
  document.body.style.overflow = 'hidden'
  
  nextTick(() => {
    scrollToBottom()
  })
}

const closeChat = () => {
  isOpen.value = false
  document.body.style.overflow = ''
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isSending.value) return

  const message = currentMessage.value.trim()
  currentMessage.value = ''

  await chatStore.sendMessage(message)
  scrollToBottom()
}

const handleQuickAction = (action) => {
  currentMessage.value = action.label
  sendMessage()
}

const handleFileUpload = async (file) => {
  await chatStore.uploadFile(file)
  scrollToBottom()
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Watch for new messages
watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom()
  }
)

// Keyboard shortcuts
const handleKeyPress = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    closeChat()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyPress)
  chatStore.initialize()
})
</script>

<style scoped>
/* ==================== MINIMIZED WIDGET ==================== */
.ai-chat-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 9999;
}

.ai-chat-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.ai-chat-toggle svg {
  width: 28px;
  height: 28px;
  color: white;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  border: 2px solid white;
}

/* Pulse Animation */
@keyframes pulse {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  50% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.5);
  }
}

.ai-chat-toggle {
  animation: pulse 2s infinite;
}

/* ==================== FULL SCREEN CHAT ==================== */
.ai-chat-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-chat-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.ai-chat-window {
  position: relative;
  width: 90%;
  max-width: 1200px;
  height: 90vh;
  max-height: 800px;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Header */
.ai-chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ai-avatar {
  position: relative;
  width: 48px;
  height: 48px;
}

.ai-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid white;
}

.status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: #95a5a6;
}

.status-indicator.online {
  background: #2ecc71;
}

.ai-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.status-text {
  margin: 0;
  font-size: 12px;
  opacity: 0.9;
}

.ai-header-actions {
  display: flex;
  gap: 8px;
}

.minimize-btn,
.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.minimize-btn:hover,
.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Messages Area */
.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-chat-messages::-webkit-scrollbar {
  width: 8px;
}

.ai-chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.ai-chat-messages::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.welcome-message {
  background: white;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* ==================== TRANSITIONS ==================== */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active {
  transition: all 0.4s ease;
}

.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
}

.slide-up-leave-to {
  opacity: 0;
}

.slide-up-enter-from .ai-chat-window {
  transform: translateY(50px) scale(0.95);
}

.slide-up-leave-to .ai-chat-window {
  transform: translateY(50px) scale(0.95);
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .ai-chat-window {
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }
}

@media (max-width: 480px) {
  .ai-chat-toggle {
    width: 56px;
    height: 56px;
    bottom: 16px;
    right: 16px;
  }

  .ai-chat-header {
    padding: 16px;
  }

  .ai-avatar {
    width: 40px;
    height: 40px;
  }
}
</style>
```

---

### 2. ChatMessage.vue

```vue
<template>
  <div :class="['message', `${message.sender}-message`]">
    <div v-if="message.sender === 'ai'" class="message-avatar">
      <img :src="aiAvatar" alt="AI" />
    </div>
    
    <div class="message-content">
      <p v-html="formattedContent"></p>
      <span class="message-time">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  aiAvatar: {
    type: String,
    default: '/ai-avatar.png'
  }
})

const formattedContent = computed(() => {
  // Escape HTML and convert URLs to links
  return props.message.text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>')
})

const formattedTime = computed(() => {
  return new Date(props.message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
})
</script>

<style scoped>
.message {
  display: flex;
  gap: 12px;
  max-width: 70%;
  animation: messageSlide 0.3s ease;
}

@keyframes messageSlide {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-message {
  align-self: flex-start;
}

.user-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.message-content {
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.user-message .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-content p {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-time {
  font-size: 11px;
  opacity: 0.6;
  margin-top: 4px;
  display: block;
}

@media (max-width: 768px) {
  .message {
    max-width: 85%;
  }
}
</style>
```

---

### 3. ChatInput.vue

```vue
<template>
  <div class="ai-chat-input-container">
    <div class="ai-chat-input">
      <div class="input-actions">
        <button
          class="attach-btn"
          @click="triggerFileUpload"
          aria-label="Attach file"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
          </svg>
        </button>
        <input
          ref="fileInput"
          type="file"
          style="display: none"
          accept="image/*,.pdf,.doc,.docx"
          @change="handleFileChange"
        />
      </div>

      <textarea
        ref="textareaRef"
        v-model="localMessage"
        placeholder="Type your message..."
        rows="1"
        aria-label="Message input"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      ></textarea>

      <button
        class="send-btn"
        :disabled="!canSend"
        @click="handleSend"
        aria-label="Send message"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  isSending: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'send', 'file-select'])

const textareaRef = ref(null)
const fileInput = ref(null)
const localMessage = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canSend = computed(() => {
  return localMessage.value.trim().length > 0 && !props.isSending
})

const handleSend = () => {
  if (canSend.value) {
    emit('send')
  }
}

const autoResize = () => {
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
      textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 120) + 'px'
    }
  })
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    emit('file-select', file)
    event.target.value = ''
  }
}

watch(() => props.modelValue, () => {
  autoResize()
})
</script>

<style scoped>
.ai-chat-input-container {
  background: white;
  border-top: 1px solid #e1e8ed;
}

.ai-chat-input {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-actions {
  display: flex;
  align-items: center;
}

.attach-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f8f9fa;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.attach-btn:hover {
  background: #e9ecef;
}

.attach-btn svg {
  width: 20px;
  height: 20px;
  color: #667eea;
}

textarea {
  flex: 1;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  max-height: 120px;
  transition: border-color 0.2s;
}

textarea:focus {
  outline: none;
  border-color: #667eea;
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn svg {
  width: 20px;
  height: 20px;
  color: white;
}
</style>
```

---

### 4. TypingIndicator.vue

```vue
<template>
  <div class="typing-indicator">
    <span></span>
    <span></span>
    <span></span>
  </div>
</template>

<style scoped>
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  width: fit-content;
  margin-left: 48px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #667eea;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
```

---

### 5. QuickActions.vue

```vue
<template>
  <div class="quick-actions">
    <button
      v-for="action in actions"
      :key="action.id"
      class="quick-action-btn"
      @click="$emit('action-click', action)"
    >
      <span>{{ action.icon }}</span>
      {{ action.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  actions: {
    type: Array,
    required: true
  }
})

defineEmits(['action-click'])
</script>

<style scoped>
.quick-actions {
  padding: 12px 24px;
  background: white;
  border-top: 1px solid #e1e8ed;
  display: flex;
  gap: 8px;
  overflow-x: auto;
}

.quick-action-btn {
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #e1e8ed;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-action-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
}
</style>
```

---

## Composables

### useAIChat.js

```javascript
import { ref, computed } from 'vue'
import { aiService } from '@/services/aiService'

export function useAIChat() {
  const messages = ref([])
  const isTyping = ref(false)
  const isSending = ref(false)
  const conversationId = ref(null)

  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const initializeConversation = () => {
    conversationId.value = sessionStorage.getItem('ai_conversation_id') || generateConversationId()
    sessionStorage.setItem('ai_conversation_id', conversationId.value)
    loadHistory()
  }

  const loadHistory = () => {
    const saved = localStorage.getItem(`ai_chat_${conversationId.value}`)
    if (saved) {
      messages.value = JSON.parse(saved)
    }
  }

  const saveHistory = () => {
    localStorage.setItem(
      `ai_chat_${conversationId.value}`,
      JSON.stringify(messages.value)
    )
  }

  const addMessage = (text, sender = 'user') => {
    const message = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date().toISOString()
    }
    messages.value.push(message)
    saveHistory()
    return message
  }

  const sendMessage = async (text) => {
    if (isSending.value) return

    isSending.value = true
    
    // Add user message
    addMessage(text, 'user')

    try {
      // Show typing indicator
      isTyping.value = true

      // Call AI service
      const response = await aiService.sendMessage({
        message: text,
        conversationId: conversationId.value,
        history: messages.value
      })

      // Hide typing indicator
      isTyping.value = false

      // Add AI response
      addMessage(response.message, 'ai')

    } catch (error) {
      console.error('Error sending message:', error)
      isTyping.value = false
      addMessage('Sorry, I encountered an error. Please try again.', 'ai')
    } finally {
      isSending.value = false
    }
  }

  const uploadFile = async (file) => {
    if (isSending.value) return

    isSending.value = true

    try {
      const response = await aiService.uploadFile(file, conversationId.value)
      addMessage(`Uploaded: ${file.name}`, 'user')
      
      if (response.message) {
        isTyping.value = true
        setTimeout(() => {
          isTyping.value = false
          addMessage(response.message, 'ai')
        }, 1000)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      addMessage('Failed to upload file. Please try again.', 'ai')
    } finally {
      isSending.value = false
    }
  }

  const clearHistory = () => {
    messages.value = []
    localStorage.removeItem(`ai_chat_${conversationId.value}`)
  }

  return {
    messages: computed(() => messages.value),
    isTyping: computed(() => isTyping.value),
    isSending: computed(() => isSending.value),
    conversationId: computed(() => conversationId.value),
    initializeConversation,
    sendMessage,
    uploadFile,
    clearHistory
  }
}
```

---

## Pinia Store

### chatStore.js

```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { aiService } from '@/services/aiService'

export const useChatStore = defineStore('chat', () => {
  // State
  const messages = ref([])
  const isTyping = ref(false)
  const isSending = ref(false)
  const isOnline = ref(true)
  const unreadCount = ref(0)
  const conversationId = ref(null)

  // Getters
  const lastMessage = computed(() => {
    return messages.value[messages.value.length - 1]
  })

  // Actions
  const initialize = () => {
    conversationId.value = getOrCreateConversationId()
    loadConversationHistory()
    checkOnlineStatus()
  }

  const getOrCreateConversationId = () => {
    let id = sessionStorage.getItem('ai_conversation_id')
    if (!id) {
      id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('ai_conversation_id', id)
    }
    return id
  }

  const loadConversationHistory = () => {
    const saved = localStorage.getItem(`ai_chat_${conversationId.value}`)
    if (saved) {
      try {
        messages.value = JSON.parse(saved)
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
    }
  }

  const saveConversationHistory = () => {
    try {
      localStorage.setItem(
        `ai_chat_${conversationId.value}`,
        JSON.stringify(messages.value)
      )
    } catch (error) {
      console.error('Error saving chat history:', error)
    }
  }

  const addMessage = (text, sender = 'user') => {
    const message = {
      id: Date.now() + Math.random(),
      text,
      sender,
      timestamp: new Date().toISOString()
    }
    
    messages.value.push(message)
    
    if (sender === 'ai') {
      unreadCount.value++
    }
    
    saveConversationHistory()
    return message
  }

  const sendMessage = async (text) => {
    if (isSending.value || !text.trim()) return

    isSending.value = true

    // Add user message
    addMessage(text, 'user')

    try {
      // Show typing indicator
      isTyping.value = true

      // Simulate delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))

      // Call AI service
      const response = await aiService.sendMessage({
        message: text,
        conversationId: conversationId.value,
        history: messages.value.slice(-10) // Send last 10 messages for context
      })

      // Hide typing
      isTyping.value = false

      // Add AI response
      addMessage(response.message || response.response, 'ai')

    } catch (error) {
      console.error('Error sending message:', error)
      isTyping.value = false
      addMessage('Sorry, I encountered an error. Please try again.', 'ai')
    } finally {
      isSending.value = false
    }
  }

  const uploadFile = async (file) => {
    if (isSending.value) return

    isSending.value = true

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', conversationId.value)

      const response = await aiService.uploadFile(formData)
      
      addMessage(`📎 Uploaded: ${file.name}`, 'user')

      if (response.message) {
        isTyping.value = true
        await new Promise(resolve => setTimeout(resolve, 1000))
        isTyping.value = false
        addMessage(response.message, 'ai')
      }

    } catch (error) {
      console.error('Error uploading file:', error)
      addMessage('Failed to upload file. Please try again.', 'ai')
    } finally {
      isSending.value = false
    }
  }

  const markAsRead = () => {
    unreadCount.value = 0
  }

  const clearConversation = () => {
    messages.value = []
    localStorage.removeItem(`ai_chat_${conversationId.value}`)
    conversationId.value = getOrCreateConversationId()
  }

  const checkOnlineStatus = () => {
    // Check if AI service is online
    isOnline.value = navigator.onLine
    
    window.addEventListener('online', () => {
      isOnline.value = true
    })
    
    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  }

  return {
    // State
    messages,
    isTyping,
    isSending,
    isOnline,
    unreadCount,
    conversationId,
    
    // Getters
    lastMessage,
    
    // Actions
    initialize,
    sendMessage,
    uploadFile,
    markAsRead,
    clearConversation,
    addMessage
  }
})
```

---

## Services

### aiService.js

```javascript
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_AI_API_URL || '/api/ai'

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add request interceptor for auth tokens if needed
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error)
        return Promise.reject(error)
      }
    )
  }

  async sendMessage({ message, conversationId, history = [] }) {
    try {
      const response = await this.client.post('/chat', {
        message,
        conversation_id: conversationId,
        history: history.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      })

      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send message')
    }
  }

  async uploadFile(formData) {
    try {
      const response = await this.client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload file')
    }
  }

  async getConversationHistory(conversationId) {
    try {
      const response = await this.client.get(`/conversation/${conversationId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to load conversation')
    }
  }

  async deleteConversation(conversationId) {
    try {
      const response = await this.client.delete(`/conversation/${conversationId}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete conversation')
    }
  }
}

export const aiService = new AIService()
```

---

## Usage in App

### App.vue

```vue
<template>
  <div id="app">
    <!-- Your existing app content -->
    <router-view />

    <!-- AI Chat Widget -->
    <AIChatWidget
      ai-name="AI Assistant"
      ai-avatar="/ai-avatar.png"
      welcome-message="Hello! How can I help you today?"
      :quick-actions="quickActions"
    />
  </div>
</template>

<script setup>
import AIChatWidget from './components/AIChatWidget.vue'

const quickActions = [
  { id: 1, icon: '📝', label: 'Help with form' },
  { id: 2, icon: '📊', label: 'Show analytics' },
  { id: 3, icon: '💡', label: 'Get suggestions' },
  { id: 4, icon: '❓', label: 'FAQ' }
]
</script>
```

---

## Environment Variables

### .env

```env
VITE_AI_API_URL=https://your-api-domain.com/api/ai
VITE_AI_API_KEY=your_api_key_here
```

---

## Backend API Example (Node.js/Express)

```javascript
// Example backend endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, conversation_id, history } = req.body

    // Call your AI service (OpenAI, Anthropic, etc.)
    const aiResponse = await callAIService({
      message,
      conversationId: conversation_id,
      history
    })

    // Save to database
    await saveConversation(conversation_id, message, aiResponse)

    res.json({
      success: true,
      message: aiResponse,
      conversation_id
    })

  } catch (error) {
    console.error('AI Error:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})
```

---

## Advanced Features

### 1. Voice Input

```vue
<!-- Add to ChatInput.vue -->
<button class="voice-btn" @click="startVoiceRecognition">
  <svg><!-- Microphone icon --></svg>
</button>

<script setup>
const startVoiceRecognition = () => {
  if ('webkitSpeechRecognition' in window) {
    const recognition = new webkitSpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      emit('update:modelValue', transcript)
    }

    recognition.start()
  }
}
</script>
```

### 2. Markdown Support

```bash
npm install marked
```

```vue
<!-- Update ChatMessage.vue -->
<script setup>
import { marked } from 'marked'

const formattedContent = computed(() => {
  return marked(props.message.text)
})
</script>
```

### 3. Code Syntax Highlighting

```bash
npm install highlight.js
```

```vue
<script setup>
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'

onMounted(() => {
  document.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightBlock(block)
  })
})
</script>
```

---

## Testing

### Unit Tests (Vitest)

```javascript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AIChatWidget from '@/components/AIChatWidget.vue'

describe('AIChatWidget', () => {
  it('renders minimized by default', () => {
    const wrapper = mount(AIChatWidget)
    expect(wrapper.find('.ai-chat-toggle').exists()).toBe(true)
  })

  it('opens chat when toggle is clicked', async () => {
    const wrapper = mount(AIChatWidget)
    await wrapper.find('.ai-chat-toggle').trigger('click')
    expect(wrapper.find('.ai-chat-fullscreen').isVisible()).toBe(true)
  })
})
```

---

## Deployment Checklist

- [ ] Configure API endpoints in .env
- [ ] Test all components
- [ ] Optimize bundle size
- [ ] Add error boundaries
- [ ] Implement analytics
- [ ] Test on mobile devices
- [ ] Add loading states
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Test accessibility

---

## Performance Tips

1. **Lazy load the chat component**
```javascript
const AIChatWidget = defineAsyncComponent(() =>
  import('./components/AIChatWidget.vue')
)
```

2. **Implement virtual scrolling for long conversations**
3. **Debounce typing indicators**
4. **Use Vue 3's Suspense for loading states**

---

**Version:** 1.0  
**Last Updated:** February 2026
