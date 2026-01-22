import { ofetch } from 'ofetch'

export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1',
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value
    const headers = options.headers instanceof Headers
      ? options.headers
      : new Headers(options.headers)

    if (accessToken)
      headers.set('Authorization', `Bearer ${accessToken}`)

    options.headers = headers
  },
})
