import request from '../../util/request';
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

/**
 * 注册用户API
 * @param data {LoginData}用户信息
 * @returns 
 */
export function registApi(data: Pagination): AxiosPromise<any> {
  return request({
    url: '/user/addUser',
    method: 'post',
    params: data,
  });
}

/**
 * 请求参数
 */
export interface Pagination {
  /**
   * 页码
   */
  page?: number;
  /**
   * 每页条数
   */
  size?: number;

}