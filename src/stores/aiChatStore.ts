import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type ChatSender = 'visitor' | 'ai' | 'admin'

export interface AIChatMessage {
  id: number | string
  text: string
  sender: ChatSender
  timestamp: string
  attachmentUrl?: string
  attachmentType?: string
  attachmentName?: string
  attachmentSize?: number
}

const CHAT_API_BASE = '/chat'
const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL || 'ws://127.0.0.1:8000/api/v1/chat/ws'
const BUSINESS_ID = Number(import.meta.env.VITE_BUSINESS_ID ?? 1)
const FORCE_REST_SEND = import.meta.env.VITE_CHAT_FORCE_REST === 'true'

const DUPLICATE_WINDOW_MS = 30000

export const useAIChatStore = defineStore('aiChat', () => {
  const messages = ref<AIChatMessage[]>([])
  const isTyping = ref(false)
  const isSending = ref(false)
  const isOnline = ref(true)
  const unreadCount = ref(0)
  const conversationId = ref('')
  const requiresProfile = ref(false)
  const visitorName = ref('')
  const visitorEmail = ref('')
  const visitorPhone = ref('')
  const visitorId = ref('')
  const listenersAttached = ref(false)
  const ws = ref<WebSocket | null>(null)
  const wsReady = ref(false)
  const messageIds = new Set<number | string>()
  const pollTimer = ref<ReturnType<typeof setInterval> | null>(null)

  const lastMessage = computed(() => messages.value[messages.value.length - 1])
  const hasVisitorName = computed(() => visitorName.value.trim().length > 0)

  const normalizeSender = (sender?: string): ChatSender => {
    if (sender === 'admin')
      return 'admin'
    if (sender === 'ai')
      return 'ai'
    return 'visitor'
  }

  const mapMessage = (item: any): AIChatMessage | null => {
    if (!item)
      return null

    const id = item.id ?? item.messageId ?? item.message_id
    const content = item.content ?? item.message ?? item.text
    const attachmentUrl = item.attachmentUrl ?? item.attachment_url
    const attachmentType = item.attachmentType ?? item.attachment_type
    const attachmentName = item.attachmentName ?? item.attachment_name
    const rawAttachmentSize = item.attachmentSize ?? item.attachment_size
    const attachmentSize = rawAttachmentSize === undefined || rawAttachmentSize === null
      ? undefined
      : Number(rawAttachmentSize)

    if (!content && !attachmentUrl)
      return null

    return {
      id: id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: content ? String(content) : '',
      sender: normalizeSender(item.senderType ?? item.sender_type ?? item.sender),
      timestamp: item.createdAt ?? item.created_at ?? new Date().toISOString(),
      attachmentUrl: attachmentUrl || undefined,
      attachmentType: attachmentType || undefined,
      attachmentName: attachmentName || undefined,
      attachmentSize: Number.isNaN(attachmentSize) ? undefined : attachmentSize,
    }
  }

  const isDuplicateMessage = (message: AIChatMessage) => {
    const last = messages.value[messages.value.length - 1]
    if (!last)
      return false
    if (last.sender !== message.sender)
      return false

    if (last.attachmentUrl || message.attachmentUrl) {
      if (!last.attachmentUrl || !message.attachmentUrl)
        return false
      if (last.attachmentUrl !== message.attachmentUrl)
        return false
    }
    else if (last.text !== message.text) {
      return false
    }

    const lastTime = new Date(last.timestamp).getTime()
    const nextTime = new Date(message.timestamp).getTime()
    if (Number.isNaN(lastTime) || Number.isNaN(nextTime))
      return false

    return Math.abs(nextTime - lastTime) <= DUPLICATE_WINDOW_MS
  }

  const appendMessage = (message: AIChatMessage) => {
    if (messageIds.has(message.id))
      return

    if (isDuplicateMessage(message))
      return

    messageIds.add(message.id)
    messages.value.push(message)

    if (message.sender !== 'visitor')
      unreadCount.value += 1
  }

  const getStoredConversationId = () => {
    if (typeof window === 'undefined')
      return ''

    return sessionStorage.getItem('ai_conversation_id') || ''
  }

  const storeConversationId = (id: string) => {
    if (typeof window === 'undefined')
      return

    sessionStorage.setItem('ai_conversation_id', id)
  }

  const getStoredVisitorId = () => {
    if (typeof window === 'undefined')
      return ''

    return sessionStorage.getItem('ai_visitor_id') || ''
  }

  const storeVisitorId = (id: string) => {
    if (typeof window === 'undefined')
      return

    sessionStorage.setItem('ai_visitor_id', id)
  }

  const clearStoredConversationId = () => {
    if (typeof window === 'undefined')
      return

    sessionStorage.removeItem('ai_conversation_id')
  }

  const clearStoredVisitorId = () => {
    if (typeof window === 'undefined')
      return

    sessionStorage.removeItem('ai_visitor_id')
  }

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value)

  const loadVisitorProfile = () => {
    if (typeof window === 'undefined')
      return

    visitorName.value = localStorage.getItem('visitor_name') || ''
    visitorEmail.value = localStorage.getItem('visitor_email') || ''
    visitorPhone.value = localStorage.getItem('visitor_phone') || ''
  }

  const buildVisitorPayload = () => {
    if (typeof window === 'undefined') {
      return {
        name: 'Visitor',
        email: '',
        phone: '',
        sourceUrl: '',
        referrer: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        timezone: '',
        language: '',
        browser: '',
        os: '',
        device: '',
        lastPage: '',
      }
    }

    const name = visitorName.value.trim() || 'Visitor'
    const email = visitorEmail.value.trim()
    const phone = visitorPhone.value.trim()

    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get('utm_source')
    const utmMedium = params.get('utm_medium')
    const utmCampaign = params.get('utm_campaign')

    const ua = navigator.userAgent || ''
    const isMobile = /Mobi|Android/i.test(ua)
    const browser = ua.includes('Chrome')
      ? 'Chrome'
      : ua.includes('Safari')
        ? 'Safari'
        : ua.includes('Firefox')
          ? 'Firefox'
          : 'Other'
    const os = ua.includes('Windows')
      ? 'Windows'
      : ua.includes('Mac')
        ? 'Mac'
        : ua.includes('Linux')
          ? 'Linux'
          : ua.includes('Android')
            ? 'Android'
            : ua.includes('iPhone') || ua.includes('iPad')
              ? 'iOS'
              : 'Other'
    const device = isMobile ? 'Mobile' : 'Desktop'

    return {
      name,
      ...(isValidEmail(email) ? { email } : {}),
      ...(phone ? { phone } : {}),
      sourceUrl: window.location.href,
      referrer: document.referrer || null,
      utmSource,
      utmMedium,
      utmCampaign,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      browser,
      os,
      device,
      lastPage: window.location.pathname,
    }
  }

  const setVisitorProfile = (name: string, email = '', phone = '') => {
    if (typeof window === 'undefined')
      return

    visitorName.value = name.trim()
    visitorEmail.value = email.trim()
    visitorPhone.value = phone.trim()
    localStorage.setItem('visitor_name', visitorName.value)
    localStorage.setItem('visitor_email', visitorEmail.value)
    localStorage.setItem('visitor_phone', visitorPhone.value)
    requiresProfile.value = false
  }

  const resetConversationState = () => {
    messages.value = []
    messageIds.clear()
    unreadCount.value = 0
    conversationId.value = ''
    clearStoredConversationId()
    visitorId.value = ''
    clearStoredVisitorId()

    if (ws.value)
      ws.value.close()

    ws.value = null
    wsReady.value = false
  }

  const handleConversationMissing = () => {
    resetConversationState()
    requiresProfile.value = true
    stopPolling()
  }

  const getErrorStatus = (error: unknown) => {
    return (error as any)?.response?.status
      ?? (error as any)?.status
      ?? (error as any)?.data?.status_code
  }

  const createConversation = async () => {
    const response = await $api(`${CHAT_API_BASE}/conversations`, {
      method: 'POST',
      body: {
        businessId: BUSINESS_ID,
        visitor: buildVisitorPayload(),
      },
    })

    const payload = response?.data ? response : response ?? {}
    const id = payload?.id
      ?? payload?.conversationId
      ?? payload?.conversation_id
      ?? payload?.data?.id
      ?? payload?.data?.conversationId
      ?? payload?.data?.conversation_id
    const visitor = payload?.visitor ?? payload?.data?.visitor ?? {}
    const visitorIdValue = payload?.visitorId
      ?? payload?.visitor_id
      ?? payload?.data?.visitorId
      ?? payload?.data?.visitor_id
      ?? visitor?.id
      ?? visitor?.visitorId
      ?? visitor?.visitor_id

    if (!id)
      throw new Error('Conversation id missing')

    conversationId.value = String(id)
    storeConversationId(conversationId.value)
    if (visitorIdValue) {
      visitorId.value = String(visitorIdValue)
      storeVisitorId(visitorId.value)
    }

    return conversationId.value
  }

  const loadConversationHistory = async () => {
    if (!conversationId.value)
      return

    const response = await $api(`${CHAT_API_BASE}/conversations/${conversationId.value}/messages`)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.messages ?? payload?.results ?? []

    messages.value = []
    messageIds.clear()

    if (!Array.isArray(list))
      return

    list
      .map(mapMessage)
      .filter((item): item is AIChatMessage => item !== null)
      .forEach(appendMessage)
  }

  const startPolling = (intervalMs = 3000) => {
    if (pollTimer.value)
      return

    pollTimer.value = setInterval(() => {
      loadConversationHistory().catch((error) => {
        const status = getErrorStatus(error)
        if (status === 404 || status === 410) {
          handleConversationMissing()
          return
        }

        console.error('Chat poll error', error)
      })
    }, intervalMs)
  }

  const stopPolling = () => {
    if (pollTimer.value) {
      clearInterval(pollTimer.value)
      pollTimer.value = null
    }
  }

  const handleWsMessage = (raw: MessageEvent<string>) => {
    try {
      const parsed = JSON.parse(raw.data)
      const data = parsed?.data ?? parsed
      const message = mapMessage(data)
      if (message)
        appendMessage(message)
    }
    catch (error) {
      console.error('Chat WS parse error', error)
    }
  }

  const connectWebSocket = () => {
    if (!conversationId.value)
      return

    if (ws.value && wsReady.value)
      return

    if (ws.value)
      ws.value.close()

    wsReady.value = false
    const socket = new WebSocket(`${CHAT_WS_URL}?conversationId=${conversationId.value}`)
    ws.value = socket

    socket.onopen = () => {
      wsReady.value = true
    }

    socket.onmessage = handleWsMessage

    socket.onclose = () => {
      wsReady.value = false
    }

    socket.onerror = () => {
      wsReady.value = false
    }
  }

  const ensureConversation = async () => {
    if (!hasVisitorName.value) {
      requiresProfile.value = true
      return
    }

    const id = getStoredConversationId()
    if (!id) {
      await createConversation()
      return
    }

    conversationId.value = id
    const storedVisitorId = getStoredVisitorId()
    if (storedVisitorId)
      visitorId.value = storedVisitorId
  }

  const sendMessage = async (text: string) => {
    if (requiresProfile.value || isSending.value || !text.trim())
      return

    isSending.value = true

    const trimmed = text.trim()
    const localMessage: AIChatMessage = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      sender: 'visitor',
      timestamp: new Date().toISOString(),
    }

    appendMessage(localMessage)

    const payload = {
      senderType: 'visitor',
      content: trimmed,
    }

    try {
      const canUseWs = ws.value && wsReady.value

      if (canUseWs)
        ws.value.send(JSON.stringify(payload))

      if (!canUseWs || FORCE_REST_SEND) {
        if (conversationId.value) {
          const response = await $api(`${CHAT_API_BASE}/conversations/${conversationId.value}/messages`, {
            method: 'POST',
            body: payload,
          })

          const data = response?.data ?? response
          const message = mapMessage(data)
          if (message)
            appendMessage(message)
        }
      }
    }
    catch (error) {
      const status = getErrorStatus(error)
      if (status === 404 || status === 410) {
        handleConversationMissing()
        return
      }

      console.error('Chat send error', error)
    }
    finally {
      isSending.value = false
    }
  }

  const uploadFile = async (_file: File) => {
    if (requiresProfile.value || isSending.value)
      return

    if (!conversationId.value) {
      await ensureConversation()
      if (!conversationId.value)
        return
    }

    isSending.value = true

    const formData = new FormData()
    formData.append('file', _file)
    formData.append('senderType', 'visitor')
    if (visitorId.value)
      formData.append('senderId', visitorId.value)
    formData.append('content', '')

    try {
      const response = await $api(`${CHAT_API_BASE}/conversations/${conversationId.value}/messages/image`, {
        method: 'POST',
        body: formData,
      })

      const data = response?.data ?? response
      const message = mapMessage(data)
      if (message)
        appendMessage(message)

      // Do not re-broadcast after upload; backend already creates the message.
    }
    catch (error) {
      const status = getErrorStatus(error)
      if (status === 404 || status === 410) {
        handleConversationMissing()
        return
      }

      console.error('Chat image upload error', error)
    }
    finally {
      isSending.value = false
    }
  }

  const uploadVisitorAvatar = async (file: File) => {
    if (!visitorId.value)
      return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      await $api(`${CHAT_API_BASE}/visitors/${visitorId.value}`, {
        method: 'PATCH',
        body: formData,
      })
    }
    catch (error) {
      console.error('Upload visitor avatar failed', error)
    }
  }

  const markAsRead = () => {
    unreadCount.value = 0
  }

  const clearConversation = async () => {
    if (!hasVisitorName.value) {
      requiresProfile.value = true
      return
    }
    if (requiresProfile.value)
      return

    resetConversationState()

    await createConversation()
    connectWebSocket()
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

  const initialize = async () => {
    loadVisitorProfile()
    await ensureConversation()
    if (requiresProfile.value)
      return

    try {
      await loadConversationHistory()
    }
    catch (error) {
      const status = getErrorStatus(error)
      if (status === 404 || status === 410) {
        handleConversationMissing()
        return
      }

      console.error('Failed to load conversation, creating new one', error)
      await createConversation()
    }

    connectWebSocket()
    setupOnlineStatus()
    startPolling()
  }

  return {
    messages: computed(() => messages.value),
    lastMessage,
    isTyping: computed(() => isTyping.value),
    isSending: computed(() => isSending.value),
    isOnline: computed(() => isOnline.value),
    unreadCount: computed(() => unreadCount.value),
    conversationId: computed(() => conversationId.value),
    requiresProfile: computed(() => requiresProfile.value),
    visitorName: computed(() => visitorName.value),
    visitorEmail: computed(() => visitorEmail.value),
    visitorPhone: computed(() => visitorPhone.value),
    visitorId: computed(() => visitorId.value),
    initialize,
    sendMessage,
    uploadFile,
    uploadVisitorAvatar,
    markAsRead,
    clearConversation,
    startPolling,
    stopPolling,
    setVisitorProfile,
    resetConversationState,
  }
})
