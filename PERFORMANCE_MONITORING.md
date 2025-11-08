# 性能监控使用指南

## 📊 概述

性能监控工具已集成到项目中，可以帮助您监控和分析应用的性能表现。该工具仅在**开发环境**中启用。

## 🚀 快速开始

### 1. 自动启用

性能监控会在开发环境启动时自动启用。打开浏览器控制台，您会看到以下提示：

```
[性能监控] 已启用！在控制台使用以下命令查看性能数据：
  perf.stats()     - 查看性能统计
  perf.view(name)  - 查看指定操作的性能详情
  perf.export()    - 导出性能数据为 JSON
  perf.clear()     - 清空性能数据
```

### 2. 查看性能统计

在浏览器控制台中输入：

```javascript
perf.stats()
```

这将显示所有已记录操作的性能统计，包括：
- 执行次数
- 平均耗时
- 最小耗时
- 最大耗时
- 总耗时

**示例输出：**
```
📊 性能监控统计
刷新已安装列表
  执行次数: 15
  平均耗时: 234.56ms
  最小耗时: 120.34ms
  最大耗时: 456.78ms
  总耗时: 3518.40ms
```

### 3. 查看指定操作的详情

查看特定操作的详细性能记录：

```javascript
perf.view('刷新已安装列表')
```

这将显示该操作的所有执行记录，按耗时降序排列。

### 4. 导出性能数据

导出所有性能数据为 JSON 格式：

```javascript
perf.export()
```

### 5. 清空性能数据

清空所有已记录的性能数据：

```javascript
perf.clear()
```

### 6. 启用/禁用性能监控

```javascript
// 启用
perf.enable()

// 禁用
perf.disable()
```

## 📝 在代码中使用性能监控

### 同步函数监控

```typescript
import { measurePerformance } from '@/util/performance';

const result = measurePerformance('操作名称', () => {
    // 您的代码
    return someValue;
});
```

### 异步函数监控

```typescript
import { measurePerformanceAsync } from '@/util/performance';

const result = await measurePerformanceAsync('异步操作名称', async () => {
    // 您的异步代码
    return await someAsyncOperation();
});
```

## 🎯 当前已监控的操作

以下操作已自动添加性能监控：

1. **刷新已安装列表** - 监控刷新已安装应用列表的性能
2. **立即刷新已安装列表** - 监控立即刷新操作的性能

## ⚙️ 配置说明

### 性能阈值

- 超过 **100ms** 的操作会在控制台显示警告
- 超过 **500ms** 的操作标记为红色（严重）
- 超过 **200ms** 的操作标记为黄色（警告）
- 低于 **200ms** 的操作标记为绿色（正常）

### 数据保留

- 性能监控最多保留最近 **100 条**记录
- 超出限制时，会自动删除最旧的记录

## 🔍 性能分析建议

1. **定期查看统计**：使用 `perf.stats()` 查看整体性能趋势
2. **关注慢操作**：重点关注耗时超过 200ms 的操作
3. **对比优化前后**：在优化前后分别记录性能数据，对比效果
4. **导出数据分析**：使用 `perf.export()` 导出数据，进行更深入的分析

## 📌 注意事项

- 性能监控仅在**开发环境**中启用，生产环境会自动禁用
- 性能监控会轻微影响性能（通常 < 1ms），但有助于发现性能瓶颈
- 建议在性能测试时启用，日常开发可以禁用以减少日志噪音

## 🛠️ 扩展使用

您可以在任何需要监控性能的地方添加性能监控：

```typescript
// 示例：监控 API 请求
const data = await measurePerformanceAsync('获取应用列表', async () => {
    return await getSearchAppList(params);
});

// 示例：监控数据处理
const processed = measurePerformance('处理数据', () => {
    return data.map(item => transformItem(item));
});
```

---

**提示**：性能监控是优化应用性能的重要工具，建议定期查看和分析性能数据，及时发现和解决性能问题。

