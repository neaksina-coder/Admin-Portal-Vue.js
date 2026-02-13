interface AIChatPayload {
  message: string
  conversationId: string
  history?: Array<{
    text: string
    sender: 'user' | 'ai'
  }>
}

interface AIChatResponse {
  message?: string
  response?: string
}

const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || '/ai'
const AI_MOCK_ENABLED = import.meta.env.VITE_AI_MOCK === 'true'

const mockReplies = [
  'Sure — based on your business type, I recommend the Growth plan.',
  'You can get started in under 10 minutes. Want a quick checklist?',
  'Our AI analytics works best with weekly data syncs.',
  'For pricing, the Starter plan is a good fit for small teams.',
  'If you want, I can outline the onboarding steps.',
]

const mockDelay = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms))
const pickMockReply = () => mockReplies[Math.floor(Math.random() * mockReplies.length)]

const buildHistory = (history?: AIChatPayload['history']) => {
  if (!history)
    return []

  return history.map(item => ({
    role: item.sender === 'user' ? 'user' : 'assistant',
    content: item.text,
  }))
}

export const aiService = {
  async sendMessage(payload: AIChatPayload): Promise<AIChatResponse> {
    if (AI_MOCK_ENABLED) {
      await mockDelay()
      return {
        message: pickMockReply(),
      }
    }

    return await $api(`${AI_BASE_URL}/chat`, {
      method: 'POST',
      body: {
        message: payload.message,
        conversation_id: payload.conversationId,
        history: buildHistory(payload.history),
      },
    })
  },

  async uploadFile(file: File, conversationId: string): Promise<AIChatResponse> {
    if (AI_MOCK_ENABLED) {
      await mockDelay(800)
      return {
        message: `Got it. I received "${file.name}" and will review it now.`,
      }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversation_id', conversationId)

    return await $api(`${AI_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    })
  },
}
