<template>
    <div class="serList"></div>
</template>
<script setup lang="ts">
//  https://mirror-repo-linglong.deepin.com/api/v0/web-store/apps?page=2&size=24
import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://mirror-repo-linglong.deepin.com', // 根据您的实际 API 地址进行设置
  timeout: 10000, // 设置请求超时时间
  headers: {
    'Access-Control-Allow-Origin':'http://localhost:5173', // 设置允许的域名
    'Access-Control-Allow-Headers':'Origin, X-Requested-With, Content-Type, Accept'
  }
});

async function fetchData() {
    try {
        const response = await instance.get('/api/v0/web-store/apps?page=1&size=9');
        console.log("返回的结果",response.data);
        const serverList = response.data;
        for (const server of serverList) {
            console.log(server);
            
        } 
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

fetchData();
</script>
<style>
ul {
    list-style: none;
}
</style>