<template>
  <view class="kb-page">
    <AppHeader :placeholder="true">
      <template #right>
        <view class="navbar-actions">
          <view class="action-btn" @click="showCategoryModal = true">
            <image class="action-icon" src="/static/icons/fonder.png" mode="aspectFit" />
          </view>
          <view class="action-btn accent" @click="goCreateArticle">
            <image class="action-icon" src="/static/icons/edit.png" mode="aspectFit" />
          </view>
        </view>
      </template>
    </AppHeader>
    <view class="page-shell">
      <view class="page-intro">
        <text class="eyebrow">Knowledge Base</text>
        <text class="page-title">知识库</text>
      </view>
      <view class="search-panel">
        <view class="search-bar">
          <text class="search-icon">⌕</text>
          <input
            class="search-input"
            type="text"
            name="articleSearch"
            v-model="keyword"
            placeholder="搜索文章标题、摘要或标签"
            @confirm="onSearch"
          />
          <text v-if="keyword" class="search-clear" @click="clearSearch">×</text>
        </view>
      </view>

      <view class="filter-panel">
        <scroll-view class="category-scroll" scroll-x :show-scrollbar="false">
          <view class="chip-row">
            <view class="filter-chip" :class="{ active: !selectedCategoryId }" @click="selectCategory(null)">
              <text>全部分类</text>
            </view>
            <view
              v-for="cat in flatCategories"
              :key="cat.id"
              class="filter-chip"
              :class="{ active: selectedCategoryId === cat.id }"
              @click="selectCategory(cat.id)"
            >
              <text>{{ cat.prefix }}{{ cat.title }}</text>
            </view>
          </view>
        </scroll-view>

        <view class="chip-row status-row">
          <view class="filter-chip compact" :class="{ active: !statusFilter }" @click="setStatus('')">
            <text>全部</text>
          </view>
          <view class="filter-chip compact" :class="{ active: statusFilter === 'private' }" @click="setStatus('private')">
            <text>私有</text>
          </view>
          <view class="filter-chip compact" :class="{ active: statusFilter === 'public' }" @click="setStatus('public')">
            <text>公开</text>
          </view>
        </view>
      </view>

      <scroll-view
        class="article-list"
        scroll-y
        :refresher-enabled="true"
        :refresher-triggered="refreshing"
        @refresherrefresh="onRefresh"
        @scrolltolower="loadMore"
      >
        <view v-if="loading && articles.length === 0" class="state-block">
          <view class="loading-spinner"></view>
          <text class="state-title">加载文章中</text>
          <text class="state-desc">正在同步知识库内容</text>
        </view>

        <view v-else-if="articles.length === 0" class="state-block">
          <text class="state-icon">✦</text>
          <text class="state-title">{{ keyword ? '没有找到匹配文章' : '暂无文章' }}</text>
          <text class="state-desc">{{ keyword ? '调整条件后重新搜索' : '创建一篇文章开始沉淀知识' }}</text>
          <view v-if="!keyword" class="primary-inline-btn" @click="goCreateArticle">
            <text>新建文章</text>
          </view>
        </view>

        <view v-else class="article-stack">
          <view
            v-for="article in articles"
            :key="article.id"
            class="article-item"
            @click="goDetail(article)"
          >
            <view class="article-top">
              <text class="article-title">{{ article.title }}</text>
              <view class="status-badge" :class="article.status">
                <text>{{ article.status === 'public' ? '公开' : '私有' }}</text>
              </view>
            </view>
            <text v-if="article.summary" class="article-summary">{{ article.summary }}</text>
            <text v-else class="article-summary muted">暂无摘要</text>
            <view class="article-bottom">
              <view class="tag-row">
                <view v-for="(tag, i) in (article.tags || []).slice(0, 3)" :key="i" class="tag-chip">
                  <text>{{ tag }}</text>
                </view>
              </view>
              <text class="article-time">{{ formatDate(article.updated_at) }}</text>
            </view>
          </view>
        </view>

        <view v-if="loading && articles.length > 0" class="loading-more">
          <text>加载更多...</text>
        </view>
        <view v-if="!loading && noMore && articles.length > 0" class="no-more">
          <text>没有更多了</text>
        </view>

        <view class="bottom-safe"></view>
      </scroll-view>

      <view v-if="showCategoryModal" class="modal-mask" @click="showCategoryModal = false">
        <view class="modal-content" @click.stop>
          <view class="modal-header">
            <text class="modal-title">分类管理</text>
            <text class="modal-close" @click="showCategoryModal = false">×</text>
          </view>
          <view class="add-category-row">
            <input
              class="category-input"
              name="categoryTitle"
              v-model="newCategoryTitle"
              placeholder="输入分类名称"
              @confirm="handleAddCategory"
            />
            <view class="add-btn" @click="handleAddCategory">
              <text>添加</text>
            </view>
          </view>
          <scroll-view class="modal-list" scroll-y>
            <view v-if="categories.length === 0" class="empty-cat">
              <text>暂无分类</text>
            </view>
            <view v-for="cat in categories" :key="cat.id" class="category-item">
              <view class="category-row">
                <text class="cat-name">{{ cat.title }}</text>
                <text class="cat-action-btn" @click="handleDeleteCategory(cat)">删除</text>
              </view>
              <view v-if="cat.children && cat.children.length" class="sub-categories">
                <view v-for="sub in cat.children" :key="sub.id" class="category-row sub">
                  <text class="cat-name">{{ sub.title }}</text>
                  <text class="cat-action-btn" @click="handleDeleteCategory(sub)">删除</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { kbApi } from '@/api/index'
import { useAuthStore } from '@/stores/auth'
import { formatDate as formatDateUtil } from '@/utils/date'
import AppHeader from '@/components/AppHeader.vue'

const authStore = useAuthStore()
let initialized = false

const loading = ref(false)
const refreshing = ref(false)
const keyword = ref('')
const selectedCategoryId = ref(null)
const statusFilter = ref('')
const articles = ref([])
const categories = ref([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const noMore = ref(false)

const showCategoryModal = ref(false)
const newCategoryTitle = ref('')

const flatCategories = computed(() => {
  const result = []
  const flatten = (items, prefix = '') => {
    items.forEach(item => {
      result.push({ id: item.id, title: item.title, prefix })
      if (item.children?.length) {
        flatten(item.children, prefix + '　')
      }
    })
  }
  flatten(categories.value)
  return result
})

onMounted(async () => {
  authStore.init()

  if (!authStore.state.isLoggedIn) {
    uni.reLaunch({ url: '/pages/login/login' })
    return
  }
  await Promise.all([loadCategories(), loadArticles()])
  initialized = true
})

const onShowHook = async () => {
  if (!initialized) return
  page.value = 1
  await loadArticles(1)
}

defineExpose({ onShowHook })

const loadCategories = async () => {
  try {
    const data = await kbApi.getCategoryTree()
    categories.value = data || []
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

const loadArticles = async (p) => {
  loading.value = true
  try {
    const params = {
      page: p || page.value,
      page_size: pageSize,
    }
    if (selectedCategoryId.value) params.category_id = selectedCategoryId.value
    if (keyword.value) params.keyword = keyword.value
    if (statusFilter.value) params.status = statusFilter.value

    const data = await kbApi.getArticleList(params)
    const items = data?.items || []

    if (p === 1 || !p) {
      articles.value = items
    } else {
      articles.value = [...articles.value, ...items]
    }
    total.value = data?.total || 0
    noMore.value = articles.value.length >= total.value
  } catch (e) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
  page.value = 1
  loadArticles(1)
}

const clearSearch = () => {
  keyword.value = ''
  page.value = 1
  loadArticles(1)
}

const selectCategory = (id) => {
  selectedCategoryId.value = id
  page.value = 1
  loadArticles(1)
}

const setStatus = (s) => {
  statusFilter.value = s
  page.value = 1
  loadArticles(1)
}

const onRefresh = async () => {
  refreshing.value = true
  page.value = 1
  await Promise.all([loadCategories(), loadArticles(1)])
  refreshing.value = false
}

const loadMore = () => {
  if (loading.value || noMore.value) return
  page.value++
  loadArticles(page.value)
}

const goCreateArticle = () => {
  const params = selectedCategoryId.value ? `?category_id=${selectedCategoryId.value}` : ''
  uni.navigateTo({ url: `/pages/kb/editor${params}` })
}

const goDetail = (article) => {
  uni.navigateTo({ url: `/pages/kb/detail?id=${article.id}` })
}

const handleAddCategory = async () => {
  const title = newCategoryTitle.value.trim()
  if (!title) return
  try {
    await kbApi.createCategory({ title })
    newCategoryTitle.value = ''
    uni.showToast({ title: '创建成功', icon: 'success' })
    await loadCategories()
  } catch (e) {
    uni.showToast({ title: e.message || '创建失败', icon: 'none' })
  }
}

const handleDeleteCategory = (cat) => {
  uni.showModal({
    title: '确认删除',
    content: `确定删除分类「${cat.title}」？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await kbApi.deleteCategory(cat.id)
          uni.showToast({ title: '删除成功', icon: 'success' })
          await loadCategories()
        } catch (e) {
          uni.showToast({ title: e.message || '删除失败', icon: 'none' })
        }
      }
    }
  })
}

const formatDate = (dateStr) => {
  return formatDateUtil(dateStr, 'MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.kb-page {
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

.search-panel,
.filter-panel,
.article-item,
.state-block,
.modal-content {
  background: var(--surface-1);
  backdrop-filter: blur(18px);
  border: 1rpx solid var(--line-soft);
  box-shadow: var(--shadow-soft);
}

.search-panel,
.filter-panel {
  border-radius: 30rpx;
  margin-bottom: 20rpx;
}

.eyebrow,
.article-summary,
.article-time,
.state-desc {
  color: var(--text-secondary);
}

.eyebrow {
  display: block;
  font-size: 22rpx;
  text-transform: uppercase;
  letter-spacing: 3rpx;
}

.page-title {
  display: block;
  margin-top: 8rpx;
  font-size: 42rpx;
  color: var(--text-main);
  font-weight: 700;
}


.navbar-actions {
  display: flex;
}

.navbar-actions > view + view {
  margin-left: 14rpx;
}

.action-btn {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  background: rgba(16, 32, 51, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.accent {
  background: rgba(15, 118, 110, 0.12);
}

.action-icon {
  width: 36rpx;
  height: 36rpx;
}

.search-panel {
  padding: 20rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  height: 84rpx;
  border-radius: 22rpx;
  background: var(--surface-2);
  padding: 0 24rpx;
}

.search-icon,
.search-clear {
  color: var(--text-muted);
}

.search-icon {
  margin-right: 16rpx;
  font-size: 30rpx;
}

.search-input {
  flex: 1;
  height: 100%;
  color: var(--text-main);
  font-size: 28rpx;
}

.search-clear {
  font-size: 42rpx;
}

.filter-panel {
  padding: 22rpx;
}

.category-scroll {
  white-space: nowrap;
}

.chip-row {
  display: flex;
}

.chip-row > view + view {
  margin-left: 14rpx;
}

.status-row {
  margin-top: 16rpx;
  flex-wrap: wrap;
}

.filter-chip {
  flex-shrink: 0;
  min-height: 64rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: rgba(16, 32, 51, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-chip text {
  font-size: 24rpx;
  color: var(--text-secondary);
}

.filter-chip.active {
  background: linear-gradient(135deg, var(--brand-strong), var(--brand));
}

.filter-chip.active text {
  color: #fff;
}

.filter-chip.compact {
  min-width: 110rpx;
}

.article-list {
  height: calc(100vh - var(--safe-top) - 430rpx - var(--safe-bottom));
}

.article-stack {
  display: flex;
  flex-direction: column;
}

.article-stack > view + view {
  margin-top: 16rpx;
}

.article-item,
.state-block {
  border-radius: 28rpx;
}

.article-item {
  padding: 24rpx;
}

.article-top,
.article-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.article-top > view + view,
.article-top > text + text,
.article-bottom > view + view,
.article-bottom > text + text {
  margin-left: 18rpx;
}

.article-title,
.state-title,
.modal-title,
.cat-name {
  color: var(--text-main);
  font-weight: 700;
}

.article-title {
  flex: 1;
  min-width: 0;
  font-size: 30rpx;
}

.status-badge {
  min-width: 84rpx;
  height: 48rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-badge.public {
  background: rgba(15, 118, 110, 0.12);
  color: var(--brand);
}

.status-badge.private {
  background: rgba(29, 78, 216, 0.1);
  color: var(--accent);
}

.status-badge text {
  font-size: 22rpx;
}

.article-summary {
  display: block;
  margin-top: 14rpx;
  font-size: 24rpx;
  line-height: 1.6;
}

.article-summary.muted {
  color: var(--text-muted);
}

.article-bottom {
  margin-top: 20rpx;
  align-items: flex-end;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  margin-left: -10rpx;
  margin-top: -10rpx;
}

.tag-row > view,
.tag-row > text {
  margin-left: 10rpx;
  margin-top: 10rpx;
}

.tag-chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(29, 78, 216, 0.08);
}

.tag-chip text {
  font-size: 22rpx;
  color: var(--accent);
}

.article-time,
.loading-more,
.no-more,
.empty-cat {
  font-size: 22rpx;
}

.state-block {
  padding: 64rpx 32rpx;
  text-align: center;
}

.state-icon {
  font-size: 54rpx;
  color: var(--brand);
}

.state-title {
  display: block;
  margin-top: 18rpx;
  font-size: 30rpx;
}

.state-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
}

.primary-inline-btn {
  width: 220rpx;
  height: 74rpx;
  margin: 26rpx auto 0;
  border-radius: 22rpx;
  background: linear-gradient(135deg, var(--brand-strong), var(--brand));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
}

.loading-spinner {
  width: 56rpx;
  height: 56rpx;
  margin: 0 auto;
  border-radius: 50%;
  border: 6rpx solid rgba(15, 118, 110, 0.14);
  border-top-color: var(--brand);
  animation: spin 0.8s linear infinite;
}

.loading-more,
.no-more {
  padding: 24rpx 0;
  text-align: center;
  color: var(--text-secondary);
}

.bottom-safe {
  height: calc(36rpx + var(--safe-bottom));
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(7, 16, 29, 0.28);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  border-radius: 36rpx 36rpx 0 0;
  padding-top: 28rpx;
  padding-right: 28rpx;
  padding-bottom: calc(32rpx + var(--safe-bottom));
  padding-left: 28rpx;
}

.modal-header,
.category-row,
.add-category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header > view + view,
.category-row > view + view,
.add-category-row > view + view,
.add-category-row > input + view {
  margin-left: 16rpx;
}

.modal-header {
  margin-bottom: 20rpx;
}

.modal-title {
  font-size: 32rpx;
}

.modal-close {
  font-size: 46rpx;
  color: var(--text-muted);
}

.add-category-row {
  margin-bottom: 18rpx;
}

.category-input {
  flex: 1;
  height: 84rpx;
  padding: 0 22rpx;
  border-radius: 22rpx;
  background: var(--surface-2);
  font-size: 28rpx;
  color: var(--text-main);
}

.add-btn {
  width: 132rpx;
  height: 84rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, var(--brand-strong), var(--brand));
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
  font-weight: 700;
}

.modal-list {
  max-height: 52vh;
}

.category-item {
  padding: 22rpx 0;
  border-bottom: 1rpx solid var(--line-soft);
}

.cat-name {
  font-size: 28rpx;
}

.cat-action-btn {
  color: var(--danger);
  font-size: 24rpx;
}

.sub-categories {
  margin-top: 12rpx;
}

.category-row.sub {
  padding-left: 20rpx;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
