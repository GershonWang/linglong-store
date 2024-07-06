import { AppListParams, CardFace, GetAppListByAppIdParam, Result } from '@/interface';
import request from '@/util/request';

/**
 * 推荐页面-获取轮播图列表
 */
export const getWelcomeCarouselList = (data: any) => {
    return request<Result>({
        method: 'POST',
        url: '/visit/getWelcomeCarouselList',
        data
    })
}

/**
 * 获取最受欢迎的推荐应用列表
 * @param data 入参条件(分页参数)
 * @returns 
 */
export const getWelcomeAppList = (data: AppListParams) => {
    return request<Result>({
        method: 'POST',
        url: '/visit/getWelcomeAppList',
        data
    })
}

/**
 * 获取最新应用列表
 * @param data 入参条件
 * @returns 
 */
export const getNewAppList = (data: AppListParams) => {
    return request<Result>({
        method: 'POST',
        url: '/visit/getNewAppList',
        data
    })
}

/**
 * 获取下载量排行应用列表
 * @param data 入参条件
 * @returns 
 */
export const getInstallAppList = (data: AppListParams) => {
    return request<Result>({
        method: 'POST',
        url: '/visit/getInstallAppList',
        data
    })
}

/**
 * 获取程序的详细信息
 */
export const getAppDetails = (data: CardFace[]) => {
    return request<Result> ({
        method: 'POST',
        url: '/visit/getAppDetails',
        data
    })
}
/**
 * 根据查询条件名称或者分类获取玲珑列表(分页)
 * @param data 查询条件
 * @returns 
 */
export const getSearchAppList = (data: AppListParams) => {
    return request<Result>({
        method: 'POST',
        url: '/visit/getSearchAppList',
        data
    })
}

/**
 * 获取应用分类
 */
export const getDisCategoryList = () => {
    return request<Result>({
        method: 'GET',
        url: '/visit/getDisCategoryList'
    })
}

/**
 * 根据appid获取程序列表
 */
export const getAppListByAppId = (data: GetAppListByAppIdParam) => {
    return request<Result>({
        method: 'POST',
        url: '/visit/getAppListByAppId',
        data
    })
}