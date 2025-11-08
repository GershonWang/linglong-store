import { commentItem, InstalledEntity, pageResult, Result } from '@/interface';
import request from '@/api/request';
import type { 
  SearchAppListParams, 
  SearchAppVersionListParams, 
  GetAppDetailsParams,
  SaveAppCommentParams,
  GetAppCommentListParams
} from '@/types/api';

/**
 * 推荐页面-获取轮播图列表
 */
export const getWelcomeCarouselList = (data: Record<string, any>) => {
    return request<Result>({ method: 'POST', url: '/visit/getWelcomeCarouselList', data })
}

/**
 * 获取最受欢迎的推荐应用列表
 * @param data 入参条件(分页参数)
 * @returns 
 */
export const getWelcomeAppList = (data: Record<string, any>) => {
    return request<Result<InstalledEntity[]>>({ method: 'POST', url: '/visit/getWelcomeAppList', data })
}

/**
 * 获取最新应用列表
 * @param data 入参条件
 * @returns 
 */
export const getNewAppList = (data: Record<string, any>) => {
    return request<Result<InstalledEntity[]>>({ method: 'POST', url: '/visit/getNewAppList', data })
}

/**
 * 获取下载量排行应用列表
 * @param data 入参条件
 * @returns 
 */
export const getInstallAppList = (data: Record<string, any>) => {
    return request<Result<InstalledEntity[]>>({ method: 'POST', url: '/visit/getInstallAppList', data })
}

/**
 * 获取程序的详细信息
 */
export const getAppDetails = (data: GetAppDetailsParams) => {
    return request<Result<InstalledEntity[]>>({ method: 'POST', url: '/visit/getAppDetails', data })
}

/**
 * 根据查询条件名称或者分类获取玲珑列表(分页)
 * @param data 查询条件
 * @returns 
 */
export const getSearchAppList = (data: SearchAppListParams) => {
    return request<pageResult<InstalledEntity[]>>({ method: 'POST', url: '/visit/getSearchAppList', data })
}

/**
 * 获取应用分类
 */
export const getDisCategoryList = () => {
    return request<Result<Array<{ categoryId: string; categoryName: string }>>>({ method: 'GET', url: '/visit/getDisCategoryList' })
}

/**
 * 根据appid获取程序列表
 */
export const getSearchAppVersionList = (data: SearchAppVersionListParams) => {
    return request<Result<InstalledEntity[]>>({ method: 'POST', url: '/visit/getSearchAppVersionList', data })
}

/**
 * 获取应用评论列表
 * @param params 入参条件
 * @returns 应用评论列表
 */
export const getAppCommentList = (params: GetAppCommentListParams): Promise<Result<commentItem[]>> => {
  return request({ url: '/app/getAppCommentList', method: 'POST', data: params });
};

/**
 * 提交应用评论
 * @param data 入参条件
 * @returns 
 */
export const saveAppComment = (data: SaveAppCommentParams) => {
    return request<Result>({ method: 'POST', url: '/app/saveAppComment', data })
}