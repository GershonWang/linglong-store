/**
 * 性能监控查看器
 * 提供在浏览器控制台查看性能数据的方法
 */

import { performanceMonitor } from './performance';

/**
 * 在控制台打印性能统计信息
 */
export function printPerformanceStats() {
    const metrics = performanceMonitor.getMetrics();
    
    if (metrics.length === 0) {
        console.log('%c[性能监控] 暂无性能数据', 'color: #999');
        return;
    }

    // 按名称分组统计
    const statsMap = new Map<string, {
        count: number;
        total: number;
        min: number;
        max: number;
        avg: number;
    }>();

    metrics.forEach(metric => {
        if (!statsMap.has(metric.name)) {
            statsMap.set(metric.name, {
                count: 0,
                total: 0,
                min: Infinity,
                max: 0,
                avg: 0,
            });
        }
        const stats = statsMap.get(metric.name)!;
        stats.count++;
        stats.total += metric.duration;
        stats.min = Math.min(stats.min, metric.duration);
        stats.max = Math.max(stats.max, metric.duration);
    });

    // 计算平均值
    statsMap.forEach((stats, name) => {
        stats.avg = stats.total / stats.count;
    });

    // 打印统计信息
    console.group('%c📊 性能监控统计', 'color: #409EFF; font-weight: bold; font-size: 14px');
    
    const sortedStats = Array.from(statsMap.entries()).sort((a, b) => b[1].avg - a[1].avg);
    
    sortedStats.forEach(([name, stats]) => {
        const color = stats.avg > 500 ? 'color: #F56C6C' : stats.avg > 200 ? 'color: #E6A23C' : 'color: #67C23A';
        console.log(
            `%c${name}`,
            `${color}; font-weight: bold`,
            `\n  执行次数: ${stats.count}`,
            `\n  平均耗时: ${stats.avg.toFixed(2)}ms`,
            `\n  最小耗时: ${stats.min.toFixed(2)}ms`,
            `\n  最大耗时: ${stats.max.toFixed(2)}ms`,
            `\n  总耗时: ${stats.total.toFixed(2)}ms`
        );
    });
    
    console.groupEnd();
}

/**
 * 查看指定名称的性能指标详情
 */
export function viewPerformanceDetails(name: string) {
    const metrics = performanceMonitor.getMetricsByName(name);
    
    if (metrics.length === 0) {
        console.log(`%c[性能监控] 未找到 "${name}" 的性能数据`, 'color: #999');
        return;
    }

    const avg = performanceMonitor.getAverageMetric(name);
    const sorted = [...metrics].sort((a, b) => b.duration - a.duration);

    console.group(`%c📈 ${name} 性能详情`, 'color: #409EFF; font-weight: bold');
    console.log(`执行次数: ${metrics.length}`);
    console.log(`平均耗时: ${avg?.toFixed(2)}ms`);
    console.log(`\n详细记录（按耗时降序）:`);
    
    sorted.forEach((metric, index) => {
        const time = new Date(metric.timestamp).toLocaleTimeString();
        const color = metric.duration > 500 ? 'color: #F56C6C' : metric.duration > 200 ? 'color: #E6A23C' : 'color: #67C23A';
        console.log(
            `  ${index + 1}. [${time}] %c${metric.duration.toFixed(2)}ms`,
            color
        );
    });
    
    console.groupEnd();
}

/**
 * 导出性能数据为 JSON
 */
export function exportPerformanceData() {
    const metrics = performanceMonitor.getMetrics();
    const dataStr = JSON.stringify(metrics, null, 2);
    console.log('%c[性能监控] 性能数据 JSON:', 'color: #409EFF; font-weight: bold');
    console.log(dataStr);
    return metrics;
}

/**
 * 将性能监控方法挂载到 window 对象，方便在控制台调用
 */
export function setupPerformanceViewer() {
    if (typeof window !== 'undefined') {
        (window as any).perf = {
            stats: printPerformanceStats,
            view: viewPerformanceDetails,
            export: exportPerformanceData,
            clear: () => {
                performanceMonitor.clearMetrics();
                console.log('%c[性能监控] 已清空所有性能数据', 'color: #67C23A');
            },
            enable: () => {
                performanceMonitor.setEnabled(true);
                console.log('%c[性能监控] 已启用', 'color: #67C23A');
            },
            disable: () => {
                performanceMonitor.setEnabled(false);
                console.log('%c[性能监控] 已禁用', 'color: #E6A23C');
            },
        };
        
        console.log(
            '%c[性能监控] 已启用！在控制台使用以下命令查看性能数据：',
            'color: #409EFF; font-weight: bold; font-size: 12px'
        );
        console.log(
            '%c  perf.stats()     - 查看性能统计',
            'color: #67C23A'
        );
        console.log(
            '%c  perf.view(name)  - 查看指定操作的性能详情',
            'color: #67C23A'
        );
        console.log(
            '%c  perf.export()    - 导出性能数据为 JSON',
            'color: #67C23A'
        );
        console.log(
            '%c  perf.clear()     - 清空性能数据',
            'color: #67C23A'
        );
    }
}

