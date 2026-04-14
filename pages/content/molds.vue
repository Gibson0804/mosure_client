<template>
  <view class="molds-page">
    <!-- Tab 切换 -->
    <view class="tab-section">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'list' }"
        @click="activeTab = 'list'"
      >
        <text>列表模型</text>
        <text class="tab-count">{{ listMolds.length }}</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'single' }"
        @click="activeTab = 'single'"
      >
        <text>单页模型</text>
        <text class="tab-count">{{ singleMolds.length }}</text>
      </view>
    </view>
    
    <!-- 模型列表 -->
    <scroll-view 
      class="mold-list"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 空状态 -->
      <view v-else-if="currentMolds.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无{{ activeTab === 'list' ? '列表' : '单页' }}模型</text>
      </view>
      
      <!-- 模型卡片 -->
      <view v-else class="mold-cards">
        <view 
          v-for="mold in currentMolds" 
          :key="mold.id"
          class="mold-card"
          @click="openMold(mold)"
        >
          <view class="card-header">
            <view class="mold-icon">
              <text>{{ activeTab === 'list' ? '📋' : '📄' }}</text>
            </view>
            <view class="mold-info">
              <text class="mold-name">{{ mold.name }}</text>
              <text class="mold-table">{{ mold.table_name }}</text>
            </view>
            <text class="arrow">→</text>
          </view>
          
          <text v-if="mold.description" class="mold-desc">
            {{ mold.description }}
          </text>
          
          <view class="card-footer">
            <text class="field-count">{{ (mold.fields || []).length }} 个字段</text>
            <text class="update-time">{{ formatDate(mold.updated_at) }}</text>
          </view>
        </view>
      </view>
      
      <!-- 底部安全区 -->
      <view class="safe-bottom"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useContentStore } from '@/stores/content'
import { formatDate as formatDateUtil } from '@/utils/date'

const contentStore = useContentStore()

const projectPrefix = ref('')
const projectName = ref('')
const activeTab = ref('list')
const loading = ref(false)
const refreshing = ref(false)

const listMolds = computed(() => contentStore.state.molds.list)
const singleMolds = computed(() => contentStore.state.molds.single)
const currentMolds = computed(() => {
  return activeTab.value === 'list' ? listMolds.value : singleMolds.value
})

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  projectPrefix.value = options.projectPrefix || ''
  projectName.value = decodeURIComponent(options.projectName || '')
  
  if (projectName.value) {
    uni.setNavigationBarTitle({ title: projectName.value + ' - 内容模型' })
  }
  
  loadMolds()
})

const loadMolds = async () => {
  if (!projectPrefix.value) return
  
  loading.value = true
  try {
    await contentStore.fetchMolds(projectPrefix.value)
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  try {
    await contentStore.fetchMolds(projectPrefix.value)
  } catch (e) {
    uni.showToast({ title: e.message || '刷新失败', icon: 'none' })
  } finally {
    refreshing.value = false
  }
}

const openMold = (mold) => {
  contentStore.setCurrentMold(mold)
  
  if (mold.mold_type === 'single') {
    // 单页模型直接查看内容
    uni.navigateTo({
      url: `/pages/content/subject?projectPrefix=${projectPrefix.value}&tableName=${mold.table_name}&moldName=${encodeURIComponent(mold.name)}`
    })
  } else {
    // 列表模型查看内容列表
    uni.navigateTo({
      url: `/pages/content/list?projectPrefix=${projectPrefix.value}&tableName=${mold.table_name}&moldId=${mold.id}&moldName=${encodeURIComponent(mold.name)}`
    })
  }
}

const formatDate = (dateStr) => {
  return formatDateUtil(dateStr, 'MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.molds-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: calc(var(--safe-top) + var(--app-top-offset));
}

// Tab 切换
.tab-section {
  display: flex;
  background: #fff;
  padding: 0 32rpx;
  border-bottom: 2rpx solid #e2e8f0;
  
  .tab-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 96rpx;
    position: relative;
    
    text {
      font-size: 28rpx;
      color: #64748b;
    }
    
    .tab-count {
      font-size: 22rpx;
      background: #e2e8f0;
      padding: 4rpx 12rpx;
      border-radius: 20rpx;
      margin-left: 12rpx;
    }
    
    &.active {
      text {
        color: #2563eb;
        font-weight: 500;
      }
      
      .tab-count {
        background: #dbeafe;
        color: #2563eb;
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 80rpx;
        height: 4rpx;
        background: #2563eb;
        border-radius: 2rpx;
      }
    }
  }
}

// 模型列表
.mold-list {
  height: calc(100vh - 96rpx);
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

// 模型卡片
.mold-cards {
  padding-top: 8rpx;
}

.mold-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  
  .card-header {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;
    
    .mold-icon {
      width: 64rpx;
      height: 64rpx;
      background: #f0f9ff;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      
      text {
        font-size: 32rpx;
      }
    }
    
    .mold-info {
      flex: 1;
      
      .mold-name {
        font-size: 30rpx;
        font-weight: 500;
        color: #1e293b;
        display: block;
        margin-bottom: 6rpx;
      }
      
      .mold-table {
        font-size: 24rpx;
        color: #64748b;
        background: #f1f5f9;
        padding: 4rpx 12rpx;
        border-radius: 6rpx;
      }
    }
    
    .arrow {
      font-size: 32rpx;
      color: #94a3b8;
    }
  }
  
  .mold-desc {
    font-size: 26rpx;
    color: #64748b;
    line-height: 1.5;
    margin-bottom: 16rpx;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 16rpx;
    border-top: 2rpx solid #f1f5f9;
    
    .field-count,
    .update-time {
      font-size: 22rpx;
      color: #94a3b8;
    }
  }
}

// 底部安全区
.safe-bottom {
  height: calc(var(--safe-bottom) + 20rpx);
}
</style>
