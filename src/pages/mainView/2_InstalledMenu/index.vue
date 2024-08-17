<template>
    <div class="apps-container" v-loading="loading" element-loading-text="加载中..." 
        element-loading-background="rgba(122, 122, 122, 0.8)">
        <div class="card-items-container" v-if="displayedItems.length > 0">
            <div class="card-items" v-for="(item, index) in displayedItems" :key="index">
                <el-badge :value="item.occurrenceNumber" :max="99" class="item">
                    <InstalledCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                        :isInstalled="true" :appId="item.appId" :icon="item.icon" :loading="item.loading" :zhName="item.zhName"
                        :size="item.size" :categoryName="item.categoryName"/>
                </el-badge>
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
import { InstalledEntity } from "@/interface";

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();
// 用于显示列表
const displayedItems = ref<InstalledEntity[]>([]);
// 路由对象
const router = useRouter();
// 加载动画
const loading = ref(true);

interface GroupedItem {
  highestVersion: string;
  occurrenceNumber: number;
  record: InstalledEntity; // 记录的完整数据
}

const commandResult = async (_event: any, res: any) => {
    const code = res.code;   // 返回命令执行状态
    const params = res.param;  // 返回命令执行入参参数
    const result = res.result;  // 返回命令执行结果
    const command: string = params.command;  // 返回执行的命令
    if (code != 'stdout') {
        ipcRenderer.send('logger', 'error', "\"" + command + "\"命令执行异常::" + result);
        loading.value = false; // 关闭loading加载动画
        // 弹出提示框
        ElNotification({
            title: '错误',
            message: result,
            type: 'error',
            duration: 500,
        });
        return;
    }
    if (command.startsWith('ll-cli list')) {
        if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
            await installedItemsStore.initInstalledItemsOld(result);
            displayedItems.value = installedItemsStore.installedItemList;
        }
        if (command == 'll-cli list --json' || command == 'll-cli list --json --type=all') {
            await installedItemsStore.initInstalledItems(result);
            if (systemConfigStore.isShowMergeApp) {
                const datas = installedItemsStore.installedItemList;
                if (datas.length > 0) {
                    const grouped = installedItemsStore.installedItemList.reduce<Record<string, GroupedItem>>((acc, item) => {
                        const { appId, version } = item;
                        if (!acc[appId]) {
                            acc[appId] = { highestVersion: version, occurrenceNumber: 0 , record: item};
                        }
                        // 获取最高版本的记录
                        if (compareVersions(version, acc[appId].highestVersion) > 0) {
                            acc[appId].highestVersion = version;
                            acc[appId].record = item;
                        }
                        // appId计数
                        acc[appId].occurrenceNumber++;
                        return acc;
                    }, {});

                    const results: InstalledEntity[] = Object.keys(grouped).map(appid => ({
                        ...grouped[appid].record,
                        occurrenceNumber: grouped[appid].occurrenceNumber,
                    }));

                    displayedItems.value = results;
                }
            } else {
                displayedItems.value = installedItemsStore.installedItemList;
            }
        }
        // 恢复保存的滚动位置
        const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
        container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
        loading.value = false; // 关闭loading加载动画
    }
}
// 组件初始化时加载
onMounted(() => {
    elertTip(); // 检测网络
    // 根据版本环境获取安装程序列表发送命令
    let getInstalledItemsCommand = "ll-cli list --json";
    if (compareVersions(systemConfigStore.llVersion, "1.3.99") < 0) {
        getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'";
    } else if (compareVersions(systemConfigStore.linglongBinVersion, "1.5.0") >= 0 && systemConfigStore.isShowBaseService) {
        getInstalledItemsCommand = "ll-cli list --json --type=all";
    }
    ipcRenderer.send('command', { command: getInstalledItemsCommand});
    ipcRenderer.once('command-result', commandResult);
});
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    next();
})
</script>
<style scoped>
.item {
  margin-top: 6px;
  width: 96%;
}
</style>