<template>
  <view class="crons-page">
    <!-- 筛选栏 -->
    <view class="filter-section">
      <view class="search-bar">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input"
          type="text"
          v-model="keyword"
          placeholder="搜索定时任务..."
          @confirm="loadCrons(true)"
        />
      </view>
      <view class="filter-tabs">
        <view 
          class="filter-tab" 
          :class="{ active: enabledFilter === null }"
          @click="setFilter(null)"
        >
          <text>全部</text>
        </view>
        <view 
          class="filter-tab" 
          :class="{ active: enabledFilter === true }"
          @click="setFilter(true)"
        >
          <text>启用</text>
        </view>
        <view 
          class="filter-tab" 
          :class="{ active: enabledFilter === false }"
          @click="setFilter(false)"
        >
          <text>禁用</text>
        </view>
      </view>
    </view>
    
    <!-- 任务列表 -->
    <scroll-view 
      class="cron-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="loadMore"
    >
      <!-- 加载中 -->
      <view v-if="loading && cronList.length === 0" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-else-if="cronList.length === 0" class="empty-state">
        <text class="empty-icon">⏰</text>
        <text class="empty-text">暂无定时任务</text>
      </view>
      
      <!-- 任务卡片 -->
      <view v-else class="cron-cards">
        <view 
          v-for="cron in cronList" 
          :key="cron.id"
          class="cron-card"
          :class="{ disabled: !cron.enabled }"
        >
          <view class="card-header">
            <view class="cron-info">
              <text class="cron-name">{{ cron.name }}</text>
              <view class="cron-schedule">
                <text class="schedule-type">{{ cron.schedule_type === 'cron' ? '周期' : '单次' }}</text>
                <text class="schedule-value">{{ cron.cron_expr || cron.run_at }}</text>
              </view>
            </view>
            <view class="status-badge" :class="{ enabled: cron.enabled }">
              <text>{{ cron.enabled ? '启用' : '禁用' }}</text>
            </view>
          </view>
          
          <text v-if="cron.remark" class="cron-remark">{{ cron.remark }}</text>
          
          <view class="card-footer">
            <view v-if="cron.next_run_at" class="next-run">
              <text class="next-label">下次执行:</text>
              <text class="next-time">{{ formatDate(cron.next_run_at) }}</text>
            </view>
            <text class="timezone">{{ cron.timezone }}</text>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore && cronList.length > 0" class="load-more">
        <text v-if="loadingMore">加载中...</text>
        <text v-else>上拉加载更多</text>
      </view>
      
      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { cronApi } from '@/api/index'
import { formatDate as formatDateUtil } from '@/utils/date'

const projectPrefix = ref('')
const projectName = ref('')

const keyword = ref('')
const enabledFilter = ref(null)
const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const hasMore = ref(true)
const cronList = ref([])

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  projectPrefix.value = options.projectPrefix || ''
  projectName.value = decodeURIComponent(options.projectName || '')
  
  if (projectName.value) {
    uni.setNavigationBarTitle({ title: projectName.value + ' - 定时任务' })
  }
  
  loadCrons(true)
})

const loadCrons = async (isRefresh = false) => {
  if (!projectPrefix.value) return
  
  if (isRefresh) {
    page.value = 1
    hasMore.value = true
    cronList.value = []
  }
  
  loading.value = true
  
  try {
    const params = {
      project_prefix: projectPrefix.value,
      page: page.value,
      per_page: 20
    }
    
    if (keyword.value) {
      params.keyword = keyword.value
    }
    
    if (enabledFilter.value !== null) {
      params.enabled = enabledFilter.value
    }
    
    const data = await cronApi.getList(params)
    const items = data.items || []
    
    if (isRefresh) {
      cronList.value = items
    } else {
      cronList.value = [...cronList.value, ...items]
    }
    
    if (data.meta) {
      hasMore.value = data.meta.current_page < data.meta.last_page
    } else {
      hasMore.value = items.length >= 20
    }
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
    loadingMore.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  await loadCrons(true)
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value) return
  
  loadingMore.value = true
  page.value++
  await loadCrons()
}

const setFilter = (value) => {
  enabledFilter.value = value
  loadCrons(true)
}

const formatDate = (dateStr) => {
  return formatDateUtil(dateStr, 'MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.crons-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: calc(var(--safe-top) + var(--app-top-offset));
  padding-right: 0;
  padding-bottom: 0;
  padding-left: 0;
}

// 筛选栏
.filter-section {
  background: #fff;
  padding: 24rpx 32rpx;
  border-bottom: 2rpx solid #e2e8f0;
  
  .search-bar {
    display: flex;
    align-items: center;
    background: #f1f5f9;
    border-radius: 12rpx;
    padding: 0 24rpx;
    height: 72rpx;
    margin-bottom: 20rpx;
    
    .search-icon {
      font-size: 28rpx;
      margin-right: 12rpx;
    }
    
    .search-input {
      flex: 1;
      height: 100%;
      font-size: 28rpx;
      color: #1e293b;
    }
  }
  
  .filter-tabs {
    display: flex;
    gap: 16rpx;
    
    .filter-tab {
      padding: 12rpx 28rpx;
      background: #f1f5f9;
      border-radius: 20rpx;
      
      text {
        font-size: 26rpx;
        color: #64748b;
      }
      
      &.active {
        background: #dbeafe;
        
        text {
          color: #2563eb;
          font-weight: 500;
        }
      }
    }
  }
}

// 任务列表
.cron-list {
  height: calc(100vh - 180rpx);
  padding: 24rpx 32rpx;
  width: auto;
}

// 加载状态
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  
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

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
  
  .empty-icon {
    font-size: 96rpx;
    margin-bottom: 24rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #64748b;
  }
}

// 任务卡片
.cron-cards {
  padding-top: 8rpx;
}

.cron-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  
  &.disabled {
    opacity: 0.7;
  }
  
  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16rpx;
    
    .cron-info {
      flex: 1;
      
      .cron-name {
        font-size: 30rpx;
        font-weight: 500;
        color: #1e293b;
        display: block;
        margin-bottom: 12rpx;
      }
      
      .cron-schedule {
        display: flex;
        align-items: center;
        
        .schedule-type {
          font-size: 20rpx;
          padding: 4rpx 12rpx;
          border-radius: 6rpx;
          background: #f0f9ff;
          color: #0369a1;
          margin-right: 12rpx;
        }
        
        .schedule-value {
          font-size: 24rpx;
          color: #64748b;
          font-family: monospace;
        }
      }
    }
    
    .status-badge {
      padding: 8rpx 16rpx;
      border-radius: 8rpx;
      background: #f1f5f9;
      
      text {
        font-size: 22rpx;
        color: #94a3b8;
      }
      
      &.enabled {
        background: #dcfce7;
        
        text {
          color: #16a34a;
        }
      }
    }
  }
  
  .cron-remark {
    font-size: 26rpx;
    color: #64748b;
    line-height: 1.5;
    margin-bottom: 16rpx;
  }
  
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16rpx;
    border-top: 2rpx solid #f1f5f9;
    
    .next-run {
      display: flex;
      align-items: center;
      
      .next-label {
        font-size: 22rpx;
        color: #94a3b8;
        margin-right: 8rpx;
      }
      
      .next-time {
        font-size: 24rpx;
        color: #2563eb;
        font-weight: 500;
      }
    }
    
    .timezone {
      font-size: 22rpx;
      color: #94a3b8;
    }
  }
}

// 加载更多
.load-more {
  text-align: center;
  padding: 32rpx 0;
  
  text {
    font-size: 26rpx;
    color: #94a3b8;
  }
}

// 底部安全区
.safe-bottom {
  height: calc(var(--safe-bottom) + 20rpx);
}
</style>
