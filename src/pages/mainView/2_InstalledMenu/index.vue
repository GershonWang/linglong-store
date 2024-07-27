<template>
    <div class="apps-container" v-loading="loading" element-loading-text="加载中...">
        <div class="card-items-container" v-if="displayedItems.length > 0">
            <div class="card-items" v-for="(item, index) in displayedItems" :key="index">
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
import { onMounted, ref } from "vue";
import { compareVersions } from "@/util/checkVersion";
import elertTip from "@/util/NetErrorTips";
import { CardFace } from "@/interface";

const installedStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();
// 用于显示列表
const displayedItems = ref<CardFace[]>([]);
// 路由对象
const router = useRouter();
// 加载动画
const loading = ref(true);
// 组件初始化时加载
onMounted(() => {
    elertTip(); // 检测网络
    // 根据版本环境获取安装程序列表发送命令
    let getInstalledItemsCommand = "";
    // console.log('当前版本',systemConfigStore.llVersion);
    if (compareVersions(systemConfigStore.llVersion, "1.3.99") < 0) {
        getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'";
    } else if (compareVersions(systemConfigStore.llVersion, "1.3.99") > 0 
        && compareVersions(systemConfigStore.linglongBinVersion, "1.5.0") < 0) {
        getInstalledItemsCommand = "ll-cli list --json";
    } else {
        if (systemConfigStore.isShowBaseService) {
            getInstalledItemsCommand = "ll-cli list --json --type=all";
        } else {
            getInstalledItemsCommand = "ll-cli list --json";
        }
    }
    // console.log('发送查询已安装命令',getInstalledItemsCommand);
    ipcRenderer.send('command', { command: getInstalledItemsCommand});
    ipcRenderer.once('command-result', async (_event: any, res: any) => {
        const result: string = res.result;
        const command: string = res.param.command;
        if (res.code == 'stdout') {
            if ( command.startsWith('ll-cli list')) {
                if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
                    await installedStore.initInstalledItemsOld(result);
                    displayedItems.value = installedStore.installedItemList;
                    return;
                }
                await installedStore.initInstalledItems(result);
                displayedItems.value = installedStore.installedItemList;
                // 恢复保存的滚动位置
                const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
                container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
            }
        } else {
            // 弹出提示框
            ElNotification({
                title: '错误',
                message: result,
                type: 'error',
                duration: 500,
            });
        }
        // 启动动画
        loading.value = false;
    });
});
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    next();
})
</script>