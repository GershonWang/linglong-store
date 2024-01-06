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
      <el-checkbox v-model="checked" size="large" @change="checkedArch">过滤非当前({{ systemInfo }})架构程序</el-checkbox>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { ipcRenderer } from "electron";
// 存储在session里的系统信息
const systemInfo = sessionStorage.getItem('systemInfo');
// 默认源
const defaultSource = ref("");
// 是否过滤不匹配架构程序
const checked = ref();
// 切换源事件
const changeEvent = (data: any) => {
  window.sessionStorage.setItem('sourceUrl', data);
}
// 过滤不匹配架构程序事件
const checkedArch = (checked: any) => {
  sessionStorage.setItem('checkedArch', checked);
  // 发送网络命令，获取源内所有应用，并返回结果存储到session中
  ipcRenderer.send('network', { url: sessionStorage.getItem('sourceUrl') + '/api/v0/web-store/apps??page=1&size=100000' });
  ipcRenderer.on('network-result', (_event: any, res: any) => {
    let allItems = '[';
    if (res.code == '200') {
        const array = res.data.list;
        for (let i = 0; i < array.length; i++) {
            const item = array[i];
            const arch:string | undefined = item.arch?.trim();
            const systemInfo: string | undefined = sessionStorage.getItem('systemInfo')?.trim();
            if (checked && arch != systemInfo) {
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
onMounted(() => {
  // 获取默认源
  const sourceUrl: string | null = sessionStorage.getItem('sourceUrl');
  defaultSource.value = sourceUrl != null ? sourceUrl : "https://mirror-repo-linglong.deepin.com";
  sessionStorage.setItem('sourceUrl', defaultSource.value);
  // 获取是否过滤不匹配架构程序
  checked.value = sessionStorage.getItem('checkedArch') === 'true' ? true : false;
  sessionStorage.setItem('checkedArch', checked.value.toString());
})
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
<style scoped>
</style>
