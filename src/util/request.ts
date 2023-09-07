import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

// 处理 类型“AxiosResponse<LoginResult, any>”上不存在属性“code”。
declare module 'axios' {
  interface AxiosResponse<T = any> {
    // 这里追加你的参数
    code: null;
    msg: '';
  }
  export function create(config?: AxiosRequestConfig): AxiosInstance;
}

// 创建 axios 实例
const service = axios.create({
  baseURL: "https://mirror-repo-linglong.deepin.com",
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
    'Access-Control-Allow-Origin': '*', // 设置允许的域名
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
  }
});

// 请求拦截器
service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 将token放入请求头
  if (localStorage.getItem('token')) {
    const token = localStorage.getItem('token')
    config.headers.set('token', token);
  }
  return config;
}, (error: any) => {
  return Promise.reject(error);
});

// 响应拦截器
service.interceptors.response.use((response: AxiosResponse) => {
  const status = response.status;
  if (status == 200) {
    // 响应数据为二进制流处理(Excel导出)
    if (response.data instanceof ArrayBuffer) {
      return response.data;
    }
    return response.data;
  } else {
    ElMessage.error('系统出错');
    return Promise.reject(new Error('Error'));
  }
}, (error: any) => {
  if (error.code == 'ERR_NETWORK') {
    ElMessage.error('网络异常！');
  } else {
    ElMessage.error('服务异常请重试并联系开发者！！');
  }
  return Promise.reject(error.message);
});

// 导出 axios 实例
export default service;
