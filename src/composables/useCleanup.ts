/**
 * 清理机制 Composables
 * 统一管理组件卸载时的清理任务
 */

import { onUnmounted } from 'vue';

export function useCleanup() {
    const cleanupTasks: (() => void)[] = [];

    /**
     * 添加清理任务
     * @param task 清理函数
     */
    const addCleanup = (task: () => void) => {
        cleanupTasks.push(task);
    };

    /**
     * 执行所有清理任务
     */
    const cleanup = () => {
        cleanupTasks.forEach(task => {
            try {
                task();
            } catch (error) {
                console.error('清理任务执行失败:', error);
            }
        });
        cleanupTasks.length = 0;
    };

    onUnmounted(() => {
        cleanup();
    });

    return { 
        addCleanup,
        cleanup,
    };
}

