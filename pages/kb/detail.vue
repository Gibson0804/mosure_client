<template>
  <view class="detail-page">
    <AppHeader :placeholder="true" bordered>
      <template #left>
        <view class="nav-left" @click="goBack">
          <text class="back-icon">‹</text>
          <text class="nav-title">文章详情</text>
        </view>
      </template>
      <template #right>
        <view class="nav-actions">
          <view class="nav-btn" @click="handleShare">
            <image class="nav-icon" src="/static/icons/share.png" mode="aspectFit" />
          </view>
          <view class="nav-btn" @click="handleEdit">
            <image class="nav-icon" src="/static/icons/edit.png" mode="aspectFit" />
          </view>
          <view class="nav-btn danger" @click="handleDelete">
            <image class="nav-icon" src="/static/icons/delete.png" mode="aspectFit" />
          </view>
        </view>
      </template>
    </AppHeader>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 文章内容 -->
    <scroll-view v-else class="content-scroll" scroll-y>
      <!-- 标题区域 -->
      <view class="article-header">
        <text class="article-title">{{ article.title }}</text>
        <view class="article-meta">
          <view class="status-badge" :class="article.status">
            <text>{{ article.status === 'public' ? '公开' : '私有' }}</text>
          </view>
          <text class="meta-text">{{ formatDate(article.updated_at) }}</text>
          <text class="meta-dot">·</text>
          <text class="meta-text">阅读 {{ article.view_count || 0 }}</text>
        </view>
        <view v-if="article.tags && article.tags.length" class="tags-row">
          <view v-for="(tag, i) in article.tags" :key="i" class="tag-chip">
            <text>{{ tag }}</text>
          </view>
        </view>
      </view>

      <!-- Markdown 渲染内容 -->
      <view class="article-body">
        <rich-text :nodes="htmlContent"></rich-text>
      </view>

      <view class="safe-bottom"></view>
    </scroll-view>

  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { kbApi } from '@/api/index'
import { formatDate as formatDateUtil } from '@/utils/date'
import { storage, STORAGE_KEYS } from '@/utils/storage'
import AppHeader from '@/components/AppHeader.vue'

const loading = ref(true)
const article = ref({})
let articleId = null

const md = new MarkdownIt({ html: true, breaks: true, linkify: true })

const htmlContent = computed(() => {
  if (!article.value.content) return ''
  try {
    return md.render(article.value.content)
  } catch (e) {
    return article.value.content
  }
})

const loadArticle = async () => {
  loading.value = true
  try {
    const data = await kbApi.getArticleDetail(articleId)
    article.value = data || {}
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  articleId = options.id

  if (!articleId) {
    uni.showToast({ title: '缺少文章ID', icon: 'none' })
    return
  }

  await loadArticle()

  // 监听文章更新事件
  uni.$on('articleUpdated', () => {
    loadArticle()
  })
})

onUnmounted(() => {
  // 移除事件监听
  uni.$off('articleUpdated')
})

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/kb/index' })
  }
}

const handleEdit = () => {
  uni.navigateTo({ url: `/pages/kb/editor?id=${articleId}` })
}

const handleShare = () => {
  if (!article.value.slug) {
    uni.showToast({ title: '文章未公开，无法分享', icon: 'none' })
    return
  }
  const serverUrl = storage.get(STORAGE_KEYS.SERVER_URL, '')
  const shareUrl = `${serverUrl}/kb/share/${article.value.slug}`
  uni.setClipboardData({
    data: shareUrl,
    success: () => {
      uni.showToast({ title: '分享链接已复制', icon: 'success' })
    }
  })
}

const handleDelete = () => {
  uni.showModal({
    title: '确认删除',
    content: '删除后不可恢复，确定要删除这篇文章吗？',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          await kbApi.deleteArticle(articleId)
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 500)
        } catch (e) {
          uni.showToast({ title: e.message || '删除失败', icon: 'none' })
        }
      }
    }
  })
}

const formatDate = (dateStr) => {
  return formatDateUtil(dateStr, 'YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #fff;
}

.nav-left {
  display: flex;
  align-items: center;
}

.back-icon {
  font-size: 48rpx;
  color: #1e293b;
  font-weight: 300;
  line-height: 1;
}

.nav-title {
  margin-left: 8rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
}

.nav-actions {
  display: flex;
  align-items: center;
}

.nav-actions > view + view {
  margin-left: 16rpx;
}

.nav-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 12rpx;
}

.nav-icon {
  width: 36rpx;
  height: 36rpx;
}

.content-scroll {
  height: calc(100vh - var(--status-bar-height) - var(--toolbar-height));
}

.article-header {
  padding: 32rpx;
  border-bottom: 2rpx solid #f1f5f9;

  .article-title {
    font-size: 44rpx;
    font-weight: 700;
    color: #1e293b;
    line-height: 1.4;
    display: block;
    margin-bottom: 20rpx;
  }

  .article-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8rpx;
  }

  .status-badge {
    padding: 4rpx 16rpx;
    border-radius: 8rpx;
    margin-right: 8rpx;

    text { font-size: 22rpx; }

    &.public {
      background: #f0fdf4;
      text { color: #22c55e; }
    }
    &.private, &.published {
      background: #f1f5f9;
      text { color: #94a3b8; }
    }
  }

  .meta-text {
    font-size: 24rpx;
    color: #94a3b8;
  }

  .meta-dot {
    font-size: 24rpx;
    color: #cbd5e1;
    margin: 0 4rpx;
  }

  .tags-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-top: 20rpx;
  }

  .tag-chip {
    padding: 6rpx 20rpx;
    background: #eff6ff;
    border-radius: 8rpx;
    text { font-size: 24rpx; color: #2563eb; }
  }
}

.article-body {
  padding: 32rpx;
  font-size: 30rpx;
  color: #334155;
  line-height: 1.8;
  word-break: break-word;
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;

  .loading-spinner {
    width: 64rpx;
    height: 64rpx;
    border: 4rpx solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 24rpx;
  }

  .loading-text { font-size: 28rpx; color: #64748b; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.safe-bottom {
  height: calc(var(--safe-bottom) + 40rpx);
}
</style>
