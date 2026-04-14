<template>
  <view v-if="placeholder" class="app-header-placeholder"></view>
  <view class="app-header" :class="{ overlay }">
    <view class="status-spacer"></view>
    <view class="toolbar" :class="{ bordered }">
      <view class="toolbar-left">
        <slot name="left"></slot>
      </view>
      <view class="toolbar-center">
        <slot></slot>
      </view>
      <view class="toolbar-right">
        <slot name="right"></slot>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  overlay: {
    type: Boolean,
    default: true
  },
  bordered: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: Boolean,
    default: false
  }
})
</script>

<style lang="scss" scoped>
.app-header-placeholder {
  height: calc(var(--status-bar-height) + var(--toolbar-height));
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
}

.app-header.overlay {
  pointer-events: none;
}

.app-header.overlay .toolbar-left,
.app-header.overlay .toolbar-center,
.app-header.overlay .toolbar-right {
  pointer-events: auto;
}

.status-spacer {
  height: var(--status-bar-height);
}

.toolbar {
  min-height: var(--toolbar-height);
  padding-top: 16rpx;
  padding-right: calc(var(--page-gutter-wide) + 10rpx);
  padding-bottom: 0;
  padding-left: var(--page-gutter-wide);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.toolbar > view + view {
  margin-left: 16rpx;
}

.toolbar.bordered {
  border-bottom: 1rpx solid rgba(148, 163, 184, 0.14);
}

.toolbar-left,
.toolbar-right {
  min-width: 160rpx;
  display: flex;
  align-items: center;
}

.toolbar-left {
  justify-content: flex-start;
}

.toolbar-center {
  flex: 1;
  min-width: 0;
}

.toolbar-right {
  justify-content: flex-end;
  padding-right: 8rpx;
}
</style>
