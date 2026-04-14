<template>
  <view class="project-page">
    <AppHeader :placeholder="true">
      <template #right>
        <view class="server-pill" @click="showServerInfo">
          <text class="server-dot"></text>
          <text class="server-text">{{ serverHost || '未配置服务器' }}</text>
        </view>
      </template>
    </AppHeader>
    <scroll-view
      class="page-shell"
      scroll-y
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="page-intro">
        <text class="eyebrow">Client Workspace</text>
        <text class="page-title">我的项目</text>
      </view>
      <view class="hero-panel">
        <view class="hero-copy">
          <text class="hero-title">一个入口管理项目、前端和消息协作。</text>
          <text class="hero-desc">搜索、查看未读状态，或直接进入项目 AI 工作台。</text>
        </view>
        <view class="hero-stats">
          <view class="stat-item">
            <text class="stat-value">{{ projectStore.state.projects.length }}</text>
            <text class="stat-label">项目总数</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ unreadProjectCount }}</text>
            <text class="stat-label">有未读项目</text>
          </view>
          <view class="stat-item">
            <text class="stat-value">{{ frontendProjectCount }}</text>
            <text class="stat-label">可用前端</text>
          </view>
        </view>
      </view>

      <view class="search-panel">
        <view class="search-bar">
          <text class="search-icon">⌕</text>
          <input
            class="search-input"
            type="text"
            name="projectSearch"
            v-model="searchKeyword"
            placeholder="搜索项目名称、标识或描述"
            @input="onSearch"
          />
          <text v-if="searchKeyword" class="search-clear" @click="clearSearch">×</text>
        </view>
      </view>

      <view class="project-list">
        <view v-if="loading && !refreshing" class="state-block">
          <view class="loading-spinner"></view>
          <text class="state-title">加载项目中</text>
          <text class="state-desc">正在同步最新项目列表</text>
        </view>

        <view v-else-if="filteredProjects.length === 0" class="state-block">
          <text class="state-emoji">◌</text>
          <text class="state-title">{{ searchKeyword ? '没有匹配项目' : '还没有可用项目' }}</text>
          <text class="state-desc">{{ searchKeyword ? '换个关键字试试' : '下拉刷新以重新加载项目列表' }}</text>
          <view v-if="!searchKeyword" class="ghost-btn" @click="onRefresh">
            <text>立即刷新</text>
          </view>
        </view>

        <view v-else class="project-stack">
          <view
            v-for="project in filteredProjects"
            :key="project.id"
            class="project-item"
          >
            <view class="project-main" @click="enterProject(project)">
              <view class="project-badge">
                <text>{{ project.name.charAt(0).toUpperCase() }}</text>
                <view v-if="project.unread_count > 0" class="unread-badge">
                  <text>{{ formatUnread(project.unread_count) }}</text>
                </view>
              </view>

              <view class="project-copy">
                <view class="project-title-row">
                  <text class="project-name">{{ project.name }}</text>
                  <text class="project-prefix">{{ project.prefix }}</text>
                </view>
                <text v-if="project.description" class="project-desc">{{ project.description }}</text>
                <text v-else class="project-desc muted">暂无项目描述</text>
                <view class="project-meta">
                  <text>创建于 {{ formatDate(project.created_at) }}</text>
                  <text>未读 {{ project.unread_count || 0 }}</text>
                </view>
              </view>
            </view>

            <view class="project-actions">
              <view
                v-if="project.frontends && project.frontends.length > 0"
                class="secondary-btn"
                @click.stop="openFrontend(project)"
              >
                <text>打开前端 {{ project.frontends.length }}</text>
              </view>
              <view class="primary-btn" @click="enterProject(project)">
                <text>进入工作台</text>
              </view>
            </view>
          </view>
        </view>

        <view class="safe-bottom"></view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import { formatDate as formatDateUtil } from '@/utils/date'
import AppHeader from '@/components/AppHeader.vue'

const authStore = useAuthStore()
const projectStore = useProjectStore()

const loading = ref(false)
const refreshing = ref(false)
const searchKeyword = ref('')

const serverHost = computed(() => {
  const url = authStore.state.serverUrl
  if (!url) return ''
  try {
    return new URL(url).host
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0]
  }
})

const filteredProjects = computed(() => projectStore.searchProjects(searchKeyword.value))

const unreadProjectCount = computed(() =>
  projectStore.state.projects.filter(project => Number(project.unread_count || 0) > 0).length
)

const frontendProjectCount = computed(() =>
  projectStore.state.projects.filter(project => (project.frontends || []).length > 0).length
)

onMounted(async () => {
  authStore.init()
  projectStore.init()

  if (!authStore.state.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }

  await loadProjects()
})

onShow(async () => {
  authStore.init()
  projectStore.init()
  if (authStore.state.isLoggedIn) {
    await loadProjects()
  }
})

const loadProjects = async () => {
  loading.value = true
  try {
    await projectStore.fetchProjects()
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onRefresh = async () => {
  refreshing.value = true
  try {
    await projectStore.fetchProjects()
  } catch (e) {
    uni.showToast({ title: e.message || '刷新失败', icon: 'none' })
  } finally {
    refreshing.value = false
  }
}

const onSearch = () => {}

const clearSearch = () => {
  searchKeyword.value = ''
}

const showServerInfo = () => {
  uni.showModal({
    title: '当前服务器',
    content: authStore.state.serverUrl,
    showCancel: false
  })
}

const openFrontend = (project) => {
  const plugins = project.frontends || []

  if (plugins.length === 0) {
    uni.showToast({ title: '该项目暂无前端页面', icon: 'none' })
    return
  }

  if (plugins.length === 1) {
    openPluginUrl(plugins[0].url, plugins[0].name || project.name)
  } else {
    uni.showActionSheet({
      itemList: plugins.map(p => p.name || '插件'),
      success: (res) => {
        const selectedPlugin = plugins[res.tapIndex]
        openPluginUrl(selectedPlugin.url, selectedPlugin.name || project.name)
      }
    })
  }
}

const openPluginUrl = (url, title) => {
  const serverUrl = authStore.state.serverUrl
  const fullUrl = `${serverUrl}${url}`

  // #ifdef H5
  window.open(fullUrl, '_blank')
  // #endif
  // #ifndef H5
  uni.navigateTo({
    url: `/pages/webview/webview?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`
  })
  // #endif
}

const enterProject = (project) => {
  projectStore.setCurrentProject(project)
  uni.navigateTo({
    url: `/pages/chat/index?projectId=${project.id}&projectName=${encodeURIComponent(project.name)}&projectPrefix=${project.prefix}`
  })
}

const formatDate = (dateStr) => formatDateUtil(dateStr, 'YYYY-MM-DD')

const formatUnread = (count) => (count > 99 ? '99+' : String(count))
</script>

<style lang="scss" scoped>
.project-page {
  min-height: 100vh;
  padding-right: 0;
  padding-bottom: 0;
  padding-left: 0;
}

.page-shell {
  height: calc(100vh - var(--status-bar-height) - var(--toolbar-height));
  box-sizing: border-box;
  padding-top: 24rpx;
  padding-right: var(--page-gutter);
  padding-bottom: 0;
  padding-left: var(--page-gutter);
}

.page-intro {
  margin-bottom: 18rpx;
}

.hero-panel,
.search-panel {
  margin-bottom: 22rpx;
}

.hero-panel,
.search-panel,
.project-item,
.state-block {
  background: var(--surface-1);
  backdrop-filter: blur(18px);
  border: 1rpx solid var(--line-soft);
  box-shadow: var(--shadow-soft);
}

.eyebrow,
.server-text,
.hero-desc,
.stat-label,
.project-desc,
.project-meta,
.state-desc {
  color: var(--text-secondary);
}

.eyebrow {
  display: block;
  font-size: 22rpx;
  letter-spacing: 3rpx;
  text-transform: uppercase;
}

.page-title {
  display: block;
  margin-top: 8rpx;
  font-size: 44rpx;
  line-height: 1.1;
  color: var(--text-main);
  font-weight: 700;
}


.server-pill {
  flex-shrink: 0;
  max-width: 320rpx;
  background: rgba(16, 32, 51, 0.05);
  border-radius: var(--radius-pill);
  padding: 16rpx 20rpx;
  display: flex;
  align-items: center;
}

.server-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--brand);
  box-shadow: 0 0 0 8rpx rgba(15, 118, 110, 0.12);
}

.server-text {
  flex: 1;
  min-width: 0;
  margin-left: 12rpx;
  font-size: 24rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hero-panel {
  border-radius: 36rpx;
  padding-top: calc(var(--panel-padding) + 4rpx);
  padding-right: calc(var(--panel-padding) + 4rpx);
  padding-bottom: calc(var(--panel-padding) + 4rpx);
  padding-left: calc(var(--panel-padding) + 4rpx);
  background:
    radial-gradient(circle at top right, rgba(29, 78, 216, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(244, 247, 251, 0.96));
}

.hero-copy {
  margin-bottom: 32rpx;
  padding-right: 12rpx;
}

.hero-title {
  display: block;
  font-size: 40rpx;
  line-height: 1.2;
  color: var(--text-main);
  font-weight: 700;
}

.hero-desc {
  display: block;
  margin-top: 14rpx;
  font-size: 26rpx;
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  margin-left: -16rpx;
  margin-top: -16rpx;
}

.hero-stats > view {
  width: calc((100% - 48rpx) / 3);
  margin-left: 16rpx;
  margin-top: 16rpx;
}

.stat-item {
  border-radius: 22rpx;
  padding: 20rpx;
  background: rgba(16, 32, 51, 0.04);
}

.stat-value {
  display: block;
  font-size: 38rpx;
  color: var(--text-main);
  font-weight: 700;
}

.stat-label {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
}

.search-panel {
  border-radius: var(--radius-card);
  padding: 18rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 84rpx;
  background: var(--surface-2);
  border-radius: 20rpx;
  padding: 0 24rpx;
}

.search-icon,
.search-clear {
  color: var(--text-muted);
}

.search-icon {
  font-size: 30rpx;
  margin-right: 16rpx;
}

.search-input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: var(--text-main);
}

.search-clear {
  font-size: 42rpx;
  padding: 0 8rpx;
}

.project-list {
  min-height: 0;
}

.project-stack {
  display: flex;
  flex-direction: column;
}

.project-stack > view + view {
  margin-top: 18rpx;
}

.project-item {
  border-radius: 30rpx;
  padding: 26rpx;
}

.project-main {
  display: flex;
}

.project-badge {
  position: relative;
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, var(--brand), #2dd4bf);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  font-weight: 700;
  flex-shrink: 0;
}

.unread-badge {
  position: absolute;
  right: -8rpx;
  top: -8rpx;
  min-width: 38rpx;
  height: 38rpx;
  border-radius: 999rpx;
  padding: 0 10rpx;
  background: #fff;
  color: var(--danger);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(220, 38, 38, 0.16);
}

.project-copy {
  flex: 1;
  min-width: 0;
  margin-left: 22rpx;
}

.project-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin-left: -14rpx;
  margin-top: -14rpx;
}

.project-title-row > view,
.project-title-row > text {
  margin-left: 14rpx;
  margin-top: 14rpx;
}

.project-name {
  font-size: 32rpx;
  color: var(--text-main);
  font-weight: 700;
}

.project-prefix {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(29, 78, 216, 0.08);
  color: var(--accent);
  font-size: 22rpx;
}

.project-desc {
  display: block;
  margin-top: 14rpx;
  font-size: 25rpx;
  line-height: 1.6;
}

.project-desc.muted {
  color: var(--text-muted);
}

.project-meta {
  margin-top: 18rpx;
  display: flex;
  flex-wrap: wrap;
  font-size: 22rpx;
  margin-left: -18rpx;
  margin-top: -12rpx;
}

.project-meta > view,
.project-meta > text {
  margin-left: 18rpx;
  margin-top: 12rpx;
}

.project-actions {
  margin-top: 24rpx;
  display: flex;
}

.project-actions > view + view,
.project-actions > button + button {
  margin-left: 16rpx;
}

.secondary-btn,
.primary-btn,
.ghost-btn {
  height: 76rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 600;
}

.secondary-btn {
  flex: 1;
  background: rgba(16, 32, 51, 0.05);
  color: var(--text-main);
}

.primary-btn {
  flex: 1.2;
  background: linear-gradient(135deg, var(--brand-strong), var(--brand));
  color: #fff;
  box-shadow: 0 14rpx 28rpx rgba(15, 118, 110, 0.18);
}

.state-block {
  border-radius: 30rpx;
  padding: 64rpx 32rpx;
  text-align: center;
}

.state-title {
  display: block;
  margin-top: 18rpx;
  font-size: 30rpx;
  color: var(--text-main);
  font-weight: 700;
}

.state-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
}

.state-emoji {
  font-size: 56rpx;
  color: var(--accent);
}

.ghost-btn {
  width: 220rpx;
  margin: 24rpx auto 0;
  background: rgba(29, 78, 216, 0.08);
  color: var(--accent);
}

.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  margin: 0 auto;
  border: 6rpx solid rgba(29, 78, 216, 0.12);
  border-top-color: var(--accent);
  animation: spin 0.8s linear infinite;
}

.safe-bottom {
  height: calc(40rpx + var(--safe-bottom));
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
