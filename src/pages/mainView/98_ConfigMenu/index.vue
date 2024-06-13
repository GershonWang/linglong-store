<template>
  <div style="height: calc(100vh - 88px);">
    <h1>基础设置</h1>
    玲珑源：
    <el-select style="width: 300px;" v-model="defaultSource" @change="changeEvent">
      <el-option label="https://mirror-repo-linglong.deepin.com" value="https://mirror-repo-linglong.deepin.com"
        :key="1" />
    </el-select><br>
    <!-- <el-checkbox v-model="isShowDisArch" size="large" @change="checkedArch(isShowDisArch)">
      是否显示非当前({{ systemConfigStore.arch }})架构程序
    </el-checkbox><br> -->
    <!-- <el-checkbox v-model="isShowNoIcon" size="large" @change="checkedNoIcon(isShowNoIcon)">
      是否显示无图标玲珑程序
    </el-checkbox><br> -->
    <el-checkbox v-model="isShowBaseService" size="large" @change="checkedBaseService(isShowBaseService)">
      是否显示基础运行服务
    </el-checkbox><br>
    <el-checkbox v-model="autoCheckUpdate" size="large" @change="checkedUpdate(autoCheckUpdate)">
      启动App自动检测商店版本
    </el-checkbox><br>
  </div>
  <div class="visitorId" v-if="systemConfigStore.visitorId">
    指纹码：
    <el-text size="small">{{ systemConfigStore.visitorId }}</el-text>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
import hasUpdateVersion from '@/util/checkVersion';
import { useSystemConfigStore } from "@/store/systemConfig";
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";

const systemConfigStore = useSystemConfigStore();
const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();

// 默认源
let defaultSource = ref('');
// 是否显示不匹配架构程序
let isShowDisArch = ref(true);
// 是否显示无图标玲珑程序
let isShowNoIcon = ref(false);
// 是否显示基础运行服务
let isShowBaseService = ref(false);
// 自动检测更新
let autoCheckUpdate = ref(true);
// 切换源事件
const changeEvent = (data: any) => {
  systemConfigStore.changeSourceUrl(data);
  // 发送网络命令，重新获取源内所有应用
  const baseUrl: string = systemConfigStore.sourceUrl;
  const requestUrl: string = baseUrl.concat('/api/v0/web-store/apps??page=1&size=100000');
  ipcRenderer.send('network', { url: requestUrl });
  ipcRenderer.on('network-result', networkResult);
}
// 是否显示不匹配架构程序的变更事件
const checkedArch = (data: boolean) => {
  systemConfigStore.changeIsShowDisArch(data);
  // 发送网络命令，重新获取源内所有应用
  const baseUrl: string = systemConfigStore.sourceUrl;
  const requestUrl: string = baseUrl.concat('/api/v0/web-store/apps??page=1&size=100000');
  ipcRenderer.send('network', { url: requestUrl });
  ipcRenderer.on('network-result', networkResult);
}
// 是否显示无图标玲珑程序的变更事件
const checkedNoIcon = (data: boolean) => {
  systemConfigStore.changeIsShowNoIcon(data);
  // 发送网络命令，重新获取源内所有应用
  const baseUrl: string = systemConfigStore.sourceUrl;
  const requestUrl: string = baseUrl.concat('/api/v0/web-store/apps??page=1&size=100000');
  ipcRenderer.send('network', { url: requestUrl });
  ipcRenderer.on('network-result', networkResult);
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
// 网络执行返回结果
const networkResult = (_event: any, res: any) => {
  const code = res.code;
  const data = res.data;
  if (code == 200) {
    // 初始化所有应用程序列表
    const installedItemList = installedItemsStore.installedItemList;
    allServItemsStore.initAllItems(data, installedItemList);
  }
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
      // 更新已安装程序图标
      const allItems = allServItemsStore.allServItemList;
      installedItemsStore.updateInstalledItemsIcons(allItems);
    } else {
      // 网络异常，变更标识
      systemConfigStore.changeNetworkRunStatus(false);
    }
  }
}
// 页面启动时加载
onMounted(() => {
  defaultSource.value = systemConfigStore.sourceUrl;
  isShowDisArch.value = systemConfigStore.isShowDisArch;
  isShowNoIcon.value = systemConfigStore.isShowNoIcon;
  isShowBaseService.value = systemConfigStore.isShowBaseService;
  autoCheckUpdate.value = systemConfigStore.autoCheckUpdate;
})
// 页面关闭时卸载
onBeforeUnmount(() => {
  ipcRenderer.removeListener('network-result', networkResult)
})
</script>
<style scoped>
.visitorId {
  text-align: center;
  font-family: monospace;
}
</style>