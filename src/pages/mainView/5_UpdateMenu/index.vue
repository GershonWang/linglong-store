<template>
  <h1>更新页面</h1>
  <el-divider />
  <div class="app-container">
    <el-dialog :title="title" :visible.sync="visible" width="400px" :close-on-click-modal="false"
      :close-on-press-escape="false" @closed="$emit('dialogClosed')" class="update-dialog" center>
      <span>{{ remark }}</span>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" type="primary" @click="updateApp">立即升级</el-button>
        <el-button size="small" @click="visible = false">取 消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { ipcRenderer } from 'electron'
export default {
  name: 'landing-page',
  mounted: function () {
    // 给主进程发送事件
    ipcRenderer.send('web-created')
    // 检查更新
    ipcRenderer.send('checkForUpdate')
    // 监听自动更新事件
    ipcRenderer.on('message', (event, text) => {
      console.log('text',text);
      if (text === '检测到新版本，正在下载……') {
        this.$nextTick(() => {
          this.visible = true
        })
      }
    })
  },
  data() {
    return {
      title: '软件更新',
      remark: '发现新版本, 确定升级吗?',
      visible: false
    }
  },
  methods: {
    // downloadUpdate() {
    //   this.downloadPercent = 0
    //   ipcRenderer.send('downloadUpdate')
    //   // //注意：“downloadProgress”事件可能存在无法触发的问题，只需要限制一下下载网速就好了
    //   ipcRenderer.on('downloadProgress', (event, progressObj) => {
    //     this.downloadPercent = parseInt(progressObj.percent || 0)
    //   })
    //   ipcRenderer.on('isUpdateNow', () => {
    //     ipcRenderer.send('isUpdateNow')
    //   })
    // },
    updateApp() {
      console.log('updateApp');
    }
  },
}
</script>