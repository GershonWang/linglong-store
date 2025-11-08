/**
 * 图片加载 Composables
 * 优化图片加载逻辑，支持懒加载和错误处理
 */

import { ref, onUnmounted } from 'vue';

export interface UseImageLoaderOptions {
    lazy?: boolean;  // 是否懒加载
    placeholder?: string;  // 占位图
    errorImage?: string;  // 错误时显示的图片
}

export function useImageLoader(src: string | (() => string), options: UseImageLoaderOptions = {}) {
    const { lazy = false, placeholder, errorImage } = options;
    
    const imageUrl = ref<string>(placeholder || '');
    const loading = ref(!lazy);
    const error = ref(false);

    let img: HTMLImageElement | null = null;

    /**
     * 加载图片
     */
    const loadImage = () => {
        if (error.value) return;
        
        const imageSrc = typeof src === 'function' ? src() : src;
        if (!imageSrc) {
            error.value = true;
            loading.value = false;
            if (errorImage) {
                imageUrl.value = errorImage;
            }
            return;
        }

        loading.value = true;
        error.value = false;

        img = new Image();
        
        img.onload = () => {
            imageUrl.value = imageSrc;
            loading.value = false;
            img = null;
        };
        
        img.onerror = () => {
            error.value = true;
            loading.value = false;
            imageUrl.value = errorImage || placeholder || '';
            img = null;
        };

        img.src = imageSrc;
    };

    // 如果不是懒加载，立即加载
    if (!lazy) {
        loadImage();
    }

    onUnmounted(() => {
        if (img) {
            img.onload = null;
            img.onerror = null;
            img = null;
        }
    });

    return {
        imageUrl,
        loading,
        error,
        loadImage,
        reload: loadImage,
    };
}

