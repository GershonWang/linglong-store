/**
 * 无限滚动 Composables
 * 封装无限滚动加载逻辑
 */

import { ref, onMounted, onUnmounted } from 'vue';

export interface UseInfiniteScrollOptions {
    threshold?: number;  // 触发加载的距离阈值（像素）
    immediate?: boolean;  // 是否立即检查
}

export function useInfiniteScroll(
    callback: () => void | Promise<void>,
    options: UseInfiniteScrollOptions = {}
) {
    const { threshold = 100, immediate = false } = options;
    
    const isLoading = ref(false);
    const isFinished = ref(false);
    const containerRef = ref<HTMLElement | null>(null);

    /**
     * 检查是否需要加载更多
     */
    const checkScroll = async () => {
        if (isLoading.value || isFinished.value || !containerRef.value) {
            return;
        }

        const container = containerRef.value;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;

        // 检查是否接近底部
        if (scrollHeight - scrollTop - clientHeight < threshold) {
            isLoading.value = true;
            try {
                await callback();
            } catch (error) {
                console.error('无限滚动加载失败:', error);
            } finally {
                isLoading.value = false;
            }
        }
    };

    /**
     * 滚动事件处理
     */
    const handleScroll = () => {
        checkScroll();
    };

    /**
     * 重置状态
     */
    const reset = () => {
        isLoading.value = false;
        isFinished.value = false;
    };

    /**
     * 完成加载
     */
    const finish = () => {
        isFinished.value = true;
        isLoading.value = false;
    };

    onMounted(() => {
        if (containerRef.value) {
            containerRef.value.addEventListener('scroll', handleScroll);
            if (immediate) {
                checkScroll();
            }
        }
    });

    onUnmounted(() => {
        if (containerRef.value) {
            containerRef.value.removeEventListener('scroll', handleScroll);
        }
    });

    return {
        containerRef,
        isLoading,
        isFinished,
        reset,
        finish,
        checkScroll,
    };
}

