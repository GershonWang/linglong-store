/**
 * IPC 通信管理器
 * 统一管理 IPC 监听器的注册和清理
 */

import { ipcRenderer, IpcRendererEvent } from 'electron';

type IpcHandler = (event: IpcRendererEvent, ...args: any[]) => void;

class IpcManager {
  private listeners: Map<string, IpcHandler[]> = new Map();

  /**
   * 注册 IPC 监听器
   * @param channel 通道名称
   * @param handler 处理函数
   * @returns 取消监听的函数
   */
  on(channel: string, handler: IpcHandler): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel)!.push(handler);
    ipcRenderer.on(channel, handler);

    // 返回取消监听的函数
    return () => this.off(channel, handler);
  }

  /**
   * 注册一次性 IPC 监听器
   * @param channel 通道名称
   * @param handler 处理函数
   */
  once(channel: string, handler: IpcHandler): void {
    ipcRenderer.once(channel, handler);
  }

  /**
   * 移除 IPC 监听器
   * @param channel 通道名称
   * @param handler 处理函数（可选，不提供则移除该通道的所有监听器）
   */
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

  /**
   * 发送 IPC 消息
   * @param channel 通道名称
   * @param args 参数
   */
  send(channel: string, ...args: any[]): void {
    ipcRenderer.send(channel, ...args);
  }

  /**
   * 清理所有监听器
   */
  cleanup(): void {
    this.listeners.forEach((handlers, channel) => {
      handlers.forEach(handler => {
        ipcRenderer.removeListener(channel, handler);
      });
    });
    this.listeners.clear();
  }

  /**
   * 获取监听器数量（用于调试）
   */
  getListenerCount(channel?: string): number {
    if (channel) {
      return this.listeners.get(channel)?.length || 0;
    }
    let count = 0;
    this.listeners.forEach(handlers => {
      count += handlers.length;
    });
    return count;
  }
}

// 导出单例
export const ipcManager = new IpcManager();

