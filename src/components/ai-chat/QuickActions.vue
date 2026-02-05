<template>
  <div class="ai-quick-actions">
    <button
      v-for="(action, index) in actions"
      :key="action.id"
      class="ai-quick-btn"
      type="button"
      :style="{ animationDelay: `${index * 0.05}s` }"
      @click="$emit('action-click', action)"
    >
      <svg
        class="ai-quick-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path :d="action.icon" />
      </svg>
      <span>{{ action.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps({
  actions: {
    type: Array,
    required: true,
  },
})

defineEmits(['action-click'])
</script>

<style scoped>
.ai-quick-actions {
  display: flex;
  gap: 10px;
  padding: 8px 24px 16px;
  overflow-x: auto;
}

.ai-quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: white;
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  animation: quickIn 0.3s ease both;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ai-quick-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

.ai-quick-icon {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 2px;
  fill: none;
}

@keyframes quickIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
