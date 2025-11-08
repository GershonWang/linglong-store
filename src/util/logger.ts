/**
 * 统一日志管理工具
 * 替代 console.log 和 ipcRenderer.send('logger', ...)
 */

import { ipcRenderer } from 'electron';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * 日志配置
 */
interface LoggerConfig {
  enableConsole?: boolean;  // 是否在控制台输出
  enableIpc?: boolean;      // 是否发送到主进程
  minLevel?: LogLevel;      // 最小日志级别
}

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor(config: LoggerConfig = {}) {
    this.isDevelopment = import.meta.env.DEV;
    this.config = {
      enableConsole: this.isDevelopment,
      enableIpc: true,
      minLevel: this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
      ...config,
    };
  }

  /**
   * 检查是否应该记录日志
   */
  private shouldLog(level: LogLevel): boolean {
    const levelOrder = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levelOrder.indexOf(this.config.minLevel || LogLevel.INFO);
    const currentLevelIndex = levelOrder.indexOf(level);
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * 记录日志
   */
  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logMessage = args.length > 0 
      ? `${message} ${args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ')}`
      : message;

    // 控制台输出
    if (this.config.enableConsole) {
      const consoleMethod = level === LogLevel.ERROR ? 'error' : 
                           level === LogLevel.WARN ? 'warn' : 
                           level === LogLevel.DEBUG ? 'debug' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}]`, message, ...args);
    }

    // 发送到主进程
    if (this.config.enableIpc && ipcRenderer) {
      ipcRenderer.send('logger', level, logMessage);
    }
  }

  /**
   * 调试日志
   */
  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * 信息日志
   */
  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * 警告日志
   */
  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * 错误日志
   */
  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

// 导出单例
export const logger = new Logger();

