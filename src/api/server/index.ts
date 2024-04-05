import { AppListParams, Result } from '@/interface';
import request from '@/util/request';

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