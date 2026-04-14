<template>
  <view class="servers-page">
    <view class="add-card">
      <view class="section-head">
        <text class="section-title">添加服务器</text>
        <text class="section-desc">保存后可在此页面快速切换</text>
      </view>

      <input
        v-model="serverForm.url"
        class="server-input"
        type="text"
        placeholder="输入服务器地址，例如 http://192.168.1.25:9445/"
        :disabled="submitting"
        @confirm="handleAddServer"
      />

      <input
        v-model="serverForm.username"
        class="server-input"
        type="text"
        placeholder="备注账号（可选）"
        :disabled="submitting"
        @confirm="handleAddServer"
      />

      <view
        class="add-btn"
        :class="{ disabled: submitting }"
        @click="handleAddServer"
      >
        <text>{{ submitting ? '保存中...' : '添加服务器' }}</text>
      </view>
    </view>

    <!-- 服务器列表 -->
    <scroll-view class="server-list" scroll-y>
      <!-- 空状态 -->
      <view v-if="serverHistory.length === 0" class="empty-state">
        <text class="empty-icon">📡</text>
        <text class="empty-text">暂无保存的服务器</text>
        <text class="empty-hint">登录后会自动保存服务器地址</text>
      </view>
      
      <!-- 服务器列表 -->
      <view v-else class="server-items">
        <view 
          v-for="(server, index) in serverHistory" 
          :key="index"
          class="server-item"
          :class="{ current: server.url === currentServer }"
        >
          <view class="server-info" @click="selectServer(server)">
            <view class="server-status">
              <text class="status-dot" :class="{ active: server.url === currentServer }"></text>
            </view>
            <view class="server-detail">
              <text class="server-url">{{ server.url }}</text>
              <text class="server-user">用户: {{ server.username || '未知' }}</text>
              <text class="server-time">{{ formatDate(server.lastUsed) }}</text>
            </view>
          </view>
          <view class="server-actions">
            <view
              v-if="server.url !== currentServer"
              class="action-btn switch"
              @click="selectServer(server)"
            >
              <text>切换</text>
            </view>
            <view class="action-btn delete" @click="deleteServer(server.url)">
              <text>删除</text>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { formatRelative } from '@/utils/date'

const authStore = useAuthStore()
const submitting = ref(false)
const serverForm = reactive({
  url: '',
  username: ''
})

const serverHistory = computed(() => authStore.state.serverHistory)
const currentServer = computed(() => authStore.state.serverUrl)

onMounted(() => {
  authStore.init()
})

const resetForm = () => {
  serverForm.url = ''
  serverForm.username = ''
}

const handleAddServer = () => {
  if (submitting.value) return

  const rawUrl = serverForm.url.trim()
  if (!rawUrl) {
    uni.showToast({ title: '请输入服务器地址', icon: 'none' })
    return
  }

  try {
    submitting.value = true
    const normalizedUrl = authStore.normalizeUrl(rawUrl)
    authStore.addServerHistory(normalizedUrl, serverForm.username.trim())
    resetForm()
    uni.showToast({ title: '服务器已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

const selectServer = (server) => {
  if (server.url === currentServer.value) {
    uni.showToast({ title: '当前已是该服务器', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '切换服务器',
    content: `切换到 ${server.url} 需要重新登录，确定吗？`,
    success: async (res) => {
      if (res.confirm) {
        await authStore.switchServer(server.url)
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}

const deleteServer = (url) => {
  if (url === currentServer.value) {
    uni.showToast({ title: '无法删除当前服务器', icon: 'none' })
    return
  }
  
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该服务器记录吗？',
    success: (res) => {
      if (res.confirm) {
        authStore.removeServerHistory(url)
        uni.showToast({ title: '已删除', icon: 'success' })
      }
    }
  })
}

const formatDate = (dateStr) => {
  return formatRelative(dateStr)
}
</script>

<style lang="scss" scoped>
.servers-page {
  min-height: 100vh;
  background: #f8fafc;
  padding-top: calc(var(--safe-top) + var(--app-top-offset));
}

.add-card {
  margin: 24rpx 32rpx 0;
  padding: 28rpx;
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.section-head {
  margin-bottom: 20rpx;
}

.section-title {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
  color: #1e293b;
}

.section-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #64748b;
}

.server-input {
  height: 84rpx;
  padding: 0 24rpx;
  margin-bottom: 20rpx;
  border-radius: 12rpx;
  background: #f8fafc;
  border: 2rpx solid #e2e8f0;
  font-size: 28rpx;
  color: #1e293b;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 84rpx;
  border-radius: 12rpx;
  background: #2563eb;

  &.disabled {
    opacity: 0.7;
  }

  text {
    font-size: 28rpx;
    font-weight: 500;
    color: #fff;
  }
}

.server-list {
  height: calc(100vh - 280rpx);
  padding: 24rpx 32rpx;
  width: auto;
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
    margin-bottom: 12rpx;
  }
  
  .empty-hint {
    font-size: 24rpx;
    color: #94a3b8;
  }
}

// 服务器列表
.server-items {
  padding-top: 8rpx;
}

.server-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  
  &.current {
    border: 2rpx solid #2563eb;
  }
  
  .server-info {
    flex: 1;
    display: flex;
    align-items: center;
    
    .server-status {
      margin-right: 20rpx;
      
      .status-dot {
        display: block;
        width: 16rpx;
        height: 16rpx;
        background: #e2e8f0;
        border-radius: 50%;
        
        &.active {
          background: #22c55e;
        }
      }
    }
    
    .server-detail {
      flex: 1;
      
      .server-url {
        font-size: 28rpx;
        font-weight: 500;
        color: #1e293b;
        display: block;
        margin-bottom: 8rpx;
        word-break: break-all;
      }
      
      .server-user {
        font-size: 24rpx;
        color: #64748b;
        display: block;
        margin-bottom: 4rpx;
      }
      
      .server-time {
        font-size: 22rpx;
        color: #94a3b8;
      }
    }
  }
  
  .server-actions {
    margin-left: 20rpx;
    
    .action-btn {
      padding: 12rpx 24rpx;
      border-radius: 8rpx;
      
      text {
        font-size: 24rpx;
      }
      
      &.delete {
        background: #fef2f2;
        
        text {
          color: #ef4444;
        }
      }

      &.switch {
        margin-bottom: 12rpx;
        background: #eff6ff;

        text {
          color: #2563eb;
        }
      }
    }
  }
}

// 底部安全区
.safe-bottom {
  height: calc(var(--safe-bottom) + 40rpx);
}
</style>
