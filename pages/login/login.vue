<template>
  <view class="login-page">
    <view class="bg-orb orb-one"></view>
    <view class="bg-orb orb-two"></view>

    <AppHeader :placeholder="true">
      <template #right>
        <view class="scan-btn" @click="handleScan">
          <image src="/static/icons/scan.png" class="scan-icon" mode="aspectFit" />
          <text>扫码登录</text>
        </view>
      </template>
    </AppHeader>

    <view class="page-shell">
      <view class="hero-copy">
        <text class="eyebrow">HCMS Client</text>
        <text class="hero-title">内容、协作与项目管理的移动工作台。</text>
      </view>

      <view class="login-card">
        <view class="logo-row">
          <view class="logo-icon">
            <image src="/static/logo.png" mode="aspectFit" class="brand-logo" />
          </view>
          <view class="logo-copy">
            <text class="app-name">HCMS</text>
            <text class="app-desc">连接你的服务器并进入工作区</text>
          </view>
        </view>

        <view class="input-group">
          <view class="input-icon">
            <image src="/static/icons/cloud-server.png" class="icon" mode="aspectFit" />
          </view>
          <input
            class="input-field"
            type="text"
            name="serverUrl"
            v-model="formData.serverUrl"
            placeholder="服务器地址"
            :disabled="loading"
            @focus="showHistoryPicker = true"
          />
          <view class="side-trigger" @click="showHistoryPicker = true">
            <image src="/static/icons/arrow-down.png" class="icon" mode="aspectFit" />
          </view>
        </view>

        <view class="input-group">
          <view class="input-icon">
            <image src="/static/icons/email.png" class="icon" mode="aspectFit" />
          </view>
          <input
            class="input-field"
            type="text"
            name="email"
            value="173336670@qq.com"
            v-model="formData.email"
            placeholder="邮箱"
            :disabled="loading"
            @confirm="handleLogin"
          />
        </view>

        <view class="input-group">
          <view class="input-icon">
            <image src="/static/icons/key.png" class="icon" mode="aspectFit" />
          </view>
          <input
            class="input-field"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            v-model="formData.password"
            value="123123123"
            placeholder="密码"
            :disabled="loading"
            @confirm="handleLogin"
          />
          <view class="side-trigger" @click="showPassword = !showPassword">
            <image v-if="showPassword" src="/static/icons/eye.png" class="icon" mode="aspectFit" />
            <image v-else src="/static/icons/eye-close.png" class="icon" mode="aspectFit" />
          </view>
        </view>

        <button
          class="login-btn"
          :class="{ 'btn-loading': loading }"
          :disabled="loading || !canSubmit"
          @click="handleLogin"
        >
          <text>{{ loading ? '登录中...' : '进入工作台' }}</text>
        </button>
      </view>

      <view class="version-info">
        <text>HCMS Client v1.0.0</text>
      </view>
    </view>

    <view v-if="showHistoryPicker" class="history-picker-mask" @click="showHistoryPicker = false">
      <view class="history-picker" @click.stop>
        <view class="picker-header">
          <text class="picker-title">历史服务器</text>
          <text class="picker-close" @click="showHistoryPicker = false">×</text>
        </view>
        <scroll-view class="picker-list" scroll-y>
          <view
            v-for="(item, index) in serverHistory"
            :key="index"
            class="history-item"
            @click="selectHistory(item)"
          >
            <view class="history-info">
              <text class="history-url">{{ item.url }}</text>
              <text class="history-user">{{ item.username }}</text>
            </view>
            <view class="history-delete" @click.stop="deleteHistory(item.url)">
              <image src="/static/icons/delete.png" class="icon" mode="aspectFit" />
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'

const authStore = useAuthStore()

const formData = reactive({
  serverUrl: '',
  email: '173336670@qq.com',
  password: '123123123'
})

const loading = ref(false)
const showPassword = ref(false)
const showHistoryPicker = ref(false)

const serverHistory = computed(() => authStore.state.serverHistory)

const canSubmit = computed(() => {
  return formData.serverUrl.trim() &&
         formData.email.trim() &&
         formData.password.trim()
})

onMounted(() => {
  authStore.init()

  if (authStore.state.serverUrl) {
    formData.serverUrl = authStore.state.serverUrl
  }

  if (authStore.state.isLoggedIn) {
    uni.switchTab({ url: '/pages/index/index' })
  }
})

const selectHistory = (item) => {
  formData.serverUrl = item.url
  formData.email = item.email || item.username || ''
  showHistoryPicker.value = false
}

const deleteHistory = (url) => {
  authStore.removeServerHistory(url)
}

const handleLogin = async () => {
  if (!canSubmit.value || loading.value) return

  if (!formData.serverUrl.trim()) {
    uni.showToast({ title: '请输入服务器地址', icon: 'none' })
    return
  }
  if (!formData.email.trim()) {
    uni.showToast({ title: '请输入邮箱', icon: 'none' })
    return
  }
  if (!formData.password.trim()) {
    uni.showToast({ title: '请输入密码', icon: 'none' })
    return
  }

  loading.value = true

  try {
    authStore.setServerUrl(formData.serverUrl)
    await authStore.login(formData.email, formData.password)

    uni.showToast({ title: '登录成功', icon: 'success' })

    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
  } catch (e) {
    uni.showToast({ title: e.message || '登录失败', icon: 'none', duration: 3000 })
  } finally {
    loading.value = false
  }
}

const handleScan = () => {
  const platform = uni.getSystemInfoSync().platform

  if (platform === 'web') {
    uni.showModal({
      title: '提示',
      content: 'H5 环境不支持扫码功能，请在 App 或小程序中使用',
      showCancel: false
    })
    return
  }

  uni.scanCode({
    success: async (res) => {
      const content = res.result

      try {
        const qrData = JSON.parse(content)
        const { domain, token } = qrData

        if (!domain || !token) {
          uni.showToast({ title: '二维码格式错误', icon: 'none' })
          return
        }

        loading.value = true
        authStore.setServerUrl(domain)
        await authStore.qrLogin(token)
        uni.showToast({ title: '登录成功', icon: 'success' })
        setTimeout(() => {
          uni.switchTab({ url: '/pages/index/index' })
        }, 500)
      } catch (e) {
        uni.showToast({ title: e.message || '扫码登录失败', icon: 'none', duration: 3000 })
      } finally {
        loading.value = false
      }
    },
    fail: (err) => {
      console.error('扫码失败:', err)
      uni.showToast({ title: '扫码失败: ' + (err.errMsg || '未知错误'), icon: 'none' })
    }
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.page-shell {
  min-height: 100vh;
  padding-top: 52rpx;
  padding-right: var(--page-gutter-wide);
  padding-bottom: calc(32rpx + var(--safe-bottom));
  padding-left: var(--page-gutter-wide);
  display: flex;
  flex-direction: column;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  opacity: 0.88;
  mix-blend-mode: normal;
}

.orb-one {
  width: 420rpx;
  height: 420rpx;
  right: -110rpx;
  top: 120rpx;
  background: rgba(96, 165, 250, 0.2);
  box-shadow:
    0 0 0 1rpx rgba(96, 165, 250, 0.04),
    0 26rpx 78rpx rgba(96, 165, 250, 0.12);
}

.orb-two {
  width: 360rpx;
  height: 360rpx;
  left: -100rpx;
  bottom: 220rpx;
  background: rgba(45, 212, 191, 0.18);
  box-shadow:
    0 0 0 1rpx rgba(45, 212, 191, 0.04),
    0 22rpx 72rpx rgba(45, 212, 191, 0.12);
}

.scan-btn,
.login-card,
.history-picker {
  background: var(--surface-1);
  backdrop-filter: blur(18px);
  border: 1rpx solid var(--line-soft);
  box-shadow: var(--shadow-soft);
}

.scan-btn {
  min-height: 66rpx;
  max-width: 188rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  color: var(--accent);
  font-size: 22rpx;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.08);
}

.scan-icon,
.icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}

.hero-copy {
  margin-top: 36rpx;
  padding: 0 20rpx 0 14rpx;
}

.eyebrow,
.hero-desc,
.app-desc,
.version-info,
.history-user {
  color: var(--text-secondary);
}

.eyebrow {
  display: block;
  font-size: 22rpx;
  letter-spacing: 4rpx;
  text-transform: uppercase;
  line-height: 1;
}

.hero-title,
.app-name,
.picker-title,
.history-url {
  color: var(--text-main);
  font-weight: 700;
}

.hero-title {
  display: block;
  margin-top: 30rpx;
  max-width: 500rpx;
  font-size: 42rpx;
  line-height: 1.24;
}

.login-card {
  margin-top: 84rpx;
  border-radius: 34rpx;
  padding: var(--panel-padding);
}

.logo-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 38rpx;
}

.logo-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  background: rgba(15, 118, 110, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: inset 0 0 0 1rpx rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
}

.brand-logo {
  width: 82rpx;
  height: 82rpx;
}

.logo-copy {
  flex: 1;
  min-width: 0;
  padding-left: 28rpx;
}

.app-name {
  display: block;
  margin-top: 10rpx;
  font-size: 34rpx;
  line-height: 1.1;
}

.app-desc {
  display: block;
  margin-top: 16rpx;
  font-size: 24rpx;
  line-height: 1.5;
  max-width: 330rpx;
}

.input-group {
  min-height: 96rpx;
  margin-bottom: 16rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.88);
  display: flex;
  align-items: center;
  padding: 0 20rpx;
}

.input-icon,
.side-trigger {
  width: 52rpx;
  height: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.input-field {
  flex: 1;
  height: 100%;
  padding: 0 16rpx;
  color: var(--text-main);
  font-size: 28rpx;
}

.login-btn {
  width: 100%;
  height: 92rpx;
  margin-top: 10rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, var(--brand-strong), var(--brand));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 16rpx 32rpx rgba(15, 118, 110, 0.2);
}

.login-btn[disabled] {
  opacity: 0.58;
}

.version-info {
  margin-top: auto;
  padding-top: 28rpx;
  text-align: center;
  font-size: 22rpx;
}

.history-picker-mask {
  position: fixed;
  inset: 0;
  background: rgba(7, 16, 29, 0.32);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.history-picker {
  width: 100%;
  border-radius: 36rpx 36rpx 0 0;
  padding-top: 26rpx;
  padding-right: 26rpx;
  padding-bottom: calc(24rpx + var(--safe-bottom));
  padding-left: 26rpx;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.picker-title {
  font-size: 32rpx;
}

.picker-close {
  font-size: 46rpx;
  color: var(--text-muted);
}

.picker-list {
  max-height: 54vh;
}

.history-item {
  min-height: 96rpx;
  padding: 18rpx 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  border-bottom: 1rpx solid var(--line-soft);
}

.history-info {
  flex: 1;
  min-width: 0;
}

.history-url {
  display: block;
  font-size: 27rpx;
  word-break: break-all;
}

.history-user {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
}

.history-delete {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
