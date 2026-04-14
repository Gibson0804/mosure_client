<template>
  <view class="editor-page">
    <AppHeader :placeholder="true" bordered>
      <template #left>
        <view class="nav-left" @click="goBack">
          <text class="back-icon">‹</text>
          <text class="nav-title">编辑文章</text>
        </view>
      </template>
      <template #right>
        <view class="nav-actions">
          <view class="nav-btn" @click="showSettings = true">
            <image class="nav-icon" src="/static/icons/setting.png" mode="aspectFit" />
          </view>
          <view class="save-btn" :class="{ disabled: saving }" @click="handleSave">
            <text>{{ saving ? '保存中' : '保存' }}</text>
          </view>
        </view>
      </template>
    </AppHeader>

    <!-- 加载中 -->
    <view v-if="loading" class="loading-state">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载中...</text>
    </view>

    <view v-else class="editor-body">
      <!-- 标题输入 -->
      <input
        class="title-input"
        v-model="title"
        placeholder="请输入文章标题..."
        maxlength="200"
      />

      <!-- 富文本编辑器 -->
      <view class="editor-wrap">
        <editor
          id="editor"
          class="ql-container"
          :placeholder="'开始编辑内容...'"
          :read-only="false"
          @ready="onEditorReady"
          @input="onEditorInput"
          @statuschange="onStatusChange"
        />
      </view>
    </view>

    <!-- 工具栏 -->
    <view v-if="!loading && editorReady" class="toolbar">
      <scroll-view class="toolbar-scroll" scroll-x :show-scrollbar="false">
        <view class="toolbar-items">
          <view class="tool-btn" :class="{ active: formats.bold }" @click="formatText('bold')">
            <text class="tool-text tool-bold">B</text>
          </view>
          <view class="tool-btn" :class="{ active: formats.italic }" @click="formatText('italic')">
            <text class="tool-text tool-italic">I</text>
          </view>
          <view class="tool-btn" :class="{ active: formats.underline }" @click="formatText('underline')">
            <text class="tool-text tool-underline">U</text>
          </view>
          <view class="tool-btn" :class="{ active: formats.strike }" @click="formatText('strike')">
            <text class="tool-text tool-strike">S</text>
          </view>
          <view class="tool-sep"></view>
          <view class="tool-btn" :class="{ active: formats.header === 2 }" @click="formatHeader(2)">
            <text class="tool-text">H2</text>
          </view>
          <view class="tool-btn" :class="{ active: formats.header === 3 }" @click="formatHeader(3)">
            <text class="tool-text">H3</text>
          </view>
          <view class="tool-sep"></view>
          <view class="tool-btn" :class="{ active: formats.list === 'bullet' }" @click="formatList('bullet')">
            <text class="tool-text">≡</text>
          </view>
          <view class="tool-btn" :class="{ active: formats.list === 'ordered' }" @click="formatList('ordered')">
            <text class="tool-text">1.</text>
          </view>
          <view class="tool-sep"></view>
          <view class="tool-btn" @click="handleUploadImage">
            <text class="tool-text">🖼</text>
          </view>
          <view class="tool-btn" @click="insertDivider">
            <text class="tool-text">—</text>
          </view>
          <view class="tool-btn" @click="undoAction">
            <text class="tool-text">↩</text>
          </view>
          <view class="tool-btn" @click="redoAction">
            <text class="tool-text">↪</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 设置面板 -->
    <view v-if="showSettings" class="modal-mask" @click="showSettings = false">
      <view class="settings-panel" @click.stop>
        <view class="panel-header">
          <text class="panel-title">文章设置</text>
          <text class="panel-close" @click="showSettings = false">✕</text>
        </view>

        <scroll-view class="panel-body" scroll-y>
          <!-- 分类 -->
          <view class="form-group">
            <text class="form-label">分类</text>
            <picker
              :range="categoryOptions"
              range-key="label"
              :value="categoryIndex"
              @change="onCategoryChange"
            >
              <view class="picker-value">
                <text>{{ selectedCategoryLabel }}</text>
                <text class="picker-arrow">›</text>
              </view>
            </picker>
          </view>

          <!-- 摘要 -->
          <view class="form-group">
            <text class="form-label">摘要</text>
            <textarea
              class="form-textarea"
              v-model="summary"
              placeholder="文章摘要（可选）"
              :auto-height="true"
              maxlength="500"
            />
          </view>

          <!-- 标签 -->
          <view class="form-group">
            <text class="form-label">标签</text>
            <view class="tags-wrap">
              <view v-for="(tag, i) in tags" :key="i" class="tag-item">
                <text>{{ tag }}</text>
                <text class="tag-remove" @click="removeTag(i)">×</text>
              </view>
            </view>
            <view class="tag-input-row">
              <input
                class="tag-input"
                v-model="tagInput"
                placeholder="输入标签后回车"
                @confirm="addTag"
              />
              <view class="tag-add-btn" @click="addTag">
                <text>添加</text>
              </view>
            </view>
          </view>

          <!-- 状态 -->
          <view class="form-group">
            <text class="form-label">状态</text>
            <view class="status-row">
              <view
                class="status-option"
                :class="{ active: status === 'private' }"
                @click="status = 'private'"
              >
                <text>私有</text>
              </view>
              <view
                class="status-option"
                :class="{ active: status === 'public' }"
                @click="status = 'public'"
              >
                <text>公开</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import TurndownService from 'turndown'
import { kbApi } from '@/api/index'
import AppHeader from '@/components/AppHeader.vue'

const mdParser = new MarkdownIt({ html: true, breaks: true, linkify: true })
const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
})

const loading = ref(false)
const saving = ref(false)
const showSettings = ref(false)
const editorReady = ref(false)

const title = ref('')
const mdContent = ref('')
const summary = ref('')
const status = ref('private')
const tags = ref([])
const tagInput = ref('')
const categoryId = ref(null)
const categories = ref([])

const formats = ref({})
let articleId = null
let editorCtx = null

const onEditorReady = () => {
  uni.createSelectorQuery()
    .select('#editor')
    .context((res) => {
      editorCtx = res.context
      editorReady.value = true
      if (mdContent.value) {
        const html = mdParser.render(mdContent.value)
        editorCtx.setContents({ html })
      }
    })
    .exec()
}

const onEditorInput = (e) => {
  // 内容变化时不需要实时转 md，保存时再转
}

const onStatusChange = (e) => {
  formats.value = e.detail || {}
}

const formatText = (name) => {
  if (!editorCtx) return
  editorCtx.format(name, !formats.value[name])
}

const formatHeader = (level) => {
  if (!editorCtx) return
  const current = formats.value.header
  editorCtx.format('header', current === level ? false : level)
}

const formatList = (type) => {
  if (!editorCtx) return
  const current = formats.value.list
  editorCtx.format('list', current === type ? false : type)
}

const formatBlockquote = () => {
  if (!editorCtx) return
  editorCtx.format('blockquote', !formats.value.blockquote)
}

const formatCodeBlock = () => {
  if (!editorCtx) return
  editorCtx.format('code-block', !formats.value['code-block'])
}

const insertLink = () => {
  if (!editorCtx) return
  uni.showModal({
    title: '链接文字',
    editable: true,
    placeholderText: '请输入显示文字',
    success: (nameRes) => {
      if (!nameRes.confirm) return
      const linkText = nameRes.content || '链接'
      uni.showModal({
        title: '链接地址',
        editable: true,
        placeholderText: '请输入 URL（如 https://...）',
        success: (urlRes) => {
          if (urlRes.confirm && urlRes.content) {
            editorCtx.insertText({ text: linkText })
            editorCtx.format('link', urlRes.content)
          }
        }
      })
    }
  })
}

const insertDivider = () => {
  if (!editorCtx) return
  editorCtx.insertDivider()
}

const undoAction = () => {
  if (!editorCtx) return
  editorCtx.undo()
}

const redoAction = () => {
  if (!editorCtx) return
  editorCtx.redo()
}

const handleUploadImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempPath = res.tempFilePaths[0]
      uni.showLoading({ title: '上传中...', mask: true })
      try {
        const data = await kbApi.uploadImage(tempPath)
        if (data?.url && editorCtx) {
          editorCtx.insertImage({
            src: data.url,
            alt: '图片',
            width: '100%',
          })
          uni.showToast({ title: '插入成功', icon: 'success' })
        }
      } catch (e) {
        uni.showToast({ title: e.message || '上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const categoryOptions = computed(() => {
  const opts = [{ id: null, label: '未分类' }]
  const flatten = (items, depth = 0) => {
    items.forEach(item => {
      opts.push({ id: item.id, label: '　'.repeat(depth) + item.title })
      if (item.children?.length) flatten(item.children, depth + 1)
    })
  }
  flatten(categories.value)
  return opts
})

const categoryIndex = computed(() => {
  const idx = categoryOptions.value.findIndex(c => c.id === categoryId.value)
  return idx >= 0 ? idx : 0
})

const selectedCategoryLabel = computed(() => {
  return categoryOptions.value[categoryIndex.value]?.label || '未分类'
})

onMounted(async () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}

  articleId = options.id || null
  const defaultCategoryId = options.category_id || null
  if (defaultCategoryId) categoryId.value = Number(defaultCategoryId)

  await loadCategories()

  if (articleId) {
    loading.value = true
    try {
      const data = await kbApi.getArticleDetail(articleId)
      if (data) {
        title.value = data.title || ''
        mdContent.value = data.content || ''
        summary.value = data.summary || ''
        status.value = data.status || 'private'
        tags.value = data.tags || []
        if (data.category_id) categoryId.value = data.category_id
      }
    } catch (e) {
      uni.showToast({ title: e.message || '加载失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }
})

const loadCategories = async () => {
  try {
    const data = await kbApi.getCategoryTree()
    categories.value = data || []
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

const onCategoryChange = (e) => {
  const idx = Number(e.detail.value)
  categoryId.value = categoryOptions.value[idx]?.id || null
}

const addTag = () => {
  const t = tagInput.value.trim()
  if (t && !tags.value.includes(t)) {
    tags.value.push(t)
  }
  tagInput.value = ''
}

const removeTag = (index) => {
  tags.value.splice(index, 1)
}

const getEditorMarkdown = () => {
  return new Promise((resolve) => {
    if (!editorCtx) {
      resolve(mdContent.value)
      return
    }
    editorCtx.getContents({
      success: (res) => {
        try {
          const markdown = turndown.turndown(res.html || '')
          resolve(markdown)
        } catch (e) {
          resolve(mdContent.value)
        }
      },
      fail: () => {
        resolve(mdContent.value)
      }
    })
  })
}

const handleSave = async () => {
  if (saving.value) return
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入文章标题', icon: 'none' })
    return
  }

  saving.value = true
  try {
    const markdownContent = await getEditorMarkdown()

    const payload = {
      title: title.value.trim(),
      content: markdownContent,
      summary: summary.value,
      status: status.value,
      tags: tags.value,
      category_id: categoryId.value,
    }

    if (articleId) {
      await kbApi.updateArticle(articleId, payload)
    } else {
      const data = await kbApi.createArticle(payload)
      if (data?.id) articleId = data.id
    }

    mdContent.value = markdownContent
    uni.showToast({ title: '保存成功', icon: 'success' })

    // 通知详情页刷新
    uni.$emit('articleUpdated', { id: articleId })

    // 延迟返回，让用户看到成功提示
    setTimeout(() => {
      uni.navigateBack()
    }, 500)
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    uni.reLaunch({ url: '/pages/kb/index' })
  }
}
</script>

<style lang="scss" scoped>
.editor-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
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
  margin-left: 12rpx;
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

.save-btn {
  padding: 0 28rpx;
  height: 64rpx;
  background: #2563eb;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
}

.save-btn text {
  font-size: 28rpx;
  color: #fff;
}

.save-btn.disabled {
  opacity: 0.6;
}

.editor-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.title-input {
  padding: 24rpx 32rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: #1e293b;
  border-bottom: 2rpx solid #f1f5f9;
  flex-shrink: 0;
}

.editor-wrap {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100rpx;
}

.ql-container {
  width: 100%;
  min-height: calc(100vh - var(--safe-top) - 88rpx - 100rpx - 96rpx);
  padding: 20rpx 32rpx;
  font-size: 30rpx;
  line-height: 1.8;
  color: #334155;
  box-sizing: border-box;
}

.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 2rpx solid #e2e8f0;
  padding-bottom: var(--safe-bottom);
  z-index: 50;
}

.toolbar-scroll {
  white-space: nowrap;
}

.toolbar-items {
  display: flex;
  padding: 12rpx 16rpx;
  gap: 6rpx;
  align-items: center;
}

.tool-btn {
  width: 68rpx;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12rpx;
  flex-shrink: 0;

  .tool-text {
    font-size: 26rpx;
    color: #475569;
    font-weight: 600;
  }

  .tool-bold { font-weight: 800; }
  .tool-italic { font-style: italic; }
  .tool-underline { text-decoration: underline; }
  .tool-strike { text-decoration: line-through; }

  &.active {
    background: #dbeafe;
    .tool-text { color: #2563eb; }
  }

  &:active {
    background: #e2e8f0;
  }
}

.tool-sep {
  width: 2rpx;
  height: 40rpx;
  background: #e2e8f0;
  flex-shrink: 0;
  margin: 0 4rpx;
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

// 设置面板
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 99;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.settings-panel {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 2rpx solid #f1f5f9;

  .panel-title { font-size: 32rpx; font-weight: 600; color: #1e293b; }
  .panel-close { font-size: 40rpx; color: #94a3b8; padding: 0 16rpx; }
}

.panel-body {
  padding-top: 24rpx;
  padding-right: 32rpx;
  padding-bottom: calc(var(--safe-bottom) + 32rpx);
  padding-left: 32rpx;
  max-height: 60vh;
  width: auto;
}

.form-group {
  margin-bottom: 32rpx;

  .form-label {
    font-size: 28rpx;
    font-weight: 600;
    color: #475569;
    margin-bottom: 12rpx;
    display: block;
  }
}

.picker-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 2rpx solid #e2e8f0;

  text { font-size: 28rpx; color: #334155; }
  .picker-arrow { font-size: 32rpx; color: #94a3b8; }
}

.form-textarea {
  width: 100%;
  padding: 20rpx 24rpx;
  background: #f8fafc;
  border-radius: 12rpx;
  border: 2rpx solid #e2e8f0;
  font-size: 28rpx;
  color: #334155;
  box-sizing: border-box;
}

.tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 20rpx;
  background: #eff6ff;
  border-radius: 8rpx;

  text { font-size: 26rpx; color: #2563eb; }
  .tag-remove { font-size: 28rpx; color: #93c5fd; }
}

.tag-input-row {
  display: flex;
  gap: 12rpx;

  .tag-input {
    flex: 1;
    height: 72rpx;
    padding: 0 24rpx;
    background: #f8fafc;
    border-radius: 12rpx;
    border: 2rpx solid #e2e8f0;
    font-size: 28rpx;
  }

  .tag-add-btn {
    padding: 0 28rpx;
    height: 72rpx;
    background: #f1f5f9;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    text { font-size: 28rpx; color: #475569; }
  }
}

.status-row {
  display: flex;
  gap: 16rpx;

  .status-option {
    flex: 1;
    padding: 20rpx;
    background: #f8fafc;
    border-radius: 12rpx;
    border: 2rpx solid #e2e8f0;
    text-align: center;

    text { font-size: 28rpx; color: #64748b; }

    &.active {
      background: #eff6ff;
      border-color: #2563eb;
      text { color: #2563eb; }
    }
  }
}
</style>
