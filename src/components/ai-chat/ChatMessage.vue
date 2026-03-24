<template>
  <div :class="['ai-message', message.sender === 'visitor' ? 'ai-message-user' : 'ai-message-ai']">
    <div
      v-if="message.sender !== 'visitor'"
      class="ai-message-avatar"
    >
      <img
        v-if="aiAvatar && message.sender === 'ai'"
        :src="aiAvatar"
        alt="AI"
      >
      <span
        v-else
        class="ai-message-avatar-fallback"
      >
        {{ message.sender === 'admin' ? 'AD' : 'AI' }}
      </span>
    </div>
    <div class="ai-message-bubble">
      <div
        v-if="isImage"
        class="ai-attachment-image"
      >
        <img
          :src="message.attachmentUrl"
          :alt="message.attachmentName || 'Image attachment'"
        >
      </div>
      <div
        v-else-if="hasAttachment"
        class="ai-attachment-file"
      >
        <span class="ai-attachment-icon">
          <svg viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>
        <div class="ai-attachment-meta">
          <span class="ai-attachment-name">{{ message.attachmentName || 'Attachment' }}</span>
          <span
            v-if="formattedSize"
            class="ai-attachment-size"
          >
            {{ formattedSize }}
          </span>
        </div>
      </div>
      <p
        v-if="formattedContent"
        v-html="formattedContent"
      />
      <span class="ai-message-time">{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ChatMessagePayload {
  id: number | string
  text: string
  sender: 'visitor' | 'ai' | 'admin'
  timestamp: string
  attachmentUrl?: string
  attachmentType?: string
  attachmentName?: string
  attachmentSize?: number
}

const props = defineProps({
  message: {
    type: Object as () => ChatMessagePayload,
    required: true,
  },
  aiAvatar: {
    type: String,
    default: '',
  },
})

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const normalizeTagColor = (value: string) => {
  const color = value.trim().toLowerCase()
  const allowed = new Set(['green', 'red', 'blue', 'orange', 'yellow', 'purple', 'gray', 'grey'])
  if (!allowed.has(color))
    return 'accent'
  return color === 'grey' ? 'gray' : color
}

const toInlineHtml = (value: string) => {
  return value
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

const extractFontTags = (raw: string) => {
  let index = 0
  const tokenMap = new Map<string, string>()
  const tokenized = raw.replace(/<font\s+color=['"]?([^'">]+)['"]?\s*>([\s\S]*?)<\/font>/gi, (_match, color, text) => {
    const safeColor = normalizeTagColor(String(color))
    const safeText = toInlineHtml(escapeHtml(String(text).trim()))
    const token = `__AI_TAG_${index++}__`
    tokenMap.set(token, `<span class="ai-tag ai-tag--${safeColor}">${safeText}</span>`)
    return token
  })
  return { tokenized, tokenMap }
}

const injectTokens = (html: string, tokenMap: Map<string, string>) => {
  let result = html
  for (const [token, value] of tokenMap.entries())
    result = result.split(token).join(value)
  return result
}

const renderList = (items: string[], ordered: boolean) => {
  const tag = ordered ? 'ol' : 'ul'
  return `<${tag}>${items.map(item => `<li>${item}</li>`).join('')}</${tag}>`
}

const renderMessageHtml = (raw: string) => {
  if (!raw.trim())
    return ''

  const { tokenized, tokenMap } = extractFontTags(raw)
  const lines = tokenized.split(/\r?\n/)
  let html = ''
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (!paragraph.length)
      return
    html += `<p>${paragraph.join('<br>')}</p>`
    paragraph = []
  }

  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      index += 1
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)/)
    if (headingMatch) {
      flushParagraph()
      const level = headingMatch[1].length
      const content = injectTokens(toInlineHtml(escapeHtml(headingMatch[2])), tokenMap)
      const tag = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
      html += `<${tag}>${content}</${tag}>`
      index += 1
      continue
    }

    const orderedMatch = trimmed.match(/^\d+[\.\)]\s+(.+)/)
    const unorderedMatch = trimmed.match(/^[-*•]\s+(.+)/)

    if (orderedMatch || unorderedMatch) {
      flushParagraph()
      const items: string[] = []
      const ordered = Boolean(orderedMatch)

      while (index < lines.length) {
        const current = lines[index].trim()
        if (!current)
          break

        const match = ordered
          ? current.match(/^\d+[\.\)]\s+(.+)/)
          : current.match(/^[-*•]\s+(.+)/)

        if (!match)
          break

        const content = injectTokens(toInlineHtml(escapeHtml(match[1])), tokenMap)
        items.push(content)
        index += 1
      }

      html += renderList(items, ordered)
      continue
    }

    paragraph.push(injectTokens(toInlineHtml(escapeHtml(trimmed)), tokenMap))
    index += 1
  }

  flushParagraph()
  return injectTokens(html, tokenMap)
}

const formattedContent = computed(() => {
  if (!props.message.text)
    return ''

  return renderMessageHtml(props.message.text)
})

const hasAttachment = computed(() => Boolean(props.message.attachmentUrl))
const isImage = computed(() => Boolean(props.message.attachmentUrl && props.message.attachmentType?.startsWith('image/')))

const formattedSize = computed(() => {
  const size = props.message.attachmentSize
  if (!size || Number.isNaN(size))
    return ''

  if (size < 1024)
    return `${size} B`

  const kb = size / 1024
  if (kb < 1024)
    return `${kb.toFixed(1)} KB`

  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
})

const formattedTime = computed(() => {
  return new Date(props.message.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<style scoped>
/* ── Design tokens ─────────────────────────────────────────── */
:root {
  --msg-font: 'DM Sans', 'Sora', ui-sans-serif, system-ui, sans-serif;
  --msg-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

  --surface-ai:      rgba(255, 255, 255, 0.055);
  --border-ai:       rgba(255, 255, 255, 0.09);
  --surface-user:    linear-gradient(135deg, #c96a1a 0%, #e8430c 50%, #ff6b35 100%);
  --surface-attach:  rgba(255, 255, 255, 0.06);

  --text-primary:    #f0ede8;
  --text-muted:      rgba(240, 237, 232, 0.42);
  --accent:          #f97316;
  --accent-glow:     rgba(249, 115, 22, 0.28);

  --avatar-bg:       rgba(249, 115, 22, 0.12);
  --avatar-border:   rgba(249, 115, 22, 0.25);
  --avatar-text:     #f97316;

  --radius-bubble:   20px;
  --radius-avatar:   14px;
  --radius-attach:   14px;
  --shadow-bubble:   0 2px 16px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255,255,255,0.04) inset;
  --shadow-user:     0 4px 24px rgba(233, 67, 12, 0.32), 0 1px 0 rgba(255,255,255,0.12) inset;
}

/* ── Wrapper ───────────────────────────────────────────────── */
.ai-message {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  max-width: 74%;
  animation: messageEnter 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
  font-family: var(--msg-font);
}

.ai-message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.ai-message-ai {
  align-self: flex-start;
}

/* ── Avatar ────────────────────────────────────────────────── */
.ai-message-avatar {
  flex-shrink: 0;
  position: relative;
}

.ai-message-avatar::after {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: calc(var(--radius-avatar) + 2px);
  background: conic-gradient(from 180deg, #f97316, #fb923c, #f97316);
  z-index: -1;
  opacity: 0.55;
}

.ai-message-avatar img,
.ai-message-avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-avatar);
  object-fit: cover;
  display: grid;
  place-items: center;
  background: var(--avatar-bg);
  border: 1.5px solid var(--avatar-border);
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--avatar-text);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ── Bubble ────────────────────────────────────────────────── */
.ai-message-bubble {
  position: relative;
  background: var(--surface-ai);
  border: 1px solid var(--border-ai);
  border-radius: var(--radius-bubble);
  border-bottom-left-radius: 6px;
  padding: 12px 16px 10px;
  color: var(--text-primary);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  box-shadow: var(--shadow-bubble);
  transition: box-shadow 0.2s ease;
}

.ai-message-bubble::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(160deg, rgba(255,255,255,0.06) 0%, transparent 60%);
  pointer-events: none;
}

.ai-message-user .ai-message-bubble {
  background: var(--surface-user);
  border-color: transparent;
  border-bottom-left-radius: var(--radius-bubble);
  border-bottom-right-radius: 6px;
  box-shadow: var(--shadow-user);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.ai-message-user .ai-message-bubble::before {
  background: linear-gradient(140deg, rgba(255,255,255,0.14) 0%, transparent 55%);
}

/* ── Typography inside bubble ──────────────────────────────── */
.ai-message-bubble p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.6;
  font-weight: 400;
  word-break: break-word;
  letter-spacing: 0.01em;
}

.ai-message-bubble h2,
.ai-message-bubble h3,
.ai-message-bubble h4 {
  margin: 0 0 6px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.3;
}

.ai-message-bubble h2 { font-size: 16px; }
.ai-message-bubble h3 { font-size: 14.5px; }
.ai-message-bubble h4 { font-size: 13.5px; opacity: 0.85; }

.ai-message-bubble ul,
.ai-message-bubble ol {
  margin: 6px 0 0 16px;
  padding: 0;
  display: grid;
  gap: 5px;
  font-size: 14.5px;
  line-height: 1.55;
}

.ai-message-bubble li {
  margin: 0;
  padding-left: 2px;
}

.ai-message-bubble ul li::marker {
  color: var(--accent);
}

.ai-message-bubble strong {
  font-weight: 650;
  color: inherit;
}

.ai-message-bubble code {
  font-family: var(--msg-mono);
  font-size: 0.875em;
  padding: 2px 7px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-variant-ligatures: none;
}

.ai-message-user .ai-message-bubble code {
  background: rgba(0, 0, 0, 0.18);
  border-color: rgba(255, 255, 255, 0.15);
}

/* ── Attachment — image ────────────────────────────────────── */
.ai-attachment-image {
  border-radius: var(--radius-attach);
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.ai-attachment-image img {
  display: block;
  max-width: min(300px, 68vw);
  height: auto;
}

.ai-message-bubble:has(.ai-attachment-image):not(:has(p)) {
  padding: 8px 8px 10px;
  width: fit-content;
  max-width: 100%;
}

/* ── Attachment — file ─────────────────────────────────────── */
.ai-attachment-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 13px;
  background: var(--surface-attach);
  border: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 10px;
  transition: background 0.2s;
}

.ai-attachment-file:hover {
  background: rgba(255, 255, 255, 0.1);
}

.ai-message-user .ai-attachment-file {
  background: rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.12);
}

.ai-attachment-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.2);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--accent);
}

.ai-message-user .ai-attachment-icon {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.25);
  color: white;
}

.ai-attachment-icon svg {
  width: 17px;
  height: 17px;
  stroke: currentColor;
  stroke-width: 1.75px;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ai-attachment-meta {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.ai-attachment-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.01em;
}

.ai-attachment-size {
  font-size: 11px;
  opacity: 0.5;
  font-weight: 400;
}

/* ── Timestamp ─────────────────────────────────────────────── */
.ai-message-time {
  display: block;
  margin-top: 7px;
  font-size: 10.5px;
  letter-spacing: 0.03em;
  font-weight: 500;
  color: var(--text-muted);
  user-select: none;
}

/* ── Links ─────────────────────────────────────────────────── */
.ai-message-bubble :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-decoration-color: rgba(255,255,255,0.35);
  text-underline-offset: 2px;
  transition: text-decoration-color 0.15s;
}

.ai-message-bubble :deep(a:hover) {
  text-decoration-color: rgba(255,255,255,0.75);
}

/* ── Enter animation ───────────────────────────────────────── */
@keyframes messageEnter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
    filter: blur(2px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

/* ── Responsive ────────────────────────────────────────────── */
@media (max-width: 640px) {
  .ai-message {
    max-width: 88%;
  }

  .ai-message-bubble p,
  .ai-message-bubble ul,
  .ai-message-bubble ol {
    font-size: 14px;
  }
}
</style>