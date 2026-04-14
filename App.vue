<template>
	<view />
</template>

<script>
	import { useAuthStore } from '@/stores/auth'

	const applySafeAreaVars = () => {
		try {
			const systemInfo = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {}
			const statusBarHeight = Number(systemInfo.statusBarHeight || 0)
			const safeAreaInsets = systemInfo.safeAreaInsets || {}
			const safeBottom = Number(safeAreaInsets.bottom || 0)
			const root = typeof document !== 'undefined' ? document.documentElement : null
			if (!root) {
				return
			}

			root.style.setProperty('--status-bar-height', `${statusBarHeight || 0}px`)
			root.style.setProperty('--safe-top-fallback', `${statusBarHeight || 0}px`)
			root.style.setProperty('--safe-bottom-fallback', `${safeBottom || 0}px`)
		} catch (error) {
			console.warn('apply safe area vars failed', error)
		}
	}
	
	export default {
		onLaunch: async function() {
			console.log('App Launch')
			applySafeAreaVars()
			const authStore = useAuthStore()
			authStore.init()
		},
		onShow: async function() {
			console.log('App Show')
			applySafeAreaVars()
			const authStore = useAuthStore()
			authStore.init()
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	page {
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.08), transparent 32%),
			radial-gradient(circle at top right, rgba(30, 64, 175, 0.08), transparent 28%),
			linear-gradient(180deg, #f6f8fb 0%, #eef3f7 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Helvetica Neue', sans-serif;
		font-size: 28rpx;
		color: #102033;
		line-height: 1.5;
	}
	
	view, text {
		box-sizing: border-box;
	}
	
	:root {
		--status-bar-height: 44px;
		--safe-top-fallback: 44px;
		--safe-bottom-fallback: 0px;
		--safe-top: env(safe-area-inset-top, var(--safe-top-fallback));
		--safe-bottom: env(safe-area-inset-bottom, var(--safe-bottom-fallback));
		--app-top-offset: 28rpx;
		--app-top-offset-tight: 18rpx;
		--login-top-offset: 88rpx;
		--toolbar-height: 88rpx;
		--page-gutter: 36rpx;
		--page-gutter-wide: 40rpx;
		--panel-padding: 32rpx;
		--content-gap: 24rpx;
		--app-bg: #eef3f7;
		--surface-1: rgba(255, 255, 255, 0.78);
		--surface-2: #ffffff;
		--surface-3: #f4f7fb;
		--surface-4: #e7eef6;
		--line-soft: rgba(148, 163, 184, 0.18);
		--line-strong: rgba(71, 85, 105, 0.18);
		--text-main: #102033;
		--text-secondary: #5b6b7f;
		--text-muted: #8c99ab;
		--brand: #0f766e;
		--brand-strong: #115e59;
		--brand-soft: rgba(15, 118, 110, 0.12);
		--accent: #1d4ed8;
		--danger: #dc2626;
		--shadow-soft: 0 16rpx 40rpx rgba(15, 23, 42, 0.06);
		--shadow-strong: 0 20rpx 60rpx rgba(15, 23, 42, 0.09);
		--radius-panel: 28rpx;
		--radius-card: 24rpx;
		--radius-pill: 999rpx;
	}
	
	.flex {
		display: flex;
	}
	
	.flex-1 {
		flex: 1;
	}
	
	.items-center {
		align-items: center;
	}
	
	.justify-center {
		justify-content: center;
	}
	
	.justify-between {
		justify-content: space-between;
	}
	
	.text-center {
		text-align: center;
	}
	
	.text-primary {
		color: var(--accent);
	}
	
	.text-secondary {
		color: var(--text-secondary);
	}
	
	.text-muted {
		color: var(--text-muted);
	}
	
	.text-danger {
		color: var(--danger);
	}
	
	.text-success {
		color: var(--brand);
	}
	
	button {
		margin: 0;
		padding: 0;
		background: none;
		border: none;
		line-height: inherit;
		
		&::after {
			border: none;
		}
	}
	
	input,
	textarea {
		background: transparent;
	}
	
	::-webkit-scrollbar {
		display: none;
		width: 0;
		height: 0;
	}
</style>
