/**
 * API 请求参数类型定义
 */

import { InstalledEntity } from '@/interface';

/**
 * 搜索应用列表参数
 */
export interface SearchAppListParams {
  name?: string;
  categoryId?: string;
  repoName?: string;
  arch?: string;
  pageNo: number;
  pageSize: number;
}

/**
 * 搜索应用版本列表参数
 */
export interface SearchAppVersionListParams {
  appId: string;
  arch: string;
  repoName: string;
}

/**
 * 获取应用详情参数
 */
export type GetAppDetailsParams = InstalledEntity[];

/**
 * 保存应用评论参数
 */
export interface SaveAppCommentParams {
  appId: string;
  remark: string;
  version: string;
  images?: string[]; // Base64 图片数组
}

/**
 * 获取应用评论列表参数
 */
export interface GetAppCommentListParams {
  appId: string;
}

/**
 * 保存安装记录参数
 */
export interface SaveInstalledRecordParams {
  visitorId: string;
  clientIp: string;
  addedItems: InstalledEntity[];
  removedItems: InstalledEntity[];
}

