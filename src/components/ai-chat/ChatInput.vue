<template>
  <div class="ai-input-shell">
    <div class="ai-input">
      <button
        class="ai-attach"
        type="button"
        aria-label="Attach file"
        @click="triggerFileUpload"
      >
        <svg viewBox="0 0 24 24">
          <path d="M16.5 6v9.75a4.5 4.5 0 0 1-9 0V5.5a3.5 3.5 0 1 1 7 0v9a2.5 2.5 0 0 1-5 0V6.5" />
        </svg>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        class="ai-hidden-input"
        @change="handleFileChange"
      >

      <textarea
        ref="textareaRef"
        v-model="localMessage"
        rows="1"
        placeholder="Type your message..."
        aria-label="Message input"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      />

      <button
        class="ai-send"
        type="button"
        :disabled="!canSend"
        aria-label="Send message"
        @click="handleSend"
      >
        <svg viewBox="0 0 24 24">
          <path d="M3 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </div>
    <p class="ai-input-note">
      Press Enter to send, Shift + Enter for a new line.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  isSending: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'send', 'file-select'])

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const localMessage = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const canSend = computed(() => localMessage.value.trim().length > 0 && !props.isSending)

const handleSend = () => {
  if (canSend.value)
    emit('send')
}

const autoResize = () => {
  nextTick(() => {
    if (!textareaRef.value)
      return

    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 140)}px`
  })
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file)
    emit('file-select', file)

  if (target)
    target.value = ''
}

watch(
  () => props.modelValue,
  () => autoResize(),
)
</script>

<style scoped>
.ai-input-shell {
  padding: 16px 24px 22px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
}

.ai-input {
  display: flex;
  align-items: flex-end;
  gap: 12px;
}

.ai-attach,
.ai-send {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: none;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ai-attach {
  background: rgba(15, 118, 110, 0.1);
  color: #0f766e;
}

.ai-attach:hover {
  transform: translateY(-1px);
}

.ai-send {
  background: linear-gradient(140deg, #0ea5e9, #f97316);
  color: white;
  box-shadow: 0 12px 22px rgba(14, 165, 233, 0.25);
}

.ai-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.ai-send:hover:not(:disabled) {
  transform: translateY(-1px);
}

.ai-attach svg,
.ai-send svg {
  width: 20px;
  height: 20px;
  stroke: currentColor;
  stroke-width: 2.1px;
  fill: none;
}

textarea {
  flex: 1;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.16);
  padding: 12px 16px;
  font-size: 15px;
  font-family: inherit;
  line-height: 1.5;
  color: #000000;
  resize: none;
  background: white;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

textarea:focus {
  outline: none;
  border-color: rgba(14, 165, 233, 0.8);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
}

.ai-hidden-input {
  display: none;
}

.ai-input-note {
  margin: 8px 0 0;
  font-size: 11px;
  color: rgba(15, 23, 42, 0.5);
}

@media (max-width: 640px) {
  .ai-input-shell {
    padding: 12px 18px 18px;
  }

  .ai-input-note {
    display: none;
  }
}
</style>
