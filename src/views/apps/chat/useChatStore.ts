import type { ActiveChat } from './useChat'
import type { ChatContact, ChatContactWithChat, ChatMessage } from '@db/apps/chat/types'

interface State {
  chatsContacts: ChatContactWithChat[]
  contacts: ChatContact[]
  profileUser: ChatContact | undefined
  activeChat: ActiveChat
  _ws: WebSocket | null
  _wsConversationId: number | null
  _pollTimer: ReturnType<typeof setInterval> | null
  _lastQuery: string
  _messagesPollTimer: ReturnType<typeof setInterval> | null
  _messagesPollId: number | null
}

const CHAT_API_BASE = '/chat'
const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL || 'ws://127.0.0.1:8000/api/v1/chat/ws'
const BUSINESS_ID = Number(import.meta.env.VITE_BUSINESS_ID ?? 1)
const ADMIN_ID = Number(import.meta.env.VITE_ADMIN_ID ?? 1)
const DUPLICATE_WINDOW_MS = 30000
const FORCE_REST_SEND = import.meta.env.VITE_CHAT_FORCE_REST === 'true'

export const useChatStore = defineStore('chat', {
  state: (): State => ({
    contacts: [],
    chatsContacts: [],
    profileUser: undefined,
    activeChat: null,
    _ws: null,
    _wsConversationId: null,
    _pollTimer: null,
    _lastQuery: '',
    _messagesPollTimer: null,
    _messagesPollId: null,
  }),
  actions: {
    clearActiveChat() {
      if (this._ws) {
        this._ws.close()
        this._ws = null
        this._wsConversationId = null
      }

      if (this._messagesPollTimer) {
        clearInterval(this._messagesPollTimer)
        this._messagesPollTimer = null
      }

      this._messagesPollId = null
      this.activeChat = null
    },
    ensureProfileUser() {
      if (!this.profileUser) {
        this.profileUser = {
          id: ADMIN_ID,
          fullName: 'Admin',
          role: 'Support',
          about: 'Support admin',
          avatar: '',
          status: 'online',
        }
      }
    },

    normalizeConversation(item: any): ChatContactWithChat {
      const id = Number(item?.id ?? item?.conversationId ?? item?.conversation_id)
      const visitor = item?.visitor
        ?? item?.chatVisitor
        ?? item?.chat_visitor
        ?? item?.user
        ?? item?.customer
        ?? item?.client
        ?? item?.lead
        ?? {}

      const rawName = visitor?.name
        ?? visitor?.fullName
        ?? visitor?.full_name
        ?? visitor?.displayName
        ?? item?.visitorName
        ?? item?.visitor_name
        ?? item?.fullName
        ?? item?.full_name
        ?? item?.name
        ?? ''

      const firstName = visitor?.firstName ?? visitor?.first_name ?? ''
      const lastName = visitor?.lastName ?? visitor?.last_name ?? ''
      const composedName = `${firstName} ${lastName}`.trim()

      const email = visitor?.email ?? item?.visitorEmail ?? item?.visitor_email ?? item?.email ?? ''
      const phone = visitor?.phone ?? visitor?.phoneNumber ?? visitor?.phone_number ?? item?.visitorPhone ?? item?.visitor_phone ?? item?.phone ?? ''
      const sourceUrl = visitor?.sourceUrl ?? visitor?.source_url ?? item?.sourceUrl ?? item?.source_url ?? ''
      const referrer = visitor?.referrer ?? item?.referrer ?? ''
      const utmSource = visitor?.utmSource ?? visitor?.utm_source ?? item?.utmSource ?? item?.utm_source ?? ''
      const utmMedium = visitor?.utmMedium ?? visitor?.utm_medium ?? item?.utmMedium ?? item?.utm_medium ?? ''
      const utmCampaign = visitor?.utmCampaign ?? visitor?.utm_campaign ?? item?.utmCampaign ?? item?.utm_campaign ?? ''
      const timezone = visitor?.timezone ?? item?.timezone ?? ''
      const language = visitor?.language ?? item?.language ?? ''
      const browser = visitor?.browser ?? item?.browser ?? ''
      const os = visitor?.os ?? item?.os ?? ''
      const device = visitor?.device ?? item?.device ?? ''
      const lastPage = visitor?.lastPage ?? visitor?.last_page ?? item?.lastPage ?? item?.last_page ?? ''
      const fallbackName = Number.isFinite(id) ? `Visitor ${id}` : 'Visitor'
      const fullName = (String(rawName).trim() || composedName || String(email).trim() || fallbackName)
      const about = String(
        email
          || visitor?.sourceUrl
          || visitor?.source_url
          || item?.sourceUrl
          || item?.source_url
          || 'Website visitor',
      ).trim()
      const lastMsg = item?.lastMessage ?? item?.last_message ?? item?.latestMessage ?? null

      const lastMessage: ChatMessage = {
        message: lastMsg?.content ?? lastMsg?.message ?? '',
        time: lastMsg?.createdAt ?? lastMsg?.created_at ?? new Date().toISOString(),
        senderId: id,
        feedback: {
          isSent: true,
          isDelivered: true,
          isSeen: false,
        },
      }

      const contact: ChatContactWithChat = {
        id,
        fullName,
        role: 'Website Visitor',
        about,
        avatar: '',
        status: 'online',
        chat: {
          id,
          unseenMsgs: Number(item?.unseen ?? item?.unreadCount ?? 0),
          messages: lastMsg ? [lastMessage] : [],
          lastMessage,
        },
      }

      ;(contact as any).visitor = visitor
      if (email)
        ;(contact as any).email = email
      if (phone)
        ;(contact as any).phone = phone
      if (sourceUrl)
        ;(contact as any).sourceUrl = sourceUrl
      if (referrer)
        ;(contact as any).referrer = referrer
      if (utmSource)
        ;(contact as any).utmSource = utmSource
      if (utmMedium)
        ;(contact as any).utmMedium = utmMedium
      if (utmCampaign)
        ;(contact as any).utmCampaign = utmCampaign
      if (timezone)
        ;(contact as any).timezone = timezone
      if (language)
        ;(contact as any).language = language
      if (browser)
        ;(contact as any).browser = browser
      if (os)
        ;(contact as any).os = os
      if (device)
        ;(contact as any).device = device
      if (lastPage)
        ;(contact as any).lastPage = lastPage

      return contact
    },

    mapMessage(item: any, conversationId: number): ChatMessage | null {
      if (!item)
        return null

      const senderTypeRaw = item?.senderType ?? item?.sender_type ?? item?.sender
      const senderType = typeof senderTypeRaw === 'string' ? senderTypeRaw.toLowerCase() : ''
      const isVisitor = senderType === 'visitor' || senderType === 'user' || senderType === 'customer'

      const content = item?.content ?? item?.message ?? item?.text ?? item?.body ?? item?.msg
      if (!content)
        return null

      return {
        message: String(content),
        time: item?.createdAt ?? item?.created_at ?? new Date().toISOString(),
        senderId: isVisitor ? conversationId : (this.profileUser?.id ?? ADMIN_ID),
        feedback: {
          isSent: true,
          isDelivered: true,
          isSeen: !isVisitor,
        },
      }
    },

    shouldSkipMessage(list: ChatMessage[] | undefined, message: ChatMessage) {
      if (!list || list.length === 0)
        return false

      const last = list[list.length - 1]
      if (last.senderId !== message.senderId)
        return false
      if (last.message !== message.message)
        return false

      const lastTime = new Date(last.time).getTime()
      const nextTime = new Date(message.time).getTime()
      if (Number.isNaN(lastTime) || Number.isNaN(nextTime))
        return false

      return Math.abs(nextTime - lastTime) <= DUPLICATE_WINDOW_MS
    },

    appendToActiveChat(message: ChatMessage) {
      if (!this.activeChat?.chat)
        return

      if (this.shouldSkipMessage(this.activeChat.chat.messages, message))
        return

      this.activeChat.chat.messages.push(message)
      this.activeChat.chat.lastMessage = message
    },

    appendToContact(conversationId: number, message: ChatMessage, incrementUnseen = false) {
      const contact = this.chatsContacts.find(c => c.id === conversationId)
      if (!contact)
        return

      if (this.shouldSkipMessage(contact.chat.messages, message))
        return

      contact.chat.messages.push(message)
      contact.chat.lastMessage = message
      if (incrementUnseen)
        contact.chat.unseenMsgs += 1
    },

    async fetchChatsAndContacts(q: string) {
      this.ensureProfileUser()
      this._lastQuery = q

      try {
        const url = `${CHAT_API_BASE}/conversations?businessId=${BUSINESS_ID}${q ? `&q=${encodeURIComponent(q)}` : ''}`
        const response = await $api(url)
        const payload = response?.data ? response : response ?? {}
        const list = payload?.items ?? payload?.data ?? payload?.conversations ?? payload?.results ?? []

        if (!Array.isArray(list)) {
          this.chatsContacts = []
          this.contacts = []
          return
        }

        this.chatsContacts = list.map((item: any) => this.normalizeConversation(item))
        this.contacts = []

        if (this.activeChat?.contact?.id) {
          const updated = this.chatsContacts.find(c => c.id === this.activeChat?.contact.id)
          if (updated)
            this.activeChat.contact = updated
        }
      }
      catch (error) {
        console.error(error)
        this.chatsContacts = []
        this.contacts = []
      }
    },

    startPolling(intervalMs = 5000) {
      if (this._pollTimer)
        return

      this._pollTimer = setInterval(() => {
        this.fetchChatsAndContacts(this._lastQuery)
      }, intervalMs)
    },

    stopPolling() {
      if (this._pollTimer) {
        clearInterval(this._pollTimer)
        this._pollTimer = null
      }

      if (this._messagesPollTimer) {
        clearInterval(this._messagesPollTimer)
        this._messagesPollTimer = null
      }
      this._messagesPollId = null
    },

    startMessagesPolling(conversationId: number, intervalMs = 3000) {
      if (this._messagesPollTimer && this._messagesPollId === conversationId)
        return

      if (this._messagesPollTimer) {
        clearInterval(this._messagesPollTimer)
        this._messagesPollTimer = null
      }

      this._messagesPollId = conversationId
      this._messagesPollTimer = setInterval(() => {
        this.fetchMessagesForConversation(conversationId).catch(error => console.error(error))
      }, intervalMs)
    },

    async fetchMessagesForConversation(conversationId: number) {
      const response = await $api(`${CHAT_API_BASE}/conversations/${conversationId}/messages`)
      const payload = response?.data ? response : response ?? {}
      const list = payload?.items
        ?? payload?.data?.items
        ?? payload?.data?.messages
        ?? payload?.data?.results
        ?? payload?.data
        ?? payload?.messages
        ?? payload?.results
        ?? []

      const messages = Array.isArray(list)
        ? list
            .map((item: any) => this.mapMessage(item, conversationId))
            .filter((item): item is ChatMessage => item !== null)
        : []

      if (this.activeChat?.chat && this.activeChat.contact.id === conversationId) {
        this.activeChat.chat.messages = messages
        this.activeChat.chat.unseenMsgs = 0
        if (messages.length)
          this.activeChat.chat.lastMessage = messages[messages.length - 1]
      }

      const contact = this.chatsContacts.find(c => c.id === conversationId)
      if (contact) {
        contact.chat.messages = messages
        contact.chat.unseenMsgs = 0
        if (messages.length)
          contact.chat.lastMessage = messages[messages.length - 1]
      }
    },

    async markConversationRead(conversationId: number) {
      try {
        await $api(`${CHAT_API_BASE}/conversations/${conversationId}/read`, {
          method: 'POST',
        })
      }
      catch (error) {
        console.error('Mark read failed', error)
      }

      if (this.activeChat?.contact.id === conversationId) {
        this.activeChat.chat.unseenMsgs = 0
      }

      const contact = this.chatsContacts.find(c => c.id === conversationId)
      if (contact)
        contact.chat.unseenMsgs = 0
    },

    async getChat(conversationId: ChatContact['id']) {
      this.ensureProfileUser()

      const existing = this.chatsContacts.find(c => c.id === conversationId)
      if (!existing) {
        this.activeChat = {
          contact: {
            id: conversationId,
            fullName: `Visitor ${conversationId}`,
            role: 'Website Visitor',
            about: 'Website visitor',
            avatar: '',
            status: 'online',
          },
          chat: {
            id: conversationId,
            unseenMsgs: 0,
            messages: [],
            lastMessage: {
              message: '',
              time: new Date().toISOString(),
              senderId: conversationId,
              feedback: { isSent: true, isDelivered: true, isSeen: false },
            },
          },
        }
      }
      else {
        this.activeChat = {
          contact: existing,
          chat: existing.chat,
        }
      }

      try {
        await this.fetchMessagesForConversation(Number(conversationId))
        await this.markConversationRead(Number(conversationId))
        this.connectWebSocket(Number(conversationId))
        this.startMessagesPolling(Number(conversationId))
      }
      catch (error) {
        console.error(error)
      }
    },

    async deleteConversation(conversationId: number) {
      try {
        await $api(`${CHAT_API_BASE}/conversations/${conversationId}`, {
          method: 'DELETE',
        })
      }
      catch (error) {
        const status = (error as any)?.response?.status
          ?? (error as any)?.status
          ?? (error as any)?.data?.status_code

        if (status !== 404)
          console.error('Delete conversation failed', error)
      }

      this.chatsContacts = this.chatsContacts.filter(contact => contact.id !== conversationId)
      this.contacts = this.contacts.filter(contact => contact.id !== conversationId)

      if (this.activeChat?.contact.id === conversationId)
        this.clearActiveChat()

      await this.fetchChatsAndContacts(this._lastQuery)
    },

    connectWebSocket(conversationId: number) {
      if (this._ws && this._wsConversationId === conversationId)
        return

      if (this._ws)
        this._ws.close()

      this._wsConversationId = conversationId
      this._ws = new WebSocket(`${CHAT_WS_URL}?conversationId=${conversationId}`)

      this._ws.onmessage = (evt: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(evt.data)
          const data = parsed?.data ?? parsed
          const message = this.mapMessage(data, conversationId)
          if (!message)
            return

          if (this.activeChat?.contact.id === conversationId) {
            this.appendToActiveChat(message)
            void this.markConversationRead(conversationId)
          }

          const incrementUnseen = this.activeChat?.contact.id !== conversationId
          this.appendToContact(conversationId, message, incrementUnseen)
        }
        catch (error) {
          console.error('Chat WS parse error', error)
        }
      }

      this._ws.onclose = () => {
        this._ws = null
        this._wsConversationId = null
      }

      this._ws.onerror = () => {
        this._ws = null
        this._wsConversationId = null
      }
    },

    async sendMsg(message: ChatMessage['message']) {
      if (!this.activeChat?.contact.id)
        return

      const conversationId = this.activeChat.contact.id
      const timestamp = new Date().toISOString()

      const localMessage: ChatMessage = {
        message,
        time: timestamp,
        senderId: this.profileUser?.id ?? ADMIN_ID,
        feedback: {
          isSent: true,
          isDelivered: true,
          isSeen: true,
        },
      }

      this.appendToActiveChat(localMessage)
      this.appendToContact(conversationId, localMessage)

      const payload = {
        senderType: 'admin',
        senderId: this.profileUser?.id ?? ADMIN_ID,
        content: message,
      }

      try {
        const canUseWs = this._ws && this._ws.readyState === WebSocket.OPEN

        if (canUseWs)
          this._ws.send(JSON.stringify(payload))

        if (!canUseWs || FORCE_REST_SEND) {
          const response = await $api(`${CHAT_API_BASE}/conversations/${conversationId}/messages`, {
            method: 'POST',
            body: payload,
          })

          const data = response?.data ?? response
          const msg = this.mapMessage(data, Number(conversationId))
          if (msg) {
            this.appendToActiveChat(msg)
            this.appendToContact(conversationId, msg)
          }
        }
      }
      catch (error) {
        console.error(error)
      }
    },
  },
})
