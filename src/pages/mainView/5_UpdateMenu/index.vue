<template>
  <h1>更新页面</h1>
  <el-divider />
  <div class="app-container">
    <el-progress :percentage="downloadPercent" />
    <el-button type="primary" @click="downloadUpdate">下载更新</el-button>
  </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import log from "electron-log";
import { onMounted, ref } from 'vue';

const downloadPercent = ref(0);

// 下载更新
const downloadUpdate = () => {
  downloadPercent.value = 0
  ipcRenderer.send('downloadUpdate')
  // //注意：“downloadProgress”事件可能存在无法触发的问题，只需要限制一下下载网速就好了
  ipcRenderer.on('downloadProgress', (_event, progressObj) => {
    downloadPercent.value = parseInt(progressObj.percent || 0)
  })
  ipcRenderer.on('isUpdateNow', () => {
    ipcRenderer.send('isUpdateNow')
  })
}
// 监听主进程发送的更新消息
const updateMessage = (_event: any, text: string) => {
  log.info('updateMessage', text);
}
// 页面加载时
onMounted(() => {
  ipcRenderer.send('checkForUpdate') // 检查更新
  // 监听自动更新事件
  ipcRenderer.on('update-message', updateMessage)
})
</script>