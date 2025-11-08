/**
 * 统一错误处理工具
 */

import { ElMessage, ElNotification } from 'element-plus';
import { ipcRenderer } from 'electron';

/**
 * 错误级别枚举
 */
export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}

/**
 * 错误处理选项
 */
export interface ErrorOptions {
  level?: ErrorLevel;
  showNotification?: boolean;
  showMessage?: boolean;
  logToMain?: boolean;
  duration?: number;
  title?: string;
}

/**
 * 统一错误处理函数
 * @param error 错误对象或错误消息
 * @param options 错误处理选项
 */
export function handleError(
  error: Error | string | unknown,
  options: ErrorOptions = {}
): void {
  const {
    level = ErrorLevel.ERROR,
    showNotification = false,
    showMessage = true,
    logToMain = true,
    duration = 3000,
    title,
  } = options;

  // 提取错误消息
  let errorMessage = '';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = String(error);
  }

  // 记录到主进程日志
  if (logToMain && ipcRenderer) {
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
    const notificationTitle = title || (level === ErrorLevel.ERROR ? '错误' : '提示');
    ElNotification({
      title: notificationTitle,
      message: errorMessage,
      type: level,
      duration,
    });
  }
}

/**
 * 处理网络错误
 * @param error 错误对象
 */
export function handleNetworkError(error: unknown): void {
  let errorMessage = '网络连接异常，请检查网络设置！';
  
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: string }).code;
    if (code === 'ERR_NETWORK') {
      errorMessage = '网络连接异常，请检查网络设置！';
    } else if (code === 'ECONNABORTED') {
      errorMessage = '请求超时，请稍后重试！';
    }
  }
  
  handleError(errorMessage, {
    level: ErrorLevel.ERROR,
    showNotification: true,
    showMessage: true,
  });
}

/**
 * 处理业务错误
 * @param code 错误码
 * @param message 错误消息
 */
export function handleBusinessError(code: number, message: string): void {
  let errorMessage = message || '操作失败，请稍后重试！';
  
  switch (code) {
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
      errorMessage = message || `请求失败 (${code})`;
  }
  
  handleError(errorMessage, {
    level: ErrorLevel.ERROR,
    showNotification: true,
    showMessage: true,
  });
}

