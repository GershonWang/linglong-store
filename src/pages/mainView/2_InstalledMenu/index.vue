<template>
    <div class="container">
        <div class="card-container" v-if="installedStore.installedItemList && installedStore.installedItemList.length > 0">
            <div class="card-items" v-for="(item, index) in installedStore.installedItemList" :key="index">
                <InstalledCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :loading="item.loading"/>
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px;">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>暂无数据</h1>
        </div>
    </div>
</template>

<script setup lang="ts">
import InstalledCard from "@/components/installCard.vue";
import defaultImage from '@/assets/logo.svg';
import { ipcRenderer } from "electron";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useAllServItemsStore } from "@/store/allServItems";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { onMounted } from "vue";
import hasUpdateVersion from "@/util/checkVersion";

const installedStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();
const allServItemsStore = useAllServItemsStore();
// 路由对象
const router = useRouter();
// 监听命令执行事件
const handleCommandResult = (_event: any, res: any) => {
    const code: string = res.code;
    const result: string = res.result;
    const command: string = res.param.command;
    if (command =='ll-cli list --json' || command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
        if (code == 'stdout') {
            if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
                installedStore.initInstalledItemsOld(result);
                const allItems = allServItemsStore.allServItemList;
                installedStore.updateInstalledItemsIcons(allItems);
            }
            if (command == 'll-cli list --json') {
                installedStore.initInstalledItems(result);
                const allItems = allServItemsStore.allServItemList;
                installedStore.updateInstalledItemsIcons(allItems);
            }
        }
    }
}
// 组件初始化时加载
onMounted(() => {
    const commandParam = { command: "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'" };
    // 判断当版本高于1.3.99时，执行json
    if (hasUpdateVersion('1.3.99', systemConfigStore.llVersion) == 1) {
        commandParam.command = "ll-cli list --json";
    }
    ipcRenderer.send('command', commandParam);
    ipcRenderer.on('command-result', handleCommandResult);
    // 恢复保存的滚动位置
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
    container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
});
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    ipcRenderer.removeListener('command-result', handleCommandResult);
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    next();
})
</script>

<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}

.card-container {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fill,minmax(180px,1fr));
}

.card-items {
    padding: 10px;
    flex: 1;
    min-width: 180px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}

.no-data-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
    display: none;
}
</style>