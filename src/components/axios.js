import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://mirror-repo-linglong.deepin.com', // 根据您的实际 API 地址进行设置
  timeout: 10000, // 设置请求超时时间
});

export default instance;