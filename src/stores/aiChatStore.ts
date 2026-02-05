import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { aiService } from '@/services/aiService'

type Sender = 'user' | 'ai'

export interface AIChatMessage {
  id: number | string
  text: string
  sender: Sender
  timestamp: string
}

export const useAIChatStore = defineStore('aiChat', () => {
  const messages = ref<AIChatMessage[]>([])
  const isTyping = ref(false)
  const isSending = ref(false)
  const isOnline = ref(true)
  const unreadCount = ref(0)
  const conversationId = ref('')
  const listenersAttached = ref(false)

  const lastMessage = computed(() => messages.value[messages.value.length - 1])

  const generateConversationId = () => {
    return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }

  const getOrCreateConversationId = () => {
    if (typeof window === 'undefined')
      return generateConversationId()

    let id = sessionStorage.getItem('ai_conversation_id')
    if (!id) {
      id = generateConversationId()
      sessionStorage.setItem('ai_conversation_id', id)
    }

    return id
  }

  const loadConversationHistory = () => {
    if (typeof window === 'undefined')
      return

    const saved = localStorage.getItem(`ai_chat_${conversationId.value}`)
    if (!saved)
      return

    try {
      messages.value = JSON.parse(saved)
    }
    catch (error) {
      console.error('Failed to load AI chat history', error)
    }
  }

  const saveConversationHistory = () => {
    if (typeof window === 'undefined')
      return

    try {
      localStorage.setItem(`ai_chat_${conversationId.value}`, JSON.stringify(messages.value))
    }
    catch (error) {
      console.error('Failed to save AI chat history', error)
    }
  }

  const addMessage = (text: string, sender: Sender) => {
    const message: AIChatMessage = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text,
      sender,
      timestamp: new Date().toISOString(),
    }

    messages.value.push(message)

    if (sender === 'ai')
      unreadCount.value += 1

    saveConversationHistory()
    return message
  }

  const sendMessage = async (text: string) => {
    if (isSending.value || !text.trim())
      return

    isSending.value = true
    addMessage(text, 'user')

    try {
      isTyping.value = true
      const response = await aiService.sendMessage({
        message: text,
        conversationId: conversationId.value,
        history: messages.value.slice(-12),
      })
      isTyping.value = false

      const responseText = response?.message || response?.response || 'Thanks for the message. How else can I help?'
      addMessage(responseText, 'ai')
    }
    catch (error) {
      console.error('AI chat error', error)
      isTyping.value = false
      addMessage('Sorry, I ran into an issue. Please try again in a moment.', 'ai')
    }
    finally {
      isSending.value = false
    }
  }

  const uploadFile = async (file: File) => {
    if (isSending.value)
      return

    isSending.value = true

    try {
      const response = await aiService.uploadFile(file, conversationId.value)
      addMessage(`Uploaded: ${file.name}`, 'user')

      if (response?.message) {
        isTyping.value = true
        await new Promise(resolve => setTimeout(resolve, 900))
        isTyping.value = false
        addMessage(response.message, 'ai')
      }
    }
    catch (error) {
      console.error('AI file upload error', error)
      addMessage('File upload failed. Please try again.', 'ai')
    }
    finally {
      isSending.value = false
    }
  }

  const markAsRead = () => {
    unreadCount.value = 0
  }

  const clearConversation = () => {
    messages.value = []

    if (typeof window !== 'undefined')
      localStorage.removeItem(`ai_chat_${conversationId.value}`)

    conversationId.value = getOrCreateConversationId()
  }

  const setupOnlineStatus = () => {
    if (listenersAttached.value || typeof window === 'undefined')
      return

    const updateOnlineStatus = () => {
      isOnline.value = navigator.onLine
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    listenersAttached.value = true
  }

  const initialize = () => {
    conversationId.value = getOrCreateConversationId()
    loadConversationHistory()
    setupOnlineStatus()
  }

  return {
    messages: computed(() => messages.value),
    lastMessage,
    isTyping: computed(() => isTyping.value),
    isSending: computed(() => isSending.value),
    isOnline: computed(() => isOnline.value),
    unreadCount: computed(() => unreadCount.value),
    conversationId: computed(() => conversationId.value),
    initialize,
    sendMessage,
    uploadFile,
    markAsRead,
    clearConversation,
    addMessage,
  }
})
