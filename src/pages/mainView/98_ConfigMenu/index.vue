<template>
  <div>
    <h1>基础设置</h1>
    <el-divider />
      玲珑源：
      <el-select style="width: 300px;" v-model="defaultSource" @change="changeEvent">
        <el-option label="https://mirror-repo-linglong.deepin.com" value="https://mirror-repo-linglong.deepin.com"
          :key="1" />
      </el-select><br>
      <el-checkbox v-model="checked" size="large" @change="checkedArch(checked)">
        过滤非当前({{ systemConfigStore.arch }})架构程序
      </el-checkbox><br>
      <el-checkbox v-model="autoCheckUpdate" size="large" @change="checkedUpdate(autoCheckUpdate)">
        启动App自动检测商店版本
      </el-checkbox><br>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";

const systemConfigStore = useSystemConfigStore();
const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();

// 默认源
const defaultSource = ref('');
// 是否过滤不匹配架构程序
let checked = ref(false);
// 自动检测更新
let autoCheckUpdate = ref(true);
// 切换源事件
const changeEvent = (data: any) => {
  systemConfigStore.changeSourceUrl(data);
}
// 过滤不匹配架构程序事件
const checkedArch = (data: boolean) => {
  systemConfigStore.changeFilterFlag(data);
  // 发送网络命令，获取源内所有应用
  const baseUrl: string = systemConfigStore.sourceUrl;
  const requestUrl: string = baseUrl.concat('/api/v0/web-store/apps??page=1&size=100000');
  ipcRenderer.send('network', { url: requestUrl });
  ipcRenderer.on('network-result', networkResult);
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
onMounted(() => {
  defaultSource.value = systemConfigStore.sourceUrl;
  checked.value = systemConfigStore.filterFlag;
  autoCheckUpdate.value = systemConfigStore.autoCheckUpdate;
})
onBeforeUnmount(() => {
  ipcRenderer.removeListener('network-result', networkResult)
})
</script>
<style scoped></style>