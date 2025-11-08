<template>
    <div class="details-header">
        <el-breadcrumb :separator-icon="ArrowRight">
            <el-breadcrumb-item class="first-menu" @click="router.back">{{ menuName }}</el-breadcrumb-item>
            <el-breadcrumb-item class="second-menu">{{ defaultName }}</el-breadcrumb-item>
        </el-breadcrumb>
        <el-button type="primary" class="back-button" @click="router.back" :icon="ArrowLeft">
            返回
        </el-button>
    </div>
    <div class="base-container">
        <div class="title">参数信息</div>
        <div class="base-message">
            <el-row style="height: 100%;">
                <el-col :span="4" class="image-icon">
                    <img v-lazy="icon" alt="程序图标" width="120px" height="120px" />
                </el-col>
                <el-col :span="20" style="padding-left: 10px;height: 100%;">
                    <el-row style="margin-bottom: 6px;">
                        <el-col :span="3" class="base-message-key">中文名称：</el-col>
                        <el-col :span="5" class="base-message-value" :title="zhName">{{ defaultName }}</el-col>
                        <el-col :span="3" class="base-message-key">应用名称：</el-col>
                        <el-col :span="5" class="base-message-value" :title="name">{{ name }}</el-col>
                        <el-col :span="3" class="base-message-key">架构：</el-col>
                        <el-col :span="5" class="base-message-value" :title="formatArch">{{ formatArch }}</el-col>
                    </el-row>
                    <el-row style="margin-bottom: 6px;">
                        <el-col :span="3" class="base-message-key">appId：</el-col>
                        <el-col :span="5" class="base-message-value" :title="appId">{{ appId }}</el-col>
                        <el-col :span="3" class="base-message-key">应用分类：</el-col>
                        <el-col :span="5" class="base-message-value" :title="categoryName">{{ categoryName }}</el-col>
                        <el-col :span="3" class="base-message-key" v-if="devName">维护者：</el-col>
                        <el-col :span="5" class="base-message-value" v-if="devName">{{ devName }}</el-col>
                    </el-row>
                    <el-row style="height: calc(100% - 70px);">
                        <el-col :span="3" class="base-message-key">应用简述：</el-col>
                        <el-col :span="21" style="height: 100%;overflow: scroll;color: #213547;">{{ description
                            }}</el-col>
                    </el-row>
                </el-col>
            </el-row>
        </div>
    </div>
    <div class="choose-version">
        <div class="title">版本选择</div>
        <el-table class="version-table" :data="difVersionItemsStore.difVersionItemList" border stripe
            v-loading="loading">
            <el-table-column prop="version" label="版本号" header-align="center" align="center" width="120"
                show-overflow-tooltip />
            <el-table-column prop="kind" label="应用类型" header-align="center" align="center" width="90"
                show-overflow-tooltip />
            <el-table-column prop="channel" label="通道" header-align="center" align="center" width="90"
                show-overflow-tooltip />
            <el-table-column prop="module" label="模式" header-align="center" align="center" width="90"
                show-overflow-tooltip />
            <el-table-column prop="repoName" label="仓库来源" header-align="center" align="center" width="90"
                show-overflow-tooltip />
            <el-table-column label="文件大小" header-align="center" align="center" width="100" :formatter="formatSize"
                show-overflow-tooltip />
            <el-table-column label="下载量" header-align="center" align="center" width="90" :formatter="formatCount"
                show-overflow-tooltip />
            <el-table-column label="上架时间" header-align="center" align="center" width="120" :formatter="formatUploadTime"
                show-overflow-tooltip />
            <el-table-column label="运行环境" header-align="center" align="center" min-width="260"
                :formatter="formatRuntime" show-overflow-tooltip />
            <el-table-column fixed="right" label="操作" header-align="center" align="center" width="130">
                <template #default="scope">
                    <el-button class="detail-btn uninstall-btn"
                        v-if="scope.row.isInstalled && !scope.row.loading && scope.row.kind == 'app'"
                        @click="removeApp(scope.row)">卸载</el-button>
                    <el-button class="detail-btn" v-if="scope.row.isInstalled && scope.row.loading"
                        loading>卸载中</el-button>
                    <el-button class="detail-btn" v-if="!scope.row.isInstalled && scope.row.loading"
                        loading>安装中</el-button>
                    <el-button class="detail-btn install-btn"
                        v-if="!scope.row.isInstalled && !scope.row.loading && scope.row.kind == 'app'"
                        @click="installApp(scope.row)">安装</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-button type="primary" @click="drawer = true;">评论</el-button>
    </div>
    <DiscussAreaDrawer :drawer="drawer" :defaultName="defaultName" :appId="appId as string" @update:drawer="drawer = $event" />
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ipcRenderer } from 'electron';
import { onBeforeRouteLeave } from 'vue-router';
import { useRoute, useRouter } from 'vue-router';
import { InstalledEntity } from '@/interface';
import { ElNotification } from 'element-plus'
import { ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import { compareVersions } from "@/util/checkVersion";
import { VERSION_THRESHOLDS } from '@/constants';
import { ParseRef } from "@/util/refParam";
import { loading, searchLinyapsByAppId } from '@/util/WorkerSearch';
import { StartLoading } from '@/util/ReflushLoading';
import { deepClone } from '@/util/clone';
import DiscussAreaDrawer from '@/components/DiscussAreaDrawer.vue'

import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();

// 路由传递的对象
const router = useRouter();
const route = useRoute();
const { menuName, name, zhName, icon, arch, appId, categoryName, description, devName } = route.query;

const drawer = ref(false);

// 格式化程序名称
const defaultName = computed(() => {
    return (zhName ? zhName : name) as string
});
// 格式化架构字段
const formatArch = computed(() => {
    if (arch && (arch as string).startsWith('[')) {
        return JSON.parse(arch as string).join(',');
    }
    return arch;
})
// 格式化文件大小
const formatSize = (row: any) => {
    // 显式检查 size 是否存在
    if (!row.size) return '';
    let size = Number(row.size);
    if (isNaN(size) || size === 0) return '';

    if (size < 1024) {
        return size.toFixed(2) + 'B';
    } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + 'KB';
    } else if (size < 1024 * 1024 * 1024) {
        return (size / (1024 * 1024)).toFixed(2) + 'MB';
    } else if (size < 1024 * 1024 * 1024 * 1024) {
        return (size / (1024 * 1024 * 1024)).toFixed(2) + 'GB';
    } else if (size < 1024 * 1024 * 1024 * 1024 * 1024) {
        return (size / (1024 * 1024 * 1024 * 1024)).toFixed(2) + 'TB';
    }
    return (size / (1024 * 1024 * 1024 * 1024 * 1024)).toFixed(2) + 'PB';
}
// 格式化下载量
function formatCount(row: any) {
    if (row.kind && row.kind != 'app') return '-';
    let installCount = row.installCount ? row.installCount : 0;
    return installCount + "次";
}
// 格式化上架时间
function formatUploadTime(row: any) {
    let uploadTime = row.createTime;
    if (!uploadTime) return '';
    const date = new Date(uploadTime);
    if (isNaN(date.getTime())) {
        return '';
    }
    return date.toISOString().split('T')[0]; // 做一些格式化处理并返回字符串
}
// 格式化运行环境
function formatRuntime(row: any) {
    const runtime = row.runtime;
    if (!runtime) return '';
    let packs = ParseRef(runtime);
    return `${packs.appId}/${packs.version}`; // 做一些格式化处理并返回字符串
};
// 发送卸载操作命令
const removeApp = (item: InstalledEntity) => {
    StartLoading(item); // 启动按钮的加载状态
    item.command = `ll-cli uninstall ${item.appId}/${item.version}`;
    ipcRenderer.send('linyaps-uninstall', deepClone(item));
}
// 安装点击事件
const installApp = async (item: any) => {
    // 判断正在安装队列应用数量，大于10条弹出提示框
    if (installingItemsStore.installingItemList.length >= 10) {
        ElNotification({ title: '提示', type: 'warning', duration: 500, message: '当前下载队列超过10条，请稍后操作...' });
        return;
    }
    // 大于等于1.7.0版本后，安装低版本会进行校验
    if (compareVersions(systemConfigStore.llVersion, VERSION_THRESHOLDS.UPDATE_LIST_SUPPORT) >= 0) {
        let tempList = installedItemsStore.installedItemList;
        let theAppIdList = tempList.filter(it => it.appId == item.appId);
        if (theAppIdList.length > 0) {
            for (let index = 0; index < theAppIdList.length; index++) {
                const element = theAppIdList[index];
                if (compareVersions(element.version, item.version) > 0) {
                    ElNotification({ title: '提示', type: 'warning', duration: 3000, message: '当前应用存在更高版本，若想安装低版本，请卸载高版本后操作...' });
                    return;
                }
            }
        }
    }
    StartLoading(item); // 启动按钮的加载状态
    // 新增到加载中列表
    installingItemsStore.addItem(item);
    ElNotification({ title: '提示', message: `正在安装${item.name}(${item.version})`, type: 'info', duration: 500 });
}

// 页面启动时加载
onMounted(async () => searchLinyapsByAppId(appId as string));

// 路由跳转离开前
onBeforeRouteLeave((to: any, from: any, next: any) => {
    const { meta: toMeta } = to;
    const { meta: fromMeta } = from;
    Object.keys(fromMeta).forEach((key) => toMeta[key] = fromMeta[key]);
    next();
})
</script>
<style scoped>
.details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding: 0 5px;
}

.back-button {
    font-size: 14px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
    transition: all 0.3s ease;
}

.back-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.base-container {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    margin-bottom: 3px;
    height: 30%;
    background-color: #6a6d7b;
    padding: 10px;
}

.title {
    color: var(--menu-base-font-color);
    border-radius: 5px;
    padding-bottom: 5px;
    font-weight: bold;
}

.version-table {
    width: 100%;
    border-radius: 5px;
    flex-grow: 1;
    border: 1px solid #DCDCDC;
}

.base-message {
    padding: 12px;
    background-color: white;
    border-radius: 5px;
    height: 75%;
}

.image-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    border-radius: 10px;
    background: radial-gradient(circle at 50% 50%, transparent, var(--base-color));
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    background-clip: padding-box;
    height: 100%;
}

.base-message-key {
    color: black;
    text-align: right;
    font-weight: bold;
}

.base-message-value {
    color: #213547;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.choose-version {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    height: calc(70% - 70px);
    background-color: #6a6d7b;
    padding: 10px;
}

.detail-btn {
    height: 24px;
    width: 70px;
    font-size: 14px;
    font-weight: bold;
    color: white;
    background-color: #6a6d7b;
    padding: 6px;
}

.install-btn {
    background-color: blue;
}

.uninstall-btn {
    background-color: red;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
    display: none;
}

@media (prefers-color-scheme: light) {
    .base-container {
        background-color: var(--base-color);
    }

    .choose-version {
        background-color: var(--base-color);
    }
}
</style>