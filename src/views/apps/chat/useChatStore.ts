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
  _messageIds: Set<string | number>
  _messageKeys: Set<string>
}

const CHAT_API_BASE = '/chat'
const CHAT_WS_URL = import.meta.env.VITE_CHAT_WS_URL || 'ws://127.0.0.1:8000/api/v1/chat/ws'
const BUSINESS_ID = Number(import.meta.env.VITE_BUSINESS_ID ?? 1)
const ADMIN_ID = Number(import.meta.env.VITE_ADMIN_ID ?? 1)
const DUPLICATE_WINDOW_MS = 30000
const FORCE_REST_SEND = import.meta.env.VITE_CHAT_FORCE_REST === 'true'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

const resolveAssetUrl = (value?: string) => {
  if (!value)
    return ''

  if (value.startsWith('http://') || value.startsWith('https://'))
    return value

  const trimmed = value.startsWith('/') ? value.slice(1) : value
  return `${API_BASE_URL.replace(/\/$/, '')}/${trimmed}`
}

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
    _messageIds: new Set(),
    _messageKeys: new Set(),
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
      this._messageIds.clear()
      this._messageKeys.clear()
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
      const visitorId = Number(item?.visitorId ?? item?.visitor_id ?? visitor?.id ?? visitor?.visitorId ?? visitor?.visitor_id ?? 0)

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
      const avatar = resolveAssetUrl(visitor?.avatar
        ?? visitor?.avatarUrl
        ?? visitor?.avatar_url
        ?? item?.avatar
        ?? item?.avatarUrl
        ?? item?.avatar_url
        ?? '')

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
        avatar,
        status: 'online',
        chat: {
          id,
          unseenMsgs: Number(item?.unseen ?? item?.unreadCount ?? 0),
          messages: lastMsg ? [lastMessage] : [],
          lastMessage,
        },
      }

      ;(contact as any).visitor = visitor
      if (visitorId)
        ;(contact as any).visitorId = visitorId
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

    mapMessage(item: any, conversationId: number): (ChatMessage & { id?: string | number }) | null {
      if (!item)
        return null

      const id = item?.id ?? item?.messageId ?? item?.message_id
      const senderTypeRaw = item?.senderType ?? item?.sender_type ?? item?.sender
      const senderType = typeof senderTypeRaw === 'string' ? senderTypeRaw.toLowerCase() : ''
      const isVisitor = senderType === 'visitor' || senderType === 'user' || senderType === 'customer'

      const content = item?.content ?? item?.message ?? item?.text ?? item?.body ?? item?.msg
      const attachmentBlock = item?.attachment ?? item?.file ?? item?.media ?? {}
      const attachmentUrlRaw = item?.attachmentUrl
        ?? item?.attachment_url
        ?? attachmentBlock?.url
        ?? attachmentBlock?.path
        ?? attachmentBlock?.location
        ?? attachmentBlock?.attachmentUrl
        ?? attachmentBlock?.attachment_url
      const attachmentType = item?.attachmentType
        ?? item?.attachment_type
        ?? attachmentBlock?.type
        ?? attachmentBlock?.mime
        ?? attachmentBlock?.mimeType
        ?? attachmentBlock?.attachmentType
        ?? attachmentBlock?.attachment_type
      const attachmentName = item?.attachmentName
        ?? item?.attachment_name
        ?? attachmentBlock?.name
        ?? attachmentBlock?.filename
        ?? attachmentBlock?.originalName
        ?? attachmentBlock?.original_name
        ?? attachmentBlock?.attachmentName
        ?? attachmentBlock?.attachment_name
      const rawAttachmentSize = item?.attachmentSize
        ?? item?.attachment_size
        ?? attachmentBlock?.size
        ?? attachmentBlock?.bytes
        ?? attachmentBlock?.attachmentSize
        ?? attachmentBlock?.attachment_size
      const attachmentSize = rawAttachmentSize === undefined || rawAttachmentSize === null
        ? undefined
        : Number(rawAttachmentSize)

      if (!content && !attachmentUrlRaw)
        return null

      const attachmentUrl = attachmentUrlRaw ? resolveAssetUrl(String(attachmentUrlRaw)) : undefined

      return {
        id: id ?? undefined,
        message: content ? String(content) : '',
        time: item?.createdAt ?? item?.created_at ?? new Date().toISOString(),
        senderId: isVisitor ? conversationId : (this.profileUser?.id ?? ADMIN_ID),
        attachmentUrl,
        attachmentType: attachmentType || undefined,
        attachmentName: attachmentName || undefined,
        attachmentSize: Number.isNaN(attachmentSize) ? undefined : attachmentSize,
        feedback: {
          isSent: true,
          isDelivered: true,
          isSeen: !isVisitor,
        },
      }
    },

    buildMessageKey(message: ChatMessage & { id?: string | number }) {
      if (message.id !== undefined)
        return `id:${message.id}`

      const timeMs = new Date(message.time).getTime()
      const bucket = Number.isNaN(timeMs) ? 'na' : Math.floor(timeMs / 60000)
      const attachment = (message as any).attachmentUrl ?? ''
      if (attachment)
        return `img:${message.senderId}|${attachment}|${bucket}`

      return `txt:${message.senderId}|${message.message}|${bucket}`
    },

    shouldSkipMessage(list: (ChatMessage & { id?: string | number })[] | undefined, message: ChatMessage & { id?: string | number }) {
      if (message.id !== undefined && this._messageIds.has(message.id))
        return true
      if (this._messageKeys.has(this.buildMessageKey(message)))
        return true

      if (!list || list.length === 0)
        return false

      const last = list[list.length - 1]
      if (last.senderId !== message.senderId)
        return false

      if (last.attachmentUrl || message.attachmentUrl) {
        if (!last.attachmentUrl || !message.attachmentUrl)
          return false
        if (last.attachmentUrl !== message.attachmentUrl)
          return false
      }
      else if (last.message !== message.message) {
        return false
      }

      const lastTime = new Date(last.time).getTime()
      const nextTime = new Date(message.time).getTime()
      if (Number.isNaN(lastTime) || Number.isNaN(nextTime))
        return false

      return Math.abs(nextTime - lastTime) <= DUPLICATE_WINDOW_MS
    },

    appendToActiveChat(message: ChatMessage & { id?: string | number }) {
      if (!this.activeChat?.chat)
        return

      if (this.shouldSkipMessage(this.activeChat.chat.messages, message))
        return

      if (message.id !== undefined)
        this._messageIds.add(message.id)
      this._messageKeys.add(this.buildMessageKey(message))
      this.activeChat.chat.messages.push(message)
      this.activeChat.chat.lastMessage = message
    },

    appendToContact(conversationId: number, message: ChatMessage & { id?: string | number }, incrementUnseen = false) {
      const contact = this.chatsContacts.find(c => c.id === conversationId)
      if (!contact)
        return

      if (this.shouldSkipMessage(contact.chat.messages, message))
        return

      if (message.id !== undefined)
        this._messageIds.add(message.id)
      this._messageKeys.add(this.buildMessageKey(message))
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

      this._messageIds.clear()
      this._messageKeys.clear()
      const messages = Array.isArray(list)
        ? list
            .map((item: any) => this.mapMessage(item, conversationId))
            .filter((item): item is ChatMessage & { id?: string | number } => item !== null)
            .filter((item) => {
              const key = this.buildMessageKey(item)
              if (this._messageKeys.has(key))
                return false
              this._messageKeys.add(key)
              if (item.id !== undefined)
                this._messageIds.add(item.id)
              return true
            })
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

    async uploadVisitorAvatar(visitorId: number, file: File) {
      const formData = new FormData()
      formData.append('avatar', file)

      try {
        const response = await $api(`${CHAT_API_BASE}/visitors/${visitorId}/avatar`, {
          method: 'POST',
          body: formData,
        })

        const payload = response?.data ? response : response ?? {}
        const visitor = payload?.visitor ?? payload?.data?.visitor ?? payload?.data ?? payload
        const avatar = resolveAssetUrl(visitor?.avatar ?? visitor?.avatarUrl ?? visitor?.avatar_url ?? payload?.avatar ?? payload?.data?.avatar ?? '')

        if (!avatar)
          return

        this.chatsContacts = this.chatsContacts.map((contact) => {
          const meta = contact as any
          if (meta?.visitorId === visitorId) {
            meta.visitor = { ...(meta.visitor ?? {}), avatar }
            return { ...contact, avatar }
          }

          return contact
        })

        if ((this.activeChat?.contact as any)?.visitorId === visitorId) {
          ;(this.activeChat.contact as any).visitor = { ...((this.activeChat.contact as any).visitor ?? {}), avatar }
          this.activeChat.contact.avatar = avatar
        }
      }
      catch (error) {
        console.error('Upload visitor avatar failed', error)
      }
    },

    async uploadAdminAvatar(file: File) {
      const formData = new FormData()
      formData.append('avatar', file)

      try {
        const response = await $api(`${CHAT_API_BASE}/admins/me/avatar`, {
          method: 'POST',
          body: formData,
        })

        const payload = response?.data ? response : response ?? {}
        const avatar = resolveAssetUrl(payload?.avatar
          ?? payload?.avatarUrl
          ?? payload?.avatar_url
          ?? payload?.data?.avatar
          ?? payload?.data?.avatarUrl
          ?? payload?.data?.avatar_url
          ?? '')

        if (this.profileUser && avatar)
          this.profileUser.avatar = avatar
      }
      catch (error) {
        console.error('Upload admin avatar failed', error)
      }
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

    async uploadImage(file: File, caption = '') {
      if (!this.activeChat?.contact.id)
        return

      const conversationId = this.activeChat.contact.id
      const formData = new FormData()
      formData.append('file', file)
      formData.append('senderType', 'admin')
      formData.append('senderId', String(this.profileUser?.id ?? ADMIN_ID))
      formData.append('content', caption)

      try {
        const response = await $api(`${CHAT_API_BASE}/conversations/${conversationId}/messages/image`, {
          method: 'POST',
          body: formData,
        })

        const data = response?.data ?? response
        const msg = this.mapMessage(data, Number(conversationId))
        if (msg) {
          this.appendToActiveChat(msg)
          this.appendToContact(conversationId, msg)
        }

        // Do not re-broadcast after upload; backend already creates the message.
      }
      catch (error) {
        console.error('Admin image upload failed', error)
      }
    },
  },
})
