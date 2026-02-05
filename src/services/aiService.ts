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
    const formData = new FormData()
    formData.append('file', file)
    formData.append('conversation_id', conversationId)

    return await $api(`${AI_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    })
  },
}
