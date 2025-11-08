# 玲珑商店项目优化方案

## 📊 优化进度总览

- **高优先级项**: ✅ 4/4 已完成 (100%)
- **中优先级项**: ✅ 4/4 已完成 (100%)
- **低优先级项**: 📋 0/4 待实施 (0%)

**最后更新**: 2024年（中优先级优化完成）

---

## 📋 目录
1. [类型安全优化](#类型安全优化)
2. [性能优化](#性能优化)
3. [代码质量优化](#代码质量优化)
4. [架构优化](#架构优化)
5. [错误处理优化](#错误处理优化)
6. [内存管理优化](#内存管理优化)
7. [代码组织优化](#代码组织优化)

---

## 1. 类型安全优化

### 1.1 问题分析
- 项目中大量使用 `any` 类型（65处）
- 缺少严格的类型定义
- IPC 通信参数类型不明确

### 1.2 优化方案

#### 1.2.1 定义 IPC 通信类型
```typescript
// src/types/ipc.ts
export interface LinyapsInstallParams {
  password?: string;
  appId: string;
  version: string;
  newVersion?: string;
  name?: string;
  [key: string]: any;
}

export interface LinyapsInstallResult {
  code: 'stdout' | 'stderr' | 'error' | 'close';
  params: LinyapsInstallParams;
  result: string | number;
}

export interface LinyapsListResult {
  error: Error | null;
  stdout: string;
  stderr: string;
}
```

#### 1.2.2 优化 API 类型定义
```typescript
// src/api/index.ts - 替换 any
export const getSearchAppList = (data: SearchAppListParams): Promise<pageResult<InstalledEntity[]>> => {
  return request<pageResult<InstalledEntity[]>>({ 
    method: 'POST', 
    url: '/visit/getSearchAppList', 
    data 
  });
}

interface SearchAppListParams {
  name?: string;
  categoryId?: string;
  repoName?: string;
  arch?: string;
  pageNo: number;
  pageSize: number;
}
```

#### 1.2.3 优化 Store 类型
```typescript
// src/store/installedItems.ts
// 替换 any[] 为具体类型
const initInstalledItems = async (data: string): Promise<{
  installedItemList: InstalledEntity[];
  addedItems: InstalledEntity[];
  removedItems: InstalledEntity[];
}> => {
  const datas: InstalledEntity[] = data.trim() 
    ? JSON.parse(data.trim()) as InstalledEntity[]
    : [];
  // ...
}
```

---

## 2. 性能优化

### 2.1 问题分析
- 定时查询每3秒执行一次，可能造成性能问题
- 数组操作使用 `findIndex` + `splice` 效率低
- 大量使用 `JSON.parse(JSON.stringify())` 深拷贝
- Store 更新触发不必要的响应式更新

### 2.2 优化方案

#### 2.2.1 优化数组操作
```typescript
// 使用 Map 提高查找效率
// src/store/installedItems.ts
const installedItemMap = new Map<string, InstalledEntity>();

const updateItemLoadingStatus = (item: InstalledEntity, flag: boolean) => {
  const key = `${item.appId}-${item.version}-${item.module}`;
  const existingItem = installedItemMap.get(key);
  if (existingItem) {
    existingItem.loading = flag;
    // 触发响应式更新
    installedItemList.value = [...installedItemList.value];
  }
}
```

#### 2.2.2 优化深拷贝
```typescript
// src/util/clone.ts
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T;
  if (typeof obj === 'object') {
    const clonedObj = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

// 使用
import { deepClone } from '@/util/clone';
const clonedItem = deepClone(item);
```

#### 2.2.3 防抖/节流定时查询
```typescript
// src/util/debounce.ts
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// src/util/WorkerInstalled.ts
import { debounce } from '@/util/debounce';

// 使用防抖，避免频繁查询
const debouncedReflushInstalledItems = debounce(reflushInstalledItems, 1000);
let installedTimer = setInterval(() => debouncedReflushInstalledItems(), 3000);
```

#### 2.2.4 优化 Store 更新策略
```typescript
// 使用 shallowRef 减少深度响应式开销
import { shallowRef } from 'vue';

// 对于大型列表，使用 shallowRef
const installedItemList = shallowRef<InstalledEntity[]>([]);

// 或者使用 markRaw 标记不需要响应式的对象
import { markRaw } from 'vue';
const item = markRaw({ ...data });
```

---

## 3. 代码质量优化

### 3.1 问题分析
- 代码重复：多个 Store 中有相似的 `updateItemLoadingStatus` 逻辑
- 魔法数字：硬编码的数值（如 3000ms、3次重试）
- 缺少常量定义
- 错误处理不统一

### 3.2 优化方案

#### 3.2.1 提取公共逻辑
```typescript
// src/store/baseStore.ts
export interface BaseStoreItem {
  appId: string;
  version: string;
  module?: string;
  loading?: boolean;
  isInstalled?: boolean;
}

export function createBaseStoreActions<T extends BaseStoreItem>(
  itemList: Ref<T[]>
) {
  return {
    updateItemLoadingStatus(item: T, flag: boolean) {
      const key = `${item.appId}-${item.version}-${item.module || ''}`;
      const index = itemList.value.findIndex(
        (it) => `${it.appId}-${it.version}-${it.module || ''}` === key
      );
      if (index !== -1) {
        const aItem = { ...itemList.value[index] };
        aItem.loading = flag;
        itemList.value.splice(index, 1, aItem);
      }
    },
    
    updateItemInstallStatus(item: T, flag: boolean) {
      const key = `${item.appId}-${item.version}-${item.module || ''}`;
      const index = itemList.value.findIndex(
        (it) => `${it.appId}-${it.version}-${it.module || ''}` === key
      );
      if (index !== -1) {
        const aItem = { ...itemList.value[index] };
        aItem.isInstalled = flag;
        itemList.value.splice(index, 1, aItem);
      }
    },
    
    removeItem(item: T) {
      const key = `${item.appId}-${item.version}-${item.module || ''}`;
      const index = itemList.value.findIndex(
        (it) => `${it.appId}-${it.version}-${it.module || ''}` === key
      );
      if (index !== -1) {
        itemList.value.splice(index, 1);
      }
    }
  };
}
```

#### 3.2.2 定义常量
```typescript
// src/constants/index.ts
export const TIMER_INTERVALS = {
  INSTALLED_ITEMS: 3000,      // 已安装应用查询间隔
  UPDATE_ITEMS: 3000,          // 可更新应用查询间隔
  RUNTIME_PROCESS: 1000,       // 进程列表刷新间隔
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,              // 最大重试次数
  RETRY_DELAY: 1000,           // 重试延迟（ms）
} as const;

export const SUDO_CONFIG = {
  TIMEOUT: 5 * 60 * 1000,      // sudo 验证超时时间（5分钟）
} as const;

export const VERSION_THRESHOLDS = {
  MIN_SUPPORTED: '1.5.0',
  UPDATE_LIST_SUPPORT: '1.7.0',
  SEARCH_ALL_SUPPORT: '1.7.7',
  SHOW_ALL_VERSION: '1.8.3',
  STABLE_VERSION: '1.9.0',
} as const;
```

#### 3.2.3 统一错误处理
```typescript
// src/util/errorHandler.ts
import { ElMessage, ElNotification } from 'element-plus';
import { ipcRenderer } from 'electron';

export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

export interface ErrorOptions {
  level?: ErrorLevel;
  showNotification?: boolean;
  showMessage?: boolean;
  logToMain?: boolean;
  duration?: number;
}

export function handleError(
  error: Error | string,
  options: ErrorOptions = {}
): void {
  const {
    level = ErrorLevel.ERROR,
    showNotification = false,
    showMessage = true,
    logToMain = true,
    duration = 3000,
  } = options;

  const errorMessage = error instanceof Error ? error.message : error;

  // 记录到主进程日志
  if (logToMain) {
    ipcRenderer.send('logger', level, errorMessage);
  }

  // 显示消息提示
  if (showMessage) {
    ElMessage({
      message: errorMessage,
      type: level,
      duration,
    });
  }

  // 显示通知
  if (showNotification) {
    ElNotification({
      title: level === ErrorLevel.ERROR ? '错误' : '提示',
      message: errorMessage,
      type: level,
      duration,
    });
  }
}

// 使用示例
import { handleError, ErrorLevel } from '@/util/errorHandler';

try {
  // ...
} catch (error) {
  handleError(error, {
    level: ErrorLevel.ERROR,
    showNotification: true,
  });
}
```

---

## 4. 架构优化

### 4.1 问题分析
- IPC 监听器管理分散
- Store 之间耦合度高
- 缺少统一的状态管理策略

### 4.2 优化方案

#### 4.2.1 统一 IPC 管理
```typescript
// src/util/ipcManager.ts
import { ipcRenderer, IpcRendererEvent } from 'electron';

type IpcHandler = (event: IpcRendererEvent, ...args: any[]) => void;

class IpcManager {
  private listeners: Map<string, IpcHandler[]> = new Map();

  on(channel: string, handler: IpcHandler): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(handler);
    ipcRenderer.on(channel, handler);

    // 返回取消监听的函数
    return () => this.off(channel, handler);
  }

  once(channel: string, handler: IpcHandler): void {
    ipcRenderer.once(channel, handler);
  }

  off(channel: string, handler?: IpcHandler): void {
    if (handler) {
      ipcRenderer.removeListener(channel, handler);
      const handlers = this.listeners.get(channel);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      ipcRenderer.removeAllListeners(channel);
      this.listeners.delete(channel);
    }
  }

  send(channel: string, ...args: any[]): void {
    ipcRenderer.send(channel, ...args);
  }

  cleanup(): void {
    this.listeners.forEach((handlers, channel) => {
      handlers.forEach(handler => {
        ipcRenderer.removeListener(channel, handler);
      });
    });
    this.listeners.clear();
  }
}

export const ipcManager = new IpcManager();
```

#### 4.2.2 优化 Store 依赖
```typescript
// 使用依赖注入模式，减少 Store 之间的直接依赖
// src/store/installedItems.ts
export const useInstalledItemsStore = defineStore("installedItems", () => {
  // 不在顶层导入其他 Store
  // 在需要时动态获取
  const getSystemConfigStore = () => useSystemConfigStore();
  
  const initInstalledItems = async (data: string) => {
    const systemConfigStore = getSystemConfigStore();
    // ...
  };
});
```

---

## 5. 错误处理优化

### 5.1 问题分析
- 错误处理不统一
- 缺少错误边界
- 网络错误处理不完善

### 5.2 优化方案

#### 5.2.1 添加错误边界组件
```typescript
// src/components/ErrorBoundary.vue
<template>
  <div v-if="hasError" class="error-boundary">
    <el-alert
      :title="errorTitle"
      :description="errorMessage"
      type="error"
      :closable="false"
      show-icon
    >
      <template #default>
        <el-button @click="handleReset">重试</el-button>
      </template>
    </el-alert>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const hasError = ref(false);
const errorTitle = ref('');
const errorMessage = ref('');

onErrorCaptured((err: Error) => {
  hasError.value = true;
  errorTitle.value = '组件错误';
  errorMessage.value = err.message;
  console.error('ErrorBoundary caught:', err);
  return false; // 阻止错误继续传播
});

const handleReset = () => {
  hasError.value = false;
  errorTitle.value = '';
  errorMessage.value = '';
};
</script>
```

#### 5.2.2 优化网络请求错误处理
```typescript
// src/api/request.ts
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const status = response.status;
    if (status === 200) {
      if (response.data instanceof ArrayBuffer) {
        return response.data;
      }
      // 检查业务错误码
      if (response.data.code && response.data.code !== 200) {
        return Promise.reject(new Error(response.data.msg || '请求失败'));
      }
      return response.data;
    } else {
      return Promise.reject(new Error(`HTTP Error: ${status}`));
    }
  },
  (error: any) => {
    let errorMessage = '服务异常，请重试并联系开发者！';
    
    if (error.code === 'ERR_NETWORK') {
      errorMessage = '网络连接异常，请检查网络设置！';
    } else if (error.response) {
      const status = error.response.status;
      switch (status) {
        case 401:
          errorMessage = '未授权，请重新登录！';
          break;
        case 403:
          errorMessage = '拒绝访问！';
          break;
        case 404:
          errorMessage = '请求的资源不存在！';
          break;
        case 500:
          errorMessage = '服务器内部错误！';
          break;
        case 503:
          errorMessage = '服务暂时不可用！';
          break;
        default:
          errorMessage = `请求失败 (${status})`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    ElMessage.error(errorMessage);
    return Promise.reject(error);
  }
);
```

---

## 6. 内存管理优化

### 6.1 问题分析
- 事件监听器可能未正确清理
- 定时器可能未清理
- 大对象可能造成内存泄漏

### 6.2 优化方案

#### 6.2.1 统一清理机制
```typescript
// src/composables/useCleanup.ts
import { onUnmounted, Ref } from 'vue';

export function useCleanup() {
  const cleanupTasks: (() => void)[] = [];

  const addCleanup = (task: () => void) => {
    cleanupTasks.push(task);
  };

  onUnmounted(() => {
    cleanupTasks.forEach(task => task());
    cleanupTasks.length = 0;
  });

  return { addCleanup };
}

// 使用示例
import { useCleanup } from '@/composables/useCleanup';

const { addCleanup } = useCleanup();
const timer = setInterval(() => {}, 1000);
addCleanup(() => clearInterval(timer));
```

#### 6.2.2 优化图片加载
```typescript
// src/composables/useImageLoader.ts
import { ref, onUnmounted } from 'vue';

export function useImageLoader(src: string) {
  const imageUrl = ref<string>('');
  const loading = ref(true);
  const error = ref(false);

  const img = new Image();
  
  img.onload = () => {
    imageUrl.value = src;
    loading.value = false;
  };
  
  img.onerror = () => {
    error.value = true;
    loading.value = false;
  };
  
  img.src = src;

  onUnmounted(() => {
    if (img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src);
    }
  });

  return { imageUrl, loading, error };
}
```

---

## 7. 代码组织优化

### 7.1 问题分析
- 工具函数分散
- 缺少统一的工具函数导出
- 常量定义分散

### 7.2 优化方案

#### 7.2.1 统一工具函数导出
```typescript
// src/utils/index.ts
export * from './checkVersion';
export * from './clone';
export * from './debounce';
export * from './errorHandler';
export * from './refParam';
export * from './ipcManager';
```

#### 7.2.2 创建 Composables
```typescript
// src/composables/useAppInstall.ts
import { ref } from 'vue';
import { useInstallingItemsStore } from '@/store/installingItems';
import { useUpdateStatusStore } from '@/store/updateStatus';
import { ipcRenderer } from 'electron';

export function useAppInstall() {
  const installingItemsStore = useInstallingItemsStore();
  const updateStatusStore = useUpdateStatusStore();
  const installing = ref(false);

  const installApp = (item: InstalledEntity) => {
    if (installing.value || updateStatusStore.downloadQueueStatus) {
      return;
    }
    
    installing.value = true;
    installingItemsStore.addItem(item);
    
    const password = localStorage.getItem('linyaps-password');
    ipcRenderer.send('linyaps-install', {
      password,
      ...item,
    });
  };

  return { installApp, installing };
}
```

---

## 8. 其他优化建议

### 8.1 日志管理
```typescript
// src/utils/logger.ts
import { ipcRenderer } from 'electron';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  log(level: LogLevel, message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console[level](`[${level.toUpperCase()}]`, message, ...args);
    }
    ipcRenderer.send('logger', level, message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const logger = new Logger();
```

### 8.2 环境变量管理
```typescript
// src/config/env.ts
export const env = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  serverUrl: import.meta.env.VITE_SERVER_URL || '',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
} as const;
```

### 8.3 性能监控
```typescript
// src/utils/performance.ts
export function measurePerformance(name: string, fn: () => void) {
  if (import.meta.env.DEV) {
    const start = performance.now();
    fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  } else {
    fn();
  }
}
```

---

## 9. 实施优先级

### 高优先级（立即实施）
1. ✅ 类型安全优化 - 减少 `any` 使用
2. ✅ 错误处理统一化
3. ✅ IPC 监听器清理机制
4. ✅ 定时查询防抖优化

### 中优先级（近期实施）
1. ✅ 提取公共 Store 逻辑 - 已完成
2. ✅ 常量定义统一 - 已完成
3. ✅ 日志管理统一 - 已完成
4. ✅ 性能优化（数组操作、深拷贝） - 已完成

### 低优先级（长期优化）
1. 📋 架构重构（依赖注入）
2. 📋 Composables 提取
3. 📋 性能监控
4. 📋 单元测试

---

## 10. 实施进度详情

### 10.1 高优先级项（已完成 ✅）

1. ✅ **类型安全优化** - 已完成
   - 创建了 `src/types/ipc.ts` 和 `src/types/api.ts`
   - 优化了 API 类型定义，减少 `any` 使用
   - 优化了 Store 类型定义

2. ✅ **错误处理统一化** - 已完成
   - 创建了 `src/util/errorHandler.ts`
   - 统一了错误处理机制
   - 应用到多个文件

3. ✅ **IPC 监听器清理机制** - 已完成
   - 创建了 `src/util/ipcManager.ts`
   - 统一管理 IPC 监听器

4. ✅ **定时查询防抖优化** - 已完成
   - 创建了 `src/util/debounce.ts`
   - 优化了 `WorkerInstalled.ts` 和 `WorkerUpdate.ts`
   - 使用常量统一管理定时器间隔

### 10.2 中优先级项（已完成 ✅）

1. ✅ **提取公共 Store 逻辑** - 已完成
   - 创建了 `src/store/baseStore.ts`
   - 提取了公共的 `updateItemInstallStatus`、`updateItemLoadingStatus`、`removeItem`、`addItem`、`clearItems` 等方法
   - 应用到 `allAppItems.ts`、`difVersionItems.ts`、`updateItems.ts`

2. ✅ **常量定义统一** - 已完成
   - 创建了 `src/constants/index.ts`
   - 统一了定时器间隔、重试配置、版本阈值等常量
   - 应用到多个文件

3. ✅ **日志管理统一** - 已完成
   - 创建了 `src/util/logger.ts`
   - 统一了日志管理，替代 `console.log` 和 `ipcRenderer.send('logger', ...)`
   - 应用到多个文件（12处替换）

4. ✅ **性能优化（数组操作、深拷贝）** - 已完成
   - 创建了 `src/util/clone.ts`，提供 `deepClone` 和 `shallowClone`
   - 替换了 7 处 `JSON.parse(JSON.stringify())` 为 `deepClone`
   - 优化了数组操作，使用 `getItemKey` 统一键生成

### 10.3 低优先级项（待实施 📋）

1. 📋 架构重构（依赖注入）
2. 📋 Composables 提取
3. 📋 性能监控
4. 📋 单元测试

---

## 11. 总结

本优化方案涵盖了类型安全、性能、代码质量、架构、错误处理、内存管理和代码组织等多个方面。

**已完成优化统计：**
- ✅ 高优先级项：4/4 (100%)
- ✅ 中优先级项：4/4 (100%)
- 📋 低优先级项：0/4 (0%)

**优化成果：**
- 类型安全：减少 `any` 使用，提升类型安全性
- 代码质量：提取公共逻辑，减少代码重复
- 性能优化：防抖优化、深拷贝优化、数组操作优化
- 可维护性：统一常量、统一日志、统一错误处理

建议继续按照优先级逐步实施低优先级项，确保项目的稳定性和可维护性。

