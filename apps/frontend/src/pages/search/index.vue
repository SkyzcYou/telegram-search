<script setup lang="ts">
import type { CoreMessage, CoreRetrivalMessages } from '@tg-search/core'

import { useClipboard, useDebounce } from '@vueuse/core'
import { ref, watch } from 'vue'

import Avatar from '../../components/ui/Avatar.vue'
import { useWebsocketStore } from '../../store/useWebsocket'

const isLoading = ref(false)

const showSettings = ref(false)
const hoveredMessage = ref<CoreMessage | null>(null)
const { copy, copied } = useClipboard()

const keyword = ref<string>('')
const keywordDebounced = useDebounce(keyword, 1000)

function highlightKeyword(text: string, keyword: string) {
  if (!keyword)
    return text
  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<span class="bg-yellow-200 dark:bg-yellow-800">$1</span>')
}

function copyMessage(message: CoreMessage) {
  copy(message.content)
}

const websocketStore = useWebsocketStore()
const searchResult = ref<CoreRetrivalMessages[]>([])

// TODO: Infinite scroll
watch(keywordDebounced, (newKeyword) => {
  if (newKeyword.length === 0) {
    searchResult.value = []
    return
  }

  isLoading.value = true
  websocketStore.sendEvent('storage:search:messages', {
    content: newKeyword,
    useVector: true,
    pagination: {
      limit: 10,
      offset: 0,
    },
  })

  websocketStore.waitForEvent('storage:search:messages:data').then(({ messages }) => {
    searchResult.value = messages
    isLoading.value = false
  })
})
</script>

<template>
  <div class="flex flex-col h-full">
    <header class="flex items-center border-b border-b-secondary px-4 dark:border-b-secondary p-4">
      <div class="flex items-center gap-2">
        <span class="text-lg font-medium">Search</span>
      </div>
    </header>

    <!-- 搜索栏直接放在页面顶部 -->
    <div class="flex flex-col px-8 pt-8">
      <div class="flex items-center gap-2 w-full">
        <input
          v-model="keyword"
          class="flex-1 outline-none text-foreground border border-secondary rounded-md px-4 py-2"
          placeholder="Search messages..."
        >
        <button
          class="h-8 w-8 flex items-center justify-center rounded-md p-1 text-foreground hover:bg-muted"
          @click="showSettings = !showSettings"
        >
          <span class="i-lucide-chevron-down h-4 w-4 transition-transform" :class="{ 'rotate-180': showSettings }" />
        </button>
      </div>

      <!-- 设置栏 -->
      <div v-if="showSettings" class="py-3">
        <slot name="settings" />
      </div>
    </div>

    <!-- 搜索结果直接展示在下方 -->
    <div
      v-show="keywordDebounced"
      class="px-8 pt-4 flex-1 transition-all duration-300 ease-in-out"
      :class="{ 'opacity-0': !keywordDebounced, 'opacity-100': keywordDebounced }"
    >
      <template v-if="searchResult.length > 0">
        <ul class="flex flex-col max-h-[540px] overflow-y-auto scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent animate-fade-in">
          <li
            v-for="item in searchResult"
            :key="item.uuid"
            class="flex items-center gap-2 p-2 border-b last:border-b-0 hover:bg-muted/50 transition-all duration-200 ease-in-out animate-slide-in relative group cursor-pointer"
            tabindex="0"
            @mouseenter="hoveredMessage = item"
            @mouseleave="hoveredMessage = null"
            @keydown.enter="copyMessage(item)"
          >
            <Avatar
              :name="item.fromName"
              size="sm"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-foreground truncate">
                {{ item.fromName }}
              </div>
              <div class="text-sm text-muted-foreground break-words" v-html="highlightKeyword(item.content, keyword)" />
            </div>
            <div
              v-if="hoveredMessage === item"
              class="absolute bottom-0.5 right-0.5 text-[10px] text-muted-foreground flex items-center gap-0.5 opacity-50 bg-background/50 px-1 py-0.5 rounded"
            >
              <span>{{ copied ? '已复制' : '按下' }}</span>
              <span v-if="!copied" class="i-lucide-corner-down-left h-2.5 w-2.5" />
              <span v-else class="i-lucide-check h-2.5 w-2.5" />
              <span v-if="!copied">复制</span>
            </div>
          </li>
        </ul>
      </template>
      <template v-else-if="isLoading">
        <div class="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-70">
          <span class="i-lucide-loader-circle text-3xl mb-2 animate-spin" />
          <span>搜索中...</span>
        </div>
      </template>
      <template v-else-if="searchResult.length === 0">
        <div class="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-70">
          <span class="i-lucide-search text-3xl mb-2" />
          <span>没有找到相关消息</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

.animate-slide-in {
  animation: slide-in 0.3s ease-out;
}
</style>
