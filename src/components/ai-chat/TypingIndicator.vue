<template>
  <div class="ai-typing">
    <span />
    <span />
    <span />
  </div>
</template>

<style scoped>
.ai-typing {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  width: fit-content;
  margin-left: 52px;
}

.ai-typing span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: linear-gradient(140deg, #0ea5e9, #f97316);
  animation: typingBounce 1.4s infinite ease-in-out;
}

.ai-typing span:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-typing span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}
</style>
