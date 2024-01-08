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
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { ElNotification } from 'element-plus'
import { ipcRenderer } from 'electron';
import { CardFace } from "@/components/CardFace";
import Card from "@/components/Card.vue";

import { installedItemsStore } from "@/store/items";
const installedStore = installedItemsStore();
// console.log("store1", installedStore.installedItems);
// console.log("store", installedStore.getItems());
// console.log("store2", installedStore.installedItemList);
// 存储在session里源内所有程序数组
let allItems = sessionStorage.getItem('allItems');
// 用于存储当前系统已安装的卡片对象
let installedItems = reactive<CardFace[]>([]);
// 重试次数
let retryNum = ref(0);
// 命令执行返回结果
const commandResult = (_event: any, res: any) => {
    const params = res.param;
    const result = res.result;
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
    // 查询已安装命令
    if (params.command == 'll-cli list') {
        const apps = result.split("\n");
        if (apps.length > 1) {
            const header = apps[0].split('[1m[38;5;214m')[1];
            const appIdNum = header.indexOf('appId');
            const nameNum = header.indexOf('name');
            const versionNum = header.indexOf('version');
            const archNum = header.indexOf('arch');
            const channelNum = header.indexOf('channel');
            const moduleNum = header.indexOf('module');
            const descriptionNum = header.indexOf('description');
            // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
            for (let index = 1; index < apps.length - 1; index++) {
                const element = apps[index];
                const appId = element.substring(appIdNum, nameNum).trim();
                // 去除运行时服务
                if (appId == 'org.deepin.Runtime' || appId == 'org.deepin.basics') { 
                    continue;
                }
                const items = element.match(/'[^']+'|\S+/g);
                // const name = element.substring(nameNum, versionNum).trim();
                // const version = element.substring(versionNum, archNum).trim();
                // const arch = element.substring(archNum, channelNum).trim();
                // const channel = element.substring(channelNum, moduleNum).trim();
                // const module = element.substring(moduleNum, descriptionNum).trim();
                // const description = element.substring(descriptionNum).trim();
                const version = items[2];
                const item: CardFace = {};
                item.appId = appId;
                item.name = items[1] ? items[1] : '-';
                item.version = version;
                item.arch = items[3];
                item.channel = items[4];
                item.module = items[5];
                item.description = items[6];
                let icon = "";
                if (allItems != null && allItems.length > 0) {
                    const all = JSON.parse(allItems);
                    const its = all.find((it: CardFace) => it.appId == appId && it.version == version)
                    if (its) {
                        icon = its.icon;
                    }
                }
                item.icon = icon;
                installedItems.push(item);
            }
        }
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
// 组件初始化时加载
onMounted(() => {
    // 初始加载当前系统已经安装的玲珑程序
    ipcRenderer.send('command', { name: '查询已安装程序列表', command: 'll-cli list' });
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