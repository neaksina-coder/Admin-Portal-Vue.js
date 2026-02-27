<script lang="ts" setup>
import type { Notification } from '@layouts/types'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

type ApiNotification = {
  id?: number | string
  title?: string
  body?: string
  message?: string
  content?: string
  type?: string
  linkUrl?: string
  link_url?: string
  icon?: string
  color?: string
  image?: string
  img?: string
  createdAt?: string
  created_at?: string
  updatedAt?: string
  updated_at?: string
  isRead?: boolean
  is_read?: boolean
  read?: boolean
  isSeen?: boolean
  is_seen?: boolean
  unread?: boolean
}

type UiNotification = Notification & { linkUrl?: string }

const router = useRouter()
const notifications = ref<UiNotification[]>([])
const ws = ref<WebSocket | null>(null)

const BUSINESS_ID = Number(import.meta.env.VITE_BUSINESS_ID ?? 1)
const API_BASE = import.meta.env.VITE_API_BASE
  || import.meta.env.VITE_API_BASE_URL
  || 'http://127.0.0.1:8000/api/v1'
const NOTIFICATIONS_WS_URL = import.meta.env.VITE_NOTIFICATIONS_WS_URL
  || `${API_BASE.replace(/^http/, 'ws').replace(/\/$/, '')}/notifications/ws`

const resolveTimeLabel = (value?: string) => {
  if (!value)
    return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()))
    return ''

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const startOfDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime()
  const diffDays = Math.floor((startOfToday - startOfDate) / (24 * 60 * 60 * 1000))

  if (diffDays === 0)
    return 'Today'
  if (diffDays === 1)
    return 'Yesterday'

  return parsed.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
  })
}

const pickSeenState = (item: ApiNotification) => {
  if (typeof item.isSeen === 'boolean')
    return item.isSeen
  if (typeof item.is_seen === 'boolean')
    return item.is_seen
  if (typeof item.isRead === 'boolean')
    return item.isRead
  if (typeof item.is_read === 'boolean')
    return item.is_read
  if (typeof item.read === 'boolean')
    return item.read
  if (typeof item.unread === 'boolean')
    return !item.unread
  return false
}

const normalizeNotification = (item: ApiNotification): UiNotification | null => {
  if (!item)
    return null

  const rawId = item.id ?? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const numericId = Number(rawId)
  const id = Number.isFinite(numericId) ? numericId : Date.now()
  const title = item.title || item.type || 'Notification'
  const subtitle = item.body || item.message || item.content || ''
  const time = resolveTimeLabel(item.createdAt || item.created_at || item.updatedAt || item.updated_at)
  const linkUrl = item.linkUrl || item.link_url || undefined
  const isSeen = pickSeenState(item)
  const icon = item.icon || 'tabler-bell'
  const color = item.color || (item.type === 'chat' ? 'primary' : undefined)

  if (item.img || item.image) {
    return {
      id,
      title,
      subtitle,
      time,
      isSeen,
      img: item.img || item.image || '',
      color,
      linkUrl,
    }
  }

  return {
    id,
    title,
    subtitle,
    time,
    isSeen,
    icon,
    color,
    linkUrl,
  }
}

const upsertNotification = (notification: UiNotification) => {
  const existingIndex = notifications.value.findIndex(item => item.id === notification.id)
  if (existingIndex >= 0) {
    notifications.value.splice(existingIndex, 1, notification)
    return
  }

  notifications.value.unshift(notification)
  if (notifications.value.length > 20)
    notifications.value = notifications.value.slice(0, 20)
}

const fetchNotifications = async () => {
  try {
    const response = await $api(`/notifications?businessId=${BUSINESS_ID}&skip=0&limit=20&unreadOnly=false`)
    const payload = response?.data ? response : response ?? {}
    const list = payload?.items ?? payload?.data ?? payload?.results ?? payload?.notifications ?? []

    if (!Array.isArray(list)) {
      notifications.value = []
      return
    }

    notifications.value = list
      .map((item: ApiNotification) => normalizeNotification(item))
      .filter((item): item is UiNotification => item !== null)
  }
  catch (error) {
    console.error('Failed to load notifications', error)
  }
}

const connectWs = () => {
  const token = useCookie('accessToken').value
  if (!token)
    return

  if (ws.value)
    ws.value.close()

  ws.value = new WebSocket(`${NOTIFICATIONS_WS_URL}?businessId=${BUSINESS_ID}&token=${token}`)

  ws.value.onmessage = (evt: MessageEvent<string>) => {
    try {
      const parsed = JSON.parse(evt.data)
      const data = parsed?.data ?? parsed
      const mapped = normalizeNotification(data)
      if (mapped) {
        mapped.isSeen = false
        upsertNotification(mapped)
      }
    }
    catch (error) {
      console.error('Notification WS parse error', error)
    }
  }

  ws.value.onclose = () => {
    ws.value = null
  }

  ws.value.onerror = () => {
    ws.value = null
  }
}

const removeNotification = async (notificationId: number) => {
  try {
    await $api(`/notifications/${notificationId}`, { method: 'DELETE' })
  }
  catch (error) {
    const status = (error as any)?.response?.status ?? (error as any)?.status
    if (status !== 404)
      console.error('Delete notification failed', error)
  }
  notifications.value = notifications.value.filter(item => item.id !== notificationId)
}

const markRead = async (notificationIds: number[]) => {
  const allIds = notifications.value.map(item => Number(item.id)).filter(id => Number.isFinite(id))
  const isMarkAll = notificationIds.length === allIds.length

  try {
    if (isMarkAll) {
      await $api(`/notifications/read-all?businessId=${BUSINESS_ID}`, { method: 'POST' })
    }
    else {
      await Promise.all(notificationIds.map(id => $api(`/notifications/${id}/read`, { method: 'POST' })))
    }
  }
  catch (error) {
    console.error('Mark read failed', error)
  }

  notifications.value = notifications.value.map((item) => {
    if (notificationIds.includes(Number(item.id)))
      return { ...item, isSeen: true }
    return item
  })
}

const markUnRead = (notificationIds: number[]) => {
  notifications.value = notifications.value.map((item) => {
    if (notificationIds.includes(Number(item.id)))
      return { ...item, isSeen: false }
    return item
  })
}

const handleNotificationClick = async (notification: UiNotification) => {
  if (!notification.isSeen)
    await markRead([Number(notification.id)])

  if (notification.linkUrl)
    router.push(notification.linkUrl)
}

onMounted(() => {
  fetchNotifications()
  connectWs()
})

onBeforeUnmount(() => {
  if (ws.value)
    ws.value.close()
})
</script>

<template>
  <Notifications
    :notifications="notifications"
    @remove="removeNotification"
    @read="markRead"
    @unread="markUnRead"
    @click:notification="handleNotificationClick"
  />
</template>
