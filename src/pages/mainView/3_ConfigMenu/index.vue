<template>
  <div>
    <h1>基本设置</h1>
    <el-divider />
    <div>
      玲珑源：
      <el-select style="width: 300px;" v-model="defaultSource" @change="changeEvent">
        <el-option label="https://mirror-repo-linglong.deepin.com" value="https://mirror-repo-linglong.deepin.com"
          :key="1" />
      </el-select>
    </div>
    <div>
      <el-checkbox v-model="checked" size="large" @change="checkedArch(checked)">
        过滤非当前({{ sysConfStore.arch }})架构程序
      </el-checkbox>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
import { useSysConfStore } from "@/store/sysConf";
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";

const sysConfStore = useSysConfStore();
const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();

// 默认源
const defaultSource = ref('');
// 是否过滤不匹配架构程序
let checked = ref(true);
// 切换源事件
const changeEvent = (data: any) => {
  sysConfStore.changeSourceUrl(data);
}
// 过滤不匹配架构程序事件
const checkedArch = (data: boolean) => {
  sysConfStore.changeFilterFlag(data);
  // 发送网络命令，获取源内所有应用
  ipcRenderer.send('network', { url: sysConfStore.sourceUrl + '/api/v0/web-store/apps??page=1&size=100000' });
  ipcRenderer.on('network-result', networkResult);
}
// 网络执行返回结果
const networkResult = (_event: any, res: any) => {
  if (res.code == 200) {
    // 初始化所有应用程序列表
    const responseList = res.data.list;
    const installedItemList = installedItemsStore.installedItemList;
    allServItemsStore.initAllItems(responseList, installedItemList);
  }
}
onMounted(() => {
  defaultSource.value = sysConfStore.sourceUrl;
  checked.value = sysConfStore.filterFlag;
})
onBeforeUnmount(() => {
  ipcRenderer.removeListener('network-result', networkResult)
})
</script>
<style scoped></style>
