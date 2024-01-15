<template>
  <div>
    <h1>基本设置</h1>
    <el-divider />
    <div>
      玲珑源：
      <el-select style="width: 300px;" v-model="defaultSource" @change="changeEvent">
        <el-option label="https://mirror-repo-linglong.deepin.com" value="https://mirror-repo-linglong.deepin.com" :key="1" />
      </el-select>
    </div>
    <div>
      <el-checkbox v-model="checked" size="large" @change="checkedArch(checked)">
        过滤非当前({{ systemInfo }})架构程序
      </el-checkbox>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { ipcRenderer } from "electron";
import { useSysConfStore } from "@/store/sysConf";
import { storeToRefs } from 'pinia';

const sysConfStore = useSysConfStore();
const { arch, sourceUrl } = storeToRefs(sysConfStore);

// 存储在session里的系统信息
const systemInfo = arch.value;
// 默认源
const defaultSource = sourceUrl.value;
// 是否过滤不匹配架构程序
let checked = sysConfStore.getFilterFlag;
// 切换源事件
const changeEvent = (data: any) => {
  sourceUrl.value = data;
}
// 过滤不匹配架构程序事件
const checkedArch = (data: boolean) => {
  sysConfStore.changeFilterFlag(data);
  // 发送网络命令，获取源内所有应用，并返回结果存储到session中
  ipcRenderer.send('network', { url: sourceUrl.value + '/api/v0/web-store/apps??page=1&size=100000' });
  ipcRenderer.on('network-result', (_event: any, res: any) => {
    let allItems = '[';
    if (res.code == '200') {
      const array = res.data.list;
      for (let i = 0; i < array.length; i++) {
        const item = array[i];
        const arch: string | undefined = item.arch?.trim();
        if (data && arch != systemInfo) {
          continue;
        }
        allItems += JSON.stringify(item) + ',';
      }
      if (allItems.length > 1) {
        allItems = allItems.substring(0, allItems.length - 1);
      }
    }
    allItems += ']';
    sessionStorage.setItem('allItems', allItems);
  });
}
// 页面挂载加载
onMounted(() => {})
onBeforeUnmount(() => {
  ipcRenderer.removeListener('network-result', (_event: any, res: any) => {
    let allItems = '[';
    if (res.code == '200') {
      const array = res.data.list;
      for (let i = 0; i < array.length; i++) {
        const item = array[i];
        allItems += JSON.stringify(item) + ',';
      }
      if (allItems.length > 1) {
        allItems = allItems.substring(0, allItems.length - 1);
      }
    }
    allItems += ']';
    sessionStorage.setItem('allItems', allItems);
  });
})
</script>
<style scoped></style>
