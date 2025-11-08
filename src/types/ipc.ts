/**
 * IPC 通信类型定义
 */

import { InstalledEntity } from '@/interface';

/**
 * 安装参数
 */
export interface LinyapsInstallParams {
  password?: string;
  appId: string;
  version: string;
  newVersion?: string;
  name?: string;
  [key: string]: any;
}

/**
 * 安装结果
 */
export interface LinyapsInstallResult {
  code: 'stdout' | 'stderr' | 'error' | 'close';
  params: LinyapsInstallParams;
  result: string | number;
}

/**
 * 列表查询结果
 */
export interface LinyapsListResult {
  error: Error | null;
  stdout: string;
  stderr: string;
}

/**
 * 搜索结果
 */
export interface LinyapsSearchResult {
  error: Error | null;
  stdout: string;
  stderr: string;
}

/**
 * 更新查询结果
 */
export interface LinyapsUpdateResult {
  error: Error | null;
  stdout: string;
  stderr: string;
}

/**
 * 卸载参数
 */
export interface LinyapsUninstallParams {
  command: string;
  appId: string;
  version: string;
  name?: string;
  [key: string]: any;
}

/**
 * 卸载结果
 */
export interface LinyapsUninstallResult {
  code: 'stdout' | 'stderr' | 'error';
  params: LinyapsUninstallParams;
  result: string;
}

