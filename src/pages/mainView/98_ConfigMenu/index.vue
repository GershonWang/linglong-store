<template>
  <div style="height: calc(100vh - 88px);">
    <h1>基础设置</h1>
    <!-- <em style="font-size: 14px;">更换玲珑仓库：</em>
    <el-select v-model="defaultRepo" style="width: 120px" @change="changeDefaultRepo">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"/>
    </el-select><br> -->
    <el-checkbox v-model="autoCheckUpdate" size="large"
      @change="systemConfigStore.changeAutoCheckUpdate(autoCheckUpdate)">
      启动App自动检测商店版本
    </el-checkbox><br>
    <el-checkbox size="large"
      @change="isFloat">
      启用悬浮球
    </el-checkbox><br>
    <li>
      <a class="title">卸载程序</a>
    </li>
    <div style="margin-left: 30px;">
      <el-checkbox v-model="isShowBaseService" size="large" @change="checkedBaseService(isShowBaseService)">
        显示基础运行服务
      </el-checkbox>
      <el-checkbox v-model="isMergeApp" size="large" @change="systemConfigStore.changeIsShowMergeApp(isMergeApp)">
        同appId程序合并
      </el-checkbox>
    </div>
  </div>
  <!-- <div class="visitorId" v-if="systemConfigStore.visitorId">
    指纹码：
    <el-text size="small">{{ systemConfigStore.visitorId }}</el-text>
  </div> -->
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
import { compareVersions } from '@/util/checkVersion';
import { useSystemConfigStore } from "@/store/systemConfig";
import { useRouter } from "vue-router";

const systemConfigStore = useSystemConfigStore();
// 路由对象
const router = useRouter();

// 默认玲珑仓库对象
let defaultRepo = ref('');
// 自动检测更新
let autoCheckUpdate = ref(true);
// 是否显示基础运行服务
let isShowBaseService = ref(false);
// 卸载程序页面同程序合并
let isMergeApp = ref(true);
// 切换仓库源的下拉选项
const options = [
  { label: "stable", value: "stable" },
  { label: "repo", value: "repo" }
]
// 切换仓库源的change事件
const changeDefaultRepo = () => {
  let repoCommond = 'll-cli repo modify --name=' + defaultRepo.value + ' https://mirror-repo-linglong.deepin.com';
  ipcRenderer.send('command', { command: repoCommond });
  router.push('/'); // 返回首页重新加载商店
}
// 显示悬浮球
const isFloat = (event: any) => {
  ipcRenderer.send('toggle-floating', event);
}
// 是否显示基础运行服务的变更事件
const checkedBaseService = (checkStatus: boolean) => {
  // 修改系统配置文件，记录状态
  systemConfigStore.changeIsShowBaseService(checkStatus);
  // 检测版本，执行不同的命令
  let getInstalledItemsCommand = "ll-cli list --json";
  if (compareVersions(systemConfigStore.llVersion, "1.3.99") < 0) {
    // 1.4.0版本之前的命令
    getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'";
  }
  ipcRenderer.send('command', { command: getInstalledItemsCommand, type: "refreshInstalledApps" });
}
// 页面启动时加载
onMounted(() => {
  defaultRepo.value = systemConfigStore.defaultRepoName;  // 默认仓库
  autoCheckUpdate.value = systemConfigStore.autoCheckUpdate;  // 是否自动检测更新
  isShowBaseService.value = systemConfigStore.isShowBaseService;  // 是否显示基础运行服务
  isMergeApp.value = systemConfigStore.isShowMergeApp;  // 卸载程序页面同程序合并
})
</script>
<style scoped>
.title {
  font-weight: bold;
  font-size: 14px;
  color: #D3D3D3;
  text-decoration: inherit;
}

.visitorId {
  text-align: center;
  font-family: monospace;
}

@media (prefers-color-scheme: light) {
  .title {
    color: #000;
  }
}
</style>