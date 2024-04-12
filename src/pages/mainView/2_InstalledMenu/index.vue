<template>
    <div class="container">
        <div class="card-container" v-if="installedStore.installedItemList && installedStore.installedItemList.length > 0">
            <div class="card-items" v-for="(item, index) in installedStore.installedItemList" :key="index">
                <InstalledCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :loading="item.loading" :zhName="item.zhName"
                    :size="item.size"/>
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
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { onMounted } from "vue";
import hasUpdateVersion from "@/util/checkVersion";

const installedStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();
// 路由对象
const router = useRouter();
// 组件初始化时加载
onMounted(() => {
    // 清除页面原始数据
    installedStore.clearItems();
    // 发送命令
    const commandParam = { command: "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'" };
    // 判断当版本高于1.3.99时，执行json
    if (hasUpdateVersion('1.3.99', systemConfigStore.llVersion) == 1) {
        commandParam.command = "ll-cli list --json";
    }
    ipcRenderer.send('command', commandParam);
    ipcRenderer.once('command-result', (_event: any, res: any) => {
        const code: string = res.code;
        const result: string = res.result;
        const command: string = res.param.command;
        if ((command =='ll-cli list --json' || command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') && code == 'stdout') {
            if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
                installedStore.initInstalledItemsOld(result);
                return;
            }
            installedStore.initInstalledItems(result);
        }
    });
    // 恢复保存的滚动位置
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
    container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
});
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    next();
})
</script>

<style scoped>
.container {
    height: 100%;
    width: 100%;
    overflow-y: auto;
}

.card-container {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fill,minmax(190px,1fr));
    width: 100%;
    height: 100%;
}

.card-items {
    padding: 10px;
    flex: 1;
    min-width: 180px;
    max-width: 210px;
    border-radius: 5px;
    box-sizing: border-box;
    background: radial-gradient(circle at 50% 50%, transparent, #6E6E6E);
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

@media (prefers-color-scheme: light) {
    .card-items {
        background: radial-gradient(circle at 50% 50%, transparent, #E2AB5F);
    }
}
</style>