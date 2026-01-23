import type { ActiveChat } from './useChat'
import { db } from '@db/apps/chat/db'
import type { ChatContact, ChatContactWithChat, ChatMessage, ChatOut } from '@db/apps/chat/types'

interface State {
  chatsContacts: ChatContactWithChat[]
  contacts: ChatContact[]
  profileUser: ChatContact | undefined
  activeChat: ActiveChat
}

export const useChatStore = defineStore('chat', {
  // ℹ️ arrow function recommended for full type inference
  state: (): State => ({
    contacts: [],
    chatsContacts: [],
    profileUser: undefined,
    activeChat: null,
  }),
  actions: {
    async fetchChatsAndContacts(q: string) {
      const { data, error } = await useApi<any>(createUrl('/apps/chat/chats-and-contacts', {
        query: {
          q,
        },
      }))

      const buildFallback = () => {
        const qLowered = (q || '').toLowerCase()
        const chatsContacts: ChatContactWithChat[] = db.chats
          .map(chat => {
            const contact = JSON.parse(JSON.stringify((db.contacts.find(c => c.id === chat.userId) as ChatContact)))

            contact.chat = { id: chat.id, unseenMsgs: chat.unseenMsgs, lastMessage: chat.messages.at(-1) }

            return contact
          })
          .reverse()

        this.chatsContacts = chatsContacts.filter(c => c.fullName.toLowerCase().includes(qLowered))
        this.contacts = db.contacts.filter(c => c.fullName.toLowerCase().includes(qLowered))
        this.profileUser = db.profileUser
      }

      if (error.value || !data.value) {
        buildFallback()
        return
      }

      const { chatsContacts, contacts, profileUser } = data.value

      if ((!chatsContacts || !chatsContacts.length) && (!contacts || !contacts.length)) {
        buildFallback()
        return
      }

      this.chatsContacts = chatsContacts
      this.contacts = contacts
      this.profileUser = profileUser
    },

    async getChat(userId: ChatContact['id']) {
      const res = await $api(`/apps/chat/chats/${userId}`)

      this.activeChat = res
    },

    async sendMsg(message: ChatMessage['message']) {
      const senderId = this.profileUser?.id

      const response = await $api(`apps/chat/chats/${this.activeChat?.contact.id}`, {
        method: 'POST',
        body: { message, senderId },
      })

      const { msg, chat }: { msg: ChatMessage; chat: ChatOut } = response

      // ? If it's not undefined => New chat is created (Contact is not in list of chats)
      if (chat !== undefined) {
        const activeChat = this.activeChat!

        this.chatsContacts.push({
          ...activeChat.contact,
          chat: {
            id: chat.id,
            lastMessage: [],
            unseenMsgs: 0,
            messages: [msg],
          },
        })

        if (this.activeChat) {
          this.activeChat.chat = {
            id: chat.id,
            messages: [msg],
            unseenMsgs: 0,
            userId: this.activeChat?.contact.id,
          }
        }
      }
      else {
        this.activeChat?.chat?.messages.push(msg)
      }

      // Set Last Message for active contact
      const contact = this.chatsContacts.find(c => {
        if (this.activeChat)
          return c.id === this.activeChat.contact.id

        return false
      }) as ChatContactWithChat

      contact.chat.lastMessage = msg
    },
  },
})
