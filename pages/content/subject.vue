<template>
  <view class="subject-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 单页内容 -->
    <scroll-view v-else class="subject-content" scroll-y>
      <!-- <view class="subject-header">
        <text class="subject-title">{{ subjectData.name || moldName }}</text>
        <text v-if="subjectData.description" class="subject-desc">{{ subjectData.description }}</text>
      </view> -->
      
      <!-- 内容字段 -->
      <view class="content-section">
        <view
          v-for="(value, key) in subjectContent"
          :key="key"
          class="content-item"
        >
          <text class="content-label">{{ fieldLabels[key] || key }}</text>
          <view class="content-value">
            <text v-if="isSimpleValue(value)">{{ formatValue(value) }}</text>
            <view v-else class="json-value">
              <text>{{ JSON.stringify(value, null, 2) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="Object.keys(subjectContent).length === 0" class="empty-state">
        <text class="empty-icon">📄</text>
        <text class="empty-text">暂无内容</text>
      </view>
      
      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import { formatDate } from '@/utils/date'

const contentStore = useContentStore()

const projectPrefix = ref('')
const tableName = ref('')
const moldName = ref('')
const loading = ref(false)
const subjectData = ref({})
const fieldLabels = ref({})

const subjectContent = computed(() => {
  return subjectData.value.subject_content || {}
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  projectPrefix.value = options.projectPrefix || ''
  tableName.value = options.tableName || ''
  moldName.value = decodeURIComponent(options.moldName || '')
  
  if (moldName.value) {
    uni.setNavigationBarTitle({ title: moldName.value })
  }
  
  loadSubject()
})

const loadSubject = async () => {
  if (!projectPrefix.value || !tableName.value) return

  loading.value = true

  try {
    const data = await contentStore.fetchSubject(projectPrefix.value, tableName.value)
    subjectData.value = data || {}
    fieldLabels.value = data.field_labels || {}
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const isSimpleValue = (value) => {
  return typeof value !== 'object' || value === null
}

const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? '是' : '否'
  
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDate(value, 'YYYY-MM-DD HH:mm:ss')
  }
  
  return String(value)
}
</script>

<style lang="scss" scoped>
.subject-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: calc(var(--safe-top) + var(--app-top-offset));
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  
  .loading-spinner {
    width: 64rpx;
    height: 64rpx;
    border: 4rpx solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 24rpx;
  }
  
  .loading-text {
    font-size: 28rpx;
    color: #64748b;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// 单页内容
.subject-content {
  height: 100vh;
  padding: 24rpx 32rpx;
  width: auto;
}

.subject-header {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  
  .subject-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #1e293b;
    display: block;
    margin-bottom: 12rpx;
  }
  
  .subject-desc {
    font-size: 26rpx;
    color: #64748b;
    line-height: 1.5;
  }
}

// 内容区域
.content-section {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.content-item {
  padding: 28rpx 32rpx;
  border-bottom: 2rpx solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
  
  .content-label {
    font-size: 24rpx;
    color: #64748b;
    display: block;
    margin-bottom: 12rpx;
  }
  
  .content-value {
    text {
      font-size: 28rpx;
      color: #1e293b;
      line-height: 1.6;
      word-break: break-all;
    }
    
    .json-value {
      background: #f8fafc;
      border-radius: 8rpx;
      padding: 16rpx;
      overflow-x: auto;
      
      text {
        font-size: 24rpx;
        font-family: monospace;
        white-space: pre-wrap;
        color: #475569;
      }
    }
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 0;
  
  .empty-icon {
    font-size: 80rpx;
    margin-bottom: 20rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #94a3b8;
  }
}

// 底部安全区
.safe-bottom {
  height: calc(var(--safe-bottom) + 40rpx);
}
</style>
