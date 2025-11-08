/**
 * 常量定义
 */

/**
 * 定时器间隔配置
 */
export const TIMER_INTERVALS = {
  INSTALLED_ITEMS: 3000,      // 已安装应用查询间隔（毫秒）
  UPDATE_ITEMS: 3000,          // 可更新应用查询间隔（毫秒）
  RUNTIME_PROCESS: 1000,       // 进程列表刷新间隔（毫秒）
} as const;

/**
 * 重试配置
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,              // 最大重试次数
  RETRY_DELAY: 1000,           // 重试延迟（毫秒）
} as const;

/**
 * Sudo 配置
 */
export const SUDO_CONFIG = {
  TIMEOUT: 5 * 60 * 1000,      // sudo 验证超时时间（5分钟）
} as const;

/**
 * 版本阈值配置
 */
export const VERSION_THRESHOLDS = {
  MIN_SUPPORTED: '1.5.0',      // 最小支持版本
  UPDATE_LIST_SUPPORT: '1.7.0', // 支持更新列表的版本
  SEARCH_ALL_SUPPORT: '1.7.7',  // 支持搜索所有版本的版本
  SHOW_ALL_VERSION: '1.8.3',    // 支持显示所有版本的版本
  STABLE_VERSION: '1.9.0',       // 稳定版本
} as const;

/**
 * 图片上传配置
 */
export const IMAGE_UPLOAD_CONFIG = {
  MAX_COUNT: 3,                // 最大上传数量
  MAX_SIZE: 2 * 1024 * 1024,    // 最大文件大小（2MB）
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], // 允许的文件类型
} as const;

/**
 * 分页配置
 */
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,        // 默认每页数量
  DEFAULT_PAGE_NO: 1,           // 默认页码
} as const;

