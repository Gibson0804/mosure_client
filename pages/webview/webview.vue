<template>
  <view class="webview-page">
    <web-view :src="url"></web-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const url = ref('')

onMounted(() => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = currentPage.$page?.options || currentPage.options || {}
  
  url.value = decodeURIComponent(options.url || '')
  
  const title = decodeURIComponent(options.title || '')
  if (title) {
    uni.setNavigationBarTitle({ title })
  }
})
</script>

<style scoped>
.webview-page {
  width: 100%;
  height: 100vh;
}
</style>
