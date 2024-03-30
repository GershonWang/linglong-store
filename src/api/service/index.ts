import { Pagination } from '@/interface';
import request from '@/util/webRequest';
import { AxiosPromise } from 'axios';

/**
 * 获取程序列表API
 * @param data {LoginData}用户信息
 * @returns
 */
export function getList(data: Pagination): AxiosPromise<any> {
  return request({
    url: '/api/v0/web-store/apps',
    method: 'get',
    params: data,
  });
}