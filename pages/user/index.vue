<template>
  <view class="user-page">
    <AppHeader :placeholder="true" />
    <view class="page-shell">
      <view class="profile-panel">
        <view class="profile-top">
          <view class="avatar">
            <image v-if="user?.avatar" :src="avatarUrl" mode="aspectFill" />
            <text v-else>{{ userInitial }}</text>
          </view>
          <view class="profile-copy">
            <text class="eyebrow">Account Center</text>
            <text class="username">{{ user?.name || '未登录' }}</text>
            <text class="email">{{ user?.email || '未绑定邮箱' }}</text>
          </view>
          <view v-if="user?.is_admin" class="admin-badge">
            <text>管理员</text>
          </view>
        </view>

        <view class="profile-metrics">
          <view class="metric-item">
            <text class="metric-label">服务器</text>
            <text class="metric-value">{{ serverHost }}</text>
          </view>
          <view class="metric-item">
            <text class="metric-label">身份</text>
            <text class="metric-value">{{ user?.is_admin ? 'Admin' : 'Member' }}</text>
          </view>
        </view>
      </view>

      <view class="menu-panel">
        <view class="menu-item" @click="showCurrentServer">
          <view class="menu-copy">
            <text class="menu-title">当前服务器</text>
            <text class="menu-desc">{{ serverHost }}</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="goToServers">
          <view class="menu-copy">
            <text class="menu-title">服务器管理</text>
            <text class="menu-desc">管理已保存的服务器配置</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @click="showAbout">
          <view class="menu-copy">
            <text class="menu-title">关于应用</text>
            <text class="menu-desc">版本 1.0.0</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="logout-btn" @click="handleLogout">
        <text>退出登录</text>
      </view>

      <view class="bottom-safe"></view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'

const authStore = useAuthStore()

const user = computed(() => authStore.state.user)

const avatarUrl = computed(() => {
  const avatar = user.value?.avatar
  if (!avatar) return ''
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    return avatar
  }
  const serverUrl = authStore.state.serverUrl
  return serverUrl ? `${serverUrl}${avatar}` : avatar
})

const userInitial = computed(() => {
  const name = user.value?.name || ''
  return name.charAt(0).toUpperCase() || 'U'
})

const serverHost = computed(() => {
  const url = authStore.state.serverUrl
  if (!url) return '未配置'
  try {
    return new URL(url).host
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
})

onMounted(() => {
  authStore.init()
})

const showCurrentServer = () => {
  uni.showModal({
    title: '当前服务器',
    content: authStore.state.serverUrl || '未配置',
    showCancel: false
  })
}

const goToServers = () => {
  uni.navigateTo({
    url: '/pages/user/servers'
  })
}

const showAbout = () => {
  uni.showModal({
    title: 'HCMS Client',
    content: '版本: 1.0.0\n\nHCMS 内容管理系统移动端\n\n© 2025 HCMS',
    showCancel: false
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: async (res) => {
      if (res.confirm) {
        await authStore.logout()
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.user-page {
  min-height: 100vh;
}

.page-shell {
  padding-top: 24rpx;
  padding-right: var(--page-gutter);
  padding-bottom: 0;
  padding-left: var(--page-gutter);
}

.page-intro {
  margin-bottom: 18rpx;
}

.profile-panel,
.menu-panel,
.logout-btn {
  background: var(--surface-1);
  backdrop-filter: blur(18px);
  border: 1rpx solid var(--line-soft);
  box-shadow: var(--shadow-soft);
}

.profile-panel,
.menu-panel {
  border-radius: 30rpx;
}

.profile-panel {
  padding: var(--panel-padding);
  background:
    radial-gradient(circle at top right, rgba(29, 78, 216, 0.14), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(243, 248, 250, 0.98));
}

.profile-top {
  display: flex;
  align-items: center;
}

.avatar {
  width: 116rpx;
  height: 116rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, var(--brand-strong), var(--brand));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42rpx;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar image {
  width: 100%;
  height: 100%;
}

.profile-copy {
  flex: 1;
  min-width: 0;
  margin-left: 26rpx;
}

.eyebrow,
.email,
.metric-label,
.menu-desc {
  color: var(--text-secondary);
}

.page-title {
  padding-top: 8rpx;
  font-size: 36rpx;
  line-height: 1.1;
  color: var(--text-main);
  font-weight: 700;
}

.eyebrow {
  display: block;
  font-size: 22rpx;
  letter-spacing: 3rpx;
  text-transform: uppercase;
}

.username {
  display: block;
  margin-top: 10rpx;
  font-size: 38rpx;
  color: var(--text-main);
  font-weight: 700;
}

.email {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
}

.admin-badge {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(29, 78, 216, 0.08);
  color: var(--accent);
  font-size: 22rpx;
}

.profile-metrics {
  margin-top: 26rpx;
  display: flex;
  flex-wrap: wrap;
  margin-left: -14rpx;
  margin-top: -14rpx;
}

.profile-metrics > view {
  width: calc((100% - 28rpx) / 2);
  margin-left: 14rpx;
  margin-top: 14rpx;
}

.metric-item {
  padding: 20rpx;
  border-radius: 22rpx;
  background: rgba(16, 32, 51, 0.05);
}

.metric-label {
  display: block;
  font-size: 22rpx;
}

.metric-value {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: var(--text-main);
  font-weight: 600;
  word-break: break-all;
}

.menu-panel {
  margin-top: 22rpx;
  overflow: hidden;
}

.menu-item {
  min-height: 104rpx;
  padding: 0 26rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1rpx solid var(--line-soft);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-copy {
  flex: 1;
  margin-right: 18rpx;
}

.menu-title {
  display: block;
  font-size: 29rpx;
  color: var(--text-main);
  font-weight: 600;
}

.menu-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
}

.menu-arrow {
  font-size: 40rpx;
  color: var(--text-muted);
}

.logout-btn {
  margin-top: 24rpx;
  height: 92rpx;
  border-radius: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--danger);
  font-size: 30rpx;
  font-weight: 700;
}

.bottom-safe {
  height: calc(36rpx + var(--safe-bottom));
}
</style>
