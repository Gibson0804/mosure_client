<template>
  <view class="detail-page">
    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 内容详情 -->
    <scroll-view v-else class="detail-content" scroll-y>
      <!-- <view class="detail-header">
        <text class="detail-title">{{ getTitle() }}</text>
        <text class="detail-id">#{{ contentId }}</text>
      </view> -->
      
      <!-- 字段列表 -->
      <view class="field-list">
        <view
          v-for="(value, key) in contentData"
          :key="key"
          class="field-item"
        >
          <text class="field-label">{{ fieldLabels[key] || key }}</text>
          <view class="field-value">
            <text v-if="isSimpleValue(value)">{{ formatValue(value) }}</text>
            <view v-else class="json-value">
              <text>{{ JSON.stringify(value, null, 2) }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import { formatDate } from '@/utils/date'

const contentStore = useContentStore()

const projectPrefix = ref('')
const tableName = ref('')
const contentId = ref('')
const moldName = ref('')
const loading = ref(false)
const contentData = ref({})
const fieldLabels = ref({})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  projectPrefix.value = options.projectPrefix || ''
  tableName.value = options.tableName || ''
  contentId.value = options.contentId || ''
  moldName.value = decodeURIComponent(options.moldName || '')
  
  if (moldName.value) {
    uni.setNavigationBarTitle({ title: moldName.value + ' 详情' })
  }
  
  loadDetail()
})

const loadDetail = async () => {
  if (!projectPrefix.value || !tableName.value || !contentId.value) return

  loading.value = true

  try {
    const data = await contentStore.fetchContentDetail({
      project_prefix: projectPrefix.value,
      table_name: tableName.value,
      id: parseInt(contentId.value)
    })
    contentData.value = data.detail || data || {}
    fieldLabels.value = data.field_labels || {}
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const getTitle = () => {
  return contentData.value.title || contentData.value.name || contentData.value.label || `记录 ${contentId.value}`
}

const isSimpleValue = (value) => {
  return typeof value !== 'object' || value === null
}

const formatValue = (value) => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? '是' : '否'
  
  // 检测日期格式
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return formatDate(value, 'YYYY-MM-DD HH:mm:ss')
  }
  
  return String(value)
}
</script>

<style lang="scss" scoped>
.detail-page {
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

// 内容详情
.detail-content {
  height: 100vh;
  padding: 24rpx 32rpx;
  width: auto;
}

.detail-header {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  
  .detail-title {
    font-size: 36rpx;
    font-weight: 600;
    color: #1e293b;
    display: block;
    margin-bottom: 12rpx;
  }
  
  .detail-id {
    font-size: 24rpx;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 6rpx 16rpx;
    border-radius: 8rpx;
  }
}

// 字段列表
.field-list {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.field-item {
  padding: 28rpx 32rpx;
  border-bottom: 2rpx solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
  }
  
  .field-label {
    font-size: 24rpx;
    color: #64748b;
    display: block;
    margin-bottom: 12rpx;
  }
  
  .field-value {
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

// 底部安全区
.safe-bottom {
  height: calc(var(--safe-bottom) + 40rpx);
}
</style>
