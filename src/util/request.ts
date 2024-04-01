import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

const baseURL = import.meta.env.SERVER_URL;
console.log(import.meta.env);
console.log('baseURL :>>',baseURL);

// 创建 axios 实例
const service = axios.create({
  baseURL: baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器
service.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // 将token放入请求头
  if (localStorage.getItem('token')) {
    const token = localStorage.getItem('token')
    config.headers.set('token', token);
  }
  console.log('config :>>',config);
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
