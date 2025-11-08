<template>
    <div style="height: 100%;width: 100%;">
        <el-container style="height: 100%;">
            <el-aside>
                <el-menu :default-active="activeMenu" @select="handleMenuSelect">
                    <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index" @click="item.action">
                        <el-icon>
                            <component :is="item.icon" />
                        </el-icon>
                        <span class="menu-item-text">
                            {{ item.label }}
                            <!-- 若为更新程序菜单项且待更新数量大于 0，显示角标 -->
                            <template v-if="item.index === '4' && systemConfigStore.isShowUpdateTip && updateItemsStore.updateItemList.length > 0">
                                <sup class="update-badge">{{ updateItemsStore.updateItemList.length }}</sup>
                            </template>
                        </span>
                    </el-menu-item>
                </el-menu>
                <!-- 更多菜单项 -->
                <div class="fixed-button my-apps" @click="goMyApps">我的应用</div>
                <div class="fixed-button download-queue" @click="showQueue">下载队列</div>
                <NetworkSpeed />
            </el-aside>
            <!-- 这里将动态显示不同的功能页面 -->
            <el-main class="views">
                <router-view></router-view>
            </el-main>
            <DownloadQueue :show="show" :installingItems="installingItems" />
        </el-container>
    </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron';
import { onUnmounted, onMounted, ref, watch } from 'vue';
import NetworkSpeed from '@/components/NetworkSpeed.vue';
import DownloadQueue from '@/components/DownloadQueue.vue';
import { reflushUpdateItems, cancelUpdateTimer } from "@/util/WorkerUpdate";
import { reflushInstalledItems, cancelInstalledTimer } from '@/util/WorkerInstalled';
import { installingItems, setupIpcListeners, cleanupIpcListeners } from "@/util/IpcInstalled";
import { removeCustomProtocol, setupCustomProtocol } from '@/util/customProtocol';
import { StopLoading } from '@/util/ReflushLoading';
import { useInstallingItemsStore } from "@/store/installingItems";
import { useInstalledItemsStore } from '@/store/installedItems';
import { useUpdateItemsStore } from '@/store/updateItems';
import { useUpdateStatusStore } from "@/store/updateStatus";
import { useSystemConfigStore } from "@/store/systemConfig";
import router from '@/router';

const installingItemsStore = useInstallingItemsStore();
const installedItemsStore = useInstalledItemsStore();
const updateItemsStore = useUpdateItemsStore();
const updateStatusStore = useUpdateStatusStore();
const systemConfigStore = useSystemConfigStore();

let activeMenu = ref('1'); // 当前激活的菜单项
let show = ref(false); // 显示下载队列框

// 菜单项配置
const menuItems = [
    { index: "1", label: "玲珑推荐", icon: "Star", action: () => router.push({ path: '/welcome_menu' }) },
    { index: "2", label: "排行榜", icon: "Histogram", action: () => router.push({ path: '/ranking_menu' }) },
    { index: "3", label: "全部程序", icon: "HomeFilled", action: () => router.push({ path: '/all_app_menu' }) },
    { index: "4", label: "更新程序", icon: "UploadFilled", action: () => router.push({ path: '/update_menu' }) },
    { index: "5", label: "卸载程序", icon: "GobletSquareFull", action: () => router.push({ path: '/installed_menu' }) },
    { index: "6", label: "玲珑进程", icon: "Odometer", action: () => router.push({ path: '/runtime_menu' }) },
    { index: "7", label: "基础设置", icon: "setting", action: () => router.push({ path: '/config_menu' }) },
    { index: "8", label: "关于程序", icon: "InfoFilled", action: () => router.push({ path: '/about_menu' }) },
    //   { index: "998", label: "终端页面", icon: "InfoFilled", action: () => router.push({ path: '/terminalOutput' }) },
];

const handleMenuSelect = (index: string) => {
    activeMenu.value = index; // 设置当前激活的菜单项
};

const goMyApps = () => {
    router.push({ path: '/my_app_menu' });
    activeMenu.value = 'my-apps'; // 设置当前激活的菜单项
};

const showQueue = () => {
    show.value = !show.value; // 切换下载队列的显示状态
};

// 监听安装队列
watch(() => installingItemsStore.installingItemList, async (newQueue) => {
        ipcRenderer.send('logger', 'info', `安装队列变化>>${newQueue.length}`);
        if (updateStatusStore.downloadQueueStatus) return; // 如果正在处理，则不再处理新的队列变化
        if (newQueue.length > 0) {
            const item = newQueue[0];
            updateStatusStore.downloadQueueStatus = true; // 设置为正在处理状态
            let password = localStorage.getItem('linyaps-password'); // 获取密码
            ipcRenderer.send('linyaps-install', JSON.parse(JSON.stringify({ password, ...item })));
        }
    }, { deep: true, immediate: true }
);

// 页面初始化时执行
onMounted(() => {
    setupIpcListeners(); // 设置IPC监听器
    setupCustomProtocol(); // 自定义协议
    reflushInstalledItems(); // 启动时刷新已安装列表
    reflushUpdateItems(); // 启动时刷新可更新列表
    // 重置加载状态
    StopLoading(installedItemsStore.installedItemList);
});
// 页面销毁前执行
onUnmounted(() => {
    cleanupIpcListeners(); // 清理IPC监听器
    removeCustomProtocol(); // 自定义协议
    cancelInstalledTimer(); // 取消安装队列的定时器
    cancelUpdateTimer(); // 取消更新队列的定时器
});
</script>
<style>
.el-aside {
    width: 150px;
    margin: 12px 0 12px 12px;
    border-radius: 15px;
    position: relative;
}

.el-menu {
    height: 100%;
    border-right-style: none;
    overflow-y: hidden;
    background-color: var(--base-background-color);
}

.el-menu-item {
    position: relative;
    height: 45px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 10px;
    text-align: center;
    margin: 5px;
    color: var(--menu-base-font-color);
    background-color: var(--menu-base-color);
}

.menu-item-text {
    display: flex;
    align-items: center;
    justify-content: center;
}

.update-badge {
    position: absolute; /* 绝对定位，相对于父元素 .el-menu-item */
    top: -5px; /* 向上移动到菜单项的顶部 */
    right: -5px; /* 向右移动到菜单栏的边缘 */
    height: 18px;
    background-color: #ff4d4f; /* 角标背景色 */
    color: white; /* 角标文字颜色 */
    border-radius: 50%; /* 角标圆形样式 */
    padding: 4px 8px; /* 角标内边距 */
    font-size: 12px; /* 角标文字大小 */
    min-width: 10px; /* 确保角标有最小宽度 */
    text-align: center; /* 文字居中 */
    display: flex;
    align-items: center;
    justify-content: center;
    
}

.fixed-button {
    position: fixed;
    margin: 5px;
    width: 140px;
    height: 30px;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    color: var(--menu-base-font-color);
    background-color: var(--menu-base-color);
    border-radius: 10px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    cursor: pointer;
}

.fixed-button:hover {
    background-color: #999999;
}

.my-apps {
    bottom: 140px;
}

.download-queue {
    bottom: 99px;
}

.views {
    overflow: hidden;
    border-radius: 15px;
    margin: 12px;
    padding: 12px;
    position: relative;
    background-color: var(--base-background-color);
}
</style>