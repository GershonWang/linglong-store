<template>
    <div class="container">
        <div class="card_container">
            <div class="card_items" v-for="(item, index) in installedItems" :key="index">
                <Card :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :index="index" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { ElNotification } from 'element-plus'
import { ipcRenderer } from 'electron';
import Card from "@/components/Card.vue";

import { useInstalledItemsStore } from "@/store/items";
const installedStore = useInstalledItemsStore();
const installedItems = installedStore.getItems();
// 重试次数
let retryNum = ref(0);
// 命令执行返回结果
const commandResult = (_event: any, res: any) => {
    const params = res.param;
    const code = res.code;
    if ('stdout' != code) {
        if (retryNum.value <= 3) {
            retryNum.value++;
            ipcRenderer.send('command', params);
        } else {
            retryNum.value = 0;
            ElNotification({
                title: '请求错误',
                message: '命令执行异常！',
                type: 'error',
            });
        }
        return;
    }
    // 卸载命令
    if (params.command.startsWith('ll-cli uninstall')) {
        installedItems.splice(params.index, 1);
        ElNotification({
            title: '卸载成功',
            message: params.name + '(' + params.version + ')被成功卸载!',
            type: 'success',
        });
    }
}
watch(installedItems,(newValue, oldValue) => {
    console.log('newValue',newValue);
    console.log('oldValue',oldValue);
});
// 组件初始化时加载
onMounted(() => {
    ipcRenderer.on('command-result', commandResult);
});
// 在组件销毁时移除事件监听器
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult)
});
</script>

<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}

.card_container {
    display: grid;
    grid-gap: 10px;
    margin-right: 12px;
    grid-template-columns: repeat(auto-fill,minmax(200px,auto));
}

.card_items {
    padding: 10px;
    flex: 1;
    min-width: 200px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}
</style>