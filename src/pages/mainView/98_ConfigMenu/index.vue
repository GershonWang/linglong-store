<template>
  <div style="height: calc(100vh - 88px);">
    <h1>基础设置</h1>
    <em style="font-size: 14px;">更换玲珑仓库：</em>
    <el-select v-model="defaultRepo" style="width: 120px" @change="changeDefaultRepo">
      <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"/>
    </el-select><br>
    <el-checkbox v-model="autoCheckUpdate" size="large" @change="checkedUpdate(autoCheckUpdate)">
      启动App自动检测商店版本
    </el-checkbox><br>
    <el-checkbox v-model="isShowBaseService" size="large" @change="checkedBaseService(isShowBaseService)">
      卸载程序 - 显示基础运行服务
    </el-checkbox><br>
    <el-checkbox v-model="mergeApp" size="large" @change="changeMergeAppStatus(mergeApp)">
      卸载程序 - 同AppId程序合并
    </el-checkbox><br>
  </div>
  <div class="visitorId" v-if="systemConfigStore.visitorId">
    指纹码：
    <el-text size="small">{{ systemConfigStore.visitorId }}</el-text>
  </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import hasUpdateVersion from '@/util/checkVersion';
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useRouter } from "vue-router";
// 路由对象
const router = useRouter();

const systemConfigStore = useSystemConfigStore();
const installedItemsStore = useInstalledItemsStore();

// 默认玲珑仓库对象
let defaultRepo = ref('');
// 自动检测更新
let autoCheckUpdate = ref(true);
// 是否显示基础运行服务
let isShowBaseService = ref(false);
// 卸载程序页面同程序合并
let mergeApp = ref(true);

const options = [
  { label: "stable", value: "stable" },
  { label: "repo", value: "repo" }
]

const changeDefaultRepo = () => {
  ipcRenderer.send('command', { command: 'll-cli repo modify --name=' + defaultRepo.value + ' https://mirror-repo-linglong.deepin.com' });
  router.push('/'); // 返回首页重新加载商店
}
// 是否显示基础运行服务的变更事件
const checkedBaseService = (data: boolean) => {
  systemConfigStore.changeIsShowBaseService(data);
  if (hasUpdateVersion('1.3.99', systemConfigStore.llVersion) == 1) {
    ipcRenderer.send("command", { command: "ll-cli list --json" });
  } else {
    ipcRenderer.send("command", { command: "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'" });
  }
  ipcRenderer.on("command-result", commandResult);
}
// 自动检测更新事件
const checkedUpdate = (data: boolean) => {
  systemConfigStore.changeAutoCheckUpdate(data);
}
// 卸载程序菜单-同程序合并
const changeMergeAppStatus = (params: boolean) => {
  console.log("切换状态",params);
  ElNotification({
      title: '温馨提示',
      message: '功能尚未开发！',
      type: 'success',
      duration: 1000,
  });
}
// 命令执行返回结果
const commandResult = (_event: any, res: any) => {
  const result: any = res.result;
  const command: string = res.param.command;
  if (command == 'll-cli list --json' || command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
    if (res.code == 'stdout') {
      if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
        installedItemsStore.initInstalledItemsOld(result);
      }
      if (command == 'll-cli list --json') {
        installedItemsStore.initInstalledItems(result);
      }
    } else {
      // 网络异常，变更标识
      systemConfigStore.changeNetworkRunStatus(false);
    }
  }
}
// 页面启动时加载
onMounted(() => {
  defaultRepo.value = systemConfigStore.defaultRepoName;  // 默认仓库
  autoCheckUpdate.value = systemConfigStore.autoCheckUpdate;  // 是否自动检测更新
  isShowBaseService.value = systemConfigStore.isShowBaseService;  // 是否显示基础运行服务

})
</script>
<style scoped>
.visitorId {
  text-align: center;
  font-family: monospace;
}
</style>