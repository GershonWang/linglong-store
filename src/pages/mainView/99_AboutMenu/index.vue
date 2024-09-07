<template>
  <div>
    <h1>关于程序</h1>
    <li>
      <a class="title" :title="`Node版本：${versions.node}&#10;Electron版本：${versions.electron}&#10;Chrome版本：${versions.chrome}`">玲珑信息</a>
    </li>
    <div class="item">玲珑官网：<a class="link" href="https://linglong.space/" target="_blank">https://linglong.space/</a></div>
    <div class="item">玲珑网页版商店：<a class="link" href="https://store.linglong.space/"
        target="_blank">https://store.linglong.space/</a></div>
    <div class="item">当前共收录玲珑程序数: {{ systemConfigStore.linglongCount }} 个</div>
    <br>
    <li>
      <a class="title">版本信息</a>
      <el-button class="updateBtn" type="success" round :size="'small'" @click="suggest()">
        意见反馈
      </el-button>
    </li>
    <div class="item">
      当前版本: {{ pkg.version }}
      <el-button class="updateBtn" type="warning" :size="'small'" @click="checkVersion()" :disabled="updateBtnStatus">
        检查版本<el-icon class="el-icon--right">
          <Upload />
        </el-icon>
      </el-button>
    </div>
    <div class="item">开发作者：{{ pkg.author }}</div>
    <div class="item">
      码云地址：<a class="link" href="https://gitee.com/Jokul2018/linglong_store"
        target="_blank">https://gitee.com/Jokul2018/linglong_store</a>
    </div>
    <div class="item">
      github地址：<a class="link" href="https://github.com/GershonWang/linglong-store"
        target="_blank">https://github.com/GershonWang/linglong-store</a>
    </div>
    <br>
    <li>
      <a class="title">赞助支持</a>
    </li>
    <div class="item" style="padding-top: 10px;">
      <img class="image" src="@/assets/aliPay.png" alt="Image"/>
      <img class="image" src="@/assets/wePay.jpg" alt="Image"/>
    </div>
  </div>
  <div class="progress" v-show="downloadModule">
    <el-progress type="dashboard" :percentage="downloadPercent" :color="colors" :stroke-width="15" />
    <div>网速：{{ netspeed }} kb/s</div>
  </div>
</template>
<script setup lang="ts">
import { ipcRenderer } from 'electron';
import pkg from '../../../../package.json';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus'
import { getSearchAppList } from '@/api/server';
import { useUpdateStatusStore } from "@/store/updateStatus";
import { useSystemConfigStore } from "@/store/systemConfig";

const updateStatusStore = useUpdateStatusStore();
const systemConfigStore = useSystemConfigStore();
const versions = process.versions;
const updateBtnStatus = ref(false);
const downloadModule = ref(false);
const downloadPercent = ref(0);
const netspeed = ref(0.00);

const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]
// 意见反馈
const suggest = () => {
  ElMessageBox.prompt('您的建议是我改进的动力！', '意见反馈', {
    confirmButtonText: '提交',
    cancelButtonText: '取消',
    inputType: 'textarea', // 设置input的类型为textarea
    customClass: 'custom-message-box', // 自定义类名
  }).then(({ value }) => {
    if (value) {
      // 发送建议到主进程
      let baseURL = import.meta.env.VITE_SERVER_URL as string;
      const url = baseURL + "/visit/suggest";
      ipcRenderer.send('suggest', { url: url, 
        llVersion: systemConfigStore.llVersion, 
        appVersion: pkg.version, 
        message: value,
        visitorId: systemConfigStore.visitorId  
      })
      ElMessage({
        type: 'success',
        message: `反馈内容已发送`,
      })
    }
  })
}
// 检查更新
const checkVersion = () => {
  updateBtnStatus.value = true;
  updateStatusStore.changeUpdateBtnStatus(updateBtnStatus.value);
  ipcRenderer.send('checkForUpdate');
}
// 监听主进程发送的更新消息
const updateMessage = (_event: any, text: string) => {
  if (text == '检测到新版本，是否选择下载？') {
    ElMessageBox.confirm(text, '提示', {
      confirmButtonText: '下载',
      cancelButtonText: '取消',
      type: 'info',
      center: true,
    }).then(() => {
      downloadModule.value = true;
      updateStatusStore.changeUpdateWinStatus(downloadModule.value);
      ipcRenderer.send('downloadUpdate');
    }).catch(() => {
      updateBtnStatus.value = false;
      updateStatusStore.changeUpdateBtnStatus(updateBtnStatus.value);
      ElNotification({
        title: '提示',
        message: "已放弃更新...",
        type: 'info',
        duration: 500,
      });
    })
  } else if (text == '下载完毕，是否立刻更新？') {
    ElMessageBox.confirm(text, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
      center: true,
    }).then(() => {
      downloadModule.value = false;
      updateStatusStore.changeUpdateWinStatus(downloadModule.value);
      ipcRenderer.send('isUpdateNow');
    }).catch(() => {
      updateBtnStatus.value = false;
      updateStatusStore.changeUpdateBtnStatus(updateBtnStatus.value);
      downloadModule.value = false;
      updateStatusStore.changeUpdateWinStatus(downloadModule.value);
      ElNotification({
        title: '提示',
        message: "已取消安装...",
        type: 'info',
        duration: 500,
      });
    })
  } else if (text == '现在使用的就是最新版本，不用更新' || text == '检查更新出错') {
    updateBtnStatus.value = false;
    updateStatusStore.changeUpdateBtnStatus(updateBtnStatus.value);
    ElNotification({
      title: '提示',
      message: text,
      type: 'info',
      duration: 3000,
    });
  } else {
    ElNotification({
      title: '提示',
      message: text,
      type: 'info',
      duration: 500,
    });
  }
}
async function getLinglongCount() {
  const res = await getSearchAppList({repoName: systemConfigStore.defaultRepoName, pageNo: 1, pageSize: 100000 });
  if (res.code == 200) {
    let count = res.data.total;
    systemConfigStore.changeLinglongCount(count);
  }
}

onMounted(() => {
  updateBtnStatus.value = updateStatusStore.getUpdateBtnStatus;
  downloadModule.value = updateStatusStore.getUpdateWinStatus;
  // 监听更新事件
  ipcRenderer.on('update-message', updateMessage);
  // 监听下载进度
  ipcRenderer.on('downloadProgress', (_event, progressObj) => {
    // 网速
    netspeed.value = Math.ceil(progressObj.bytesPerSecond / 1000);
    //下载进度
    downloadPercent.value = parseInt(progressObj.percent || 0);
    if (downloadPercent.value == 100) {
      updateBtnStatus.value = false;
      updateStatusStore.changeUpdateBtnStatus(updateBtnStatus.value);
      downloadModule.value = false;
      updateStatusStore.changeUpdateWinStatus(downloadModule.value);
    }
  })
  getLinglongCount();
})
onBeforeUnmount(() => {
  // 取消监听更新事件
  ipcRenderer.removeListener('update-message', updateMessage);
})
</script>
<style scoped>
.title {
  font-weight: bold;
  font-size: 18px;
  color: #D3D3D3;
  text-decoration: inherit;
}

.item {
  text-indent: 2em;
}

.link {
  font-weight: bold;
  color: #D3D3D3;
  text-decoration: inherit;
}

.link:hover {
  color: #af2f9e;
}

.updateBtn {
  color: black;
  margin-left: 10px;
}

.image {
  width: 250px;
  margin-right: 30px;
  border-radius: 10px;
}

.progress {
  position: fixed;
  bottom: 30px;
  right: 50px;
  border-radius: 15px;
  background-color: #335061;
  padding: 10px;
  text-align: center;
  color: wheat;
}

.progress :deep(.el-progress__text) {
  color: white;
}

@media (prefers-color-scheme: light) {
  .title {
    color: #000;
  }

  .link {
    color: #0e0101;
  }
}
</style>