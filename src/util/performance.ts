/**
 * 性能监控工具
 * 用于测量和记录性能指标
 */

export interface PerformanceMetric {
    name: string;
    duration: number;
    timestamp: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private isEnabled: boolean;

    constructor() {
        this.isEnabled = import.meta.env.DEV;
    }

    /**
     * 测量函数执行时间
     * @param name 性能指标名称
     * @param fn 要测量的函数
     * @returns 函数执行结果
     */
    measure<T>(name: string, fn: () => T): T {
        if (!this.isEnabled) {
            return fn();
        }

        const start = performance.now();
        const result = fn();
        const end = performance.now();
        const duration = end - start;

        this.recordMetric(name, duration);
        
        if (duration > 100) {  // 只记录超过 100ms 的操作
            console.warn(`[Performance] ${name} 耗时 ${duration.toFixed(2)}ms`);
        }

        return result;
    }

    /**
     * 异步测量函数执行时间
     * @param name 性能指标名称
     * @param fn 要测量的异步函数
     * @returns Promise 函数执行结果
     */
    async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
        if (!this.isEnabled) {
            return fn();
        }

        const start = performance.now();
        try {
            const result = await fn();
            const end = performance.now();
            const duration = end - start;

            this.recordMetric(name, duration);
            
            if (duration > 100) {
                console.warn(`[Performance] ${name} 耗时 ${duration.toFixed(2)}ms`);
            }

            return result;
        } catch (error) {
            const end = performance.now();
            const duration = end - start;
            console.error(`[Performance] ${name} 执行失败，耗时 ${duration.toFixed(2)}ms:`, error);
            throw error;
        }
    }

    /**
     * 记录性能指标
     */
    private recordMetric(name: string, duration: number) {
        this.metrics.push({
            name,
            duration,
            timestamp: Date.now(),
        });

        // 只保留最近 100 条记录
        if (this.metrics.length > 100) {
            this.metrics.shift();
        }
    }

    /**
     * 获取性能指标
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * 获取指定名称的性能指标
     */
    getMetricsByName(name: string): PerformanceMetric[] {
        return this.metrics.filter(m => m.name === name);
    }

    /**
     * 获取平均性能指标
     */
    getAverageMetric(name: string): number | null {
        const metrics = this.getMetricsByName(name);
        if (metrics.length === 0) {
            return null;
        }
        const sum = metrics.reduce((acc, m) => acc + m.duration, 0);
        return sum / metrics.length;
    }

    /**
     * 清空性能指标
     */
    clearMetrics() {
        this.metrics = [];
    }

    /**
     * 启用/禁用性能监控
     */
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
    }
}

// 导出单例
export const performanceMonitor = new PerformanceMonitor();

/**
 * 测量函数执行时间（便捷方法）
 */
export function measurePerformance<T>(name: string, fn: () => T): T {
    return performanceMonitor.measure(name, fn);
}

/**
 * 测量异步函数执行时间（便捷方法）
 */
export function measurePerformanceAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return performanceMonitor.measureAsync(name, fn);
}

