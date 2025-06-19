<template>
    <div class="common-layout">
        <el-container>
            <el-aside>
                <el-menu :default-active="defaultActive">
                    <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index" @click="item.action" :style="item.style">
                        <el-icon><component :is="item.icon" /></el-icon>
                        <span>{{ item.label }}</span>
                    </el-menu-item>
                </el-menu>
                <!-- 更多菜单项 -->
                <div class="download-queue" @click="showQueueBox = !showQueueBox">
                    <div class="download-btn">下载队列</div>
                </div>
                <div class="network-info">
                    <div class="network-info-title">当前实时网速</div>
                    <el-icon><Top /></el-icon>上传速度: {{ uploadSpeed }}<br>
                    <el-icon><Bottom /></el-icon>下载速度: {{ downloadSpeed }}
                </div>
            </el-aside>
            <!-- 这里将动态显示不同的功能页面 -->
            <el-main class="views">
                <router-view></router-view>
            </el-main>
            <!-- 下载队列弹框 -->
            <transition name="el-zoom-in-left">
                <div v-show="showQueueBox" class="transition-queue-box">
                    <el-table :data="installingItemsStore.installingItemList" border stripe style="width: 100%;height: 100%;">
                        <el-table-column label="安装进度" header-align="center" align="center" width="120" show-overflow-tooltip>
                            <template #default="scope">
                                <a v-if="showSchedule(scope.row)">{{ scope.row.schedule }}</a>
                                <a v-else-if="waitingSchedule(scope.row)">等待中...</a>
                                <a v-else>-</a>
                            </template>
                        </el-table-column>
                        <el-table-column prop="name" label="名称" header-align="center" align="center" show-overflow-tooltip/>
                        <el-table-column prop="version" label="版本" header-align="center" align="center" width="160" show-overflow-tooltip/>
                        <el-table-column fixed="right" label="操作" header-align="center" align="center" width="120">
                            <template #default="scope">
                                <el-button v-if="isInstalling(scope.row)" loading>安装中...</el-button>
                                <el-button v-else @click="cancelInstall(scope.row)" type="danger" size="small">取消安装</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </transition>
        </el-container>
    </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron';
import { onUnmounted, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { compareVersions } from '@/util/checkVersion';
import { ElNotification } from 'element-plus'
import { CardFace,InstalledEntity } from '@/interface';
// 引入网络组件 获取网络接口信息 获取实时网速
import { useNetworkSpeed } from '@/util/network'; 

import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const { uploadSpeed, downloadSpeed } = useNetworkSpeed();
const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();
// 路由对象
const router = useRouter();
// 默认菜单页签
const defaultActive = ref('1');
// 基础服务器地址
let baseURL = import.meta.env.VITE_SERVER_URL as string;
// 当前环境
const env = import.meta.env.MODE as string;
// 显示下载队列框
const showQueueBox = ref(false);
// 下载过程中状态标识
const flag = ref(true);
// 下载日志
let downloadLogMsg = "";

// 菜单项配置
const menuItems = [
  { index: "1", label: "玲珑推荐", icon: "Star", action: () => router.push({ path: '/welcome_menu' }) },
  { index: "6", label: "排行榜", icon: "Histogram", action: () => router.push({ path: '/ranking_menu' }) },
  { index: "2", label: "全部程序", icon: "HomeFilled", action: () => router.push({ path: '/all_app_menu' }) },
  { index: "3", label: "卸载程序", icon: "GobletSquareFull", action: () => router.push({ path: '/installed_menu' }) },
  { index: "4", label: "更新程序", icon: "UploadFilled", action: () => router.push({ path: '/update_menu' }) },
  { index: "5", label: "玲珑进程", icon: "Odometer", action: () => router.push({ path: '/runtime_menu' }) },
  { index: "98", label: "基础设置", icon: "setting", action: () => router.push({ path: '/config_menu' }) },
  { index: "99", label: "关于程序", icon: "InfoFilled", action: () => router.push({ path: '/about_menu' }) },
  { index: "999", label: "返回首页", icon: "Loading", action: () => router.push({ path: '/' }), style: "display: none;" }
];

// 队列表格辅助函数
const showSchedule = (row: any) =>
  compareVersions(systemConfigStore.linglongBinVersion, '1.5.0') >= 0 && row.schedule !== '-';
const waitingSchedule = (row: any) =>
  compareVersions(systemConfigStore.linglongBinVersion, '1.5.0') >= 0 && row.schedule === '-';
const isInstalling = (row: any) =>
  !row.isInstalled && row.loading && row.schedule !== '-';

// 命令执行响应函数
const handleCommandResult = (_event: any, res: any) => {
    const { param: params, result, code } = res;
    const command: string = params.command;  // 返回执行的命令
    if (code != 'stdout') {
        ipcRenderer.send('logger', 'error', `"${command}"命令执行异常::${result}`);
        return;
    }
    // 监听获取玲珑列表的命令
    if (params.type == 'refreshInstalledApps') {
        if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
          installedItemsStore.initInstalledItemsOld(result);
        }
        if (command.startsWith('ll-cli --json list')) {
          installedItemsStore.initInstalledItems(result);
        }
    }
    if (command.startsWith('ll-cli install') || command.startsWith('ll-cli uninstall')) {
        handleInstallUninstall(params, command, result);
    }
}

function handleInstallUninstall(params: any, command: string, result: string) {
    // 移除加载中列表
    installingItemsStore.removeItem(params);
    // 获取安装/卸载状态
    params.isInstalled = command.startsWith('ll-cli install');
    if (params.isInstalled) {
        installedItemsStore.addItem(params);
    } else {
        installedItemsStore.removeItem(params);
    }
    difVersionItemsStore.updateItemLoadingStatus(params, false);
    difVersionItemsStore.updateItemInstallStatus(params);
    // 更新全部应用列表
    allAppItemsStore.updateItemLoadingStatus(params, false); // 全部程序列表(新)-加载状态停止
    // 全部应用列表(判断当前应用安装版本个数小于两个，才进行状态更新)
    let installedItems = installedItemsStore.installedItemList;
    let filteredItems = installedItems.filter((item: InstalledEntity) => item.appId === params.appId);
    if (filteredItems.length < 2) {
        allAppItemsStore.updateItemInstallStatus(params);
    }
    // 移除需要更新的应用
    updateItemsStore.removeItem(params);
    // 非开发环境发送发送操作命令！
    if (env != "development") {
        params.url = `${baseURL}/visit/save`;
        params.visitorId = systemConfigStore.visitorId;
        params.clientIp = systemConfigStore.clientIP;
        ipcRenderer.send('visit', params);
    }
    // 安装或卸载成功后，弹出通知
    ElNotification({
        title: params.isInstalled ? '安装成功!' : '卸载成功!',
        type: 'success',
        duration: 500,
        message: `${params.name}(${params.version})被成功${params.isInstalled ? '安装' : '卸载'}!`
    });
    // 1.刷新一下已安装列表，根据版本环境获取安装程序列表发送命令
    let getInstalledItemsCommand = "ll-cli --json list";
    if (compareVersions(systemConfigStore.llVersion, "1.3.99") < 0) {
        getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'";
    } else if (compareVersions(systemConfigStore.linglongBinVersion, "1.5.0") >= 0 && systemConfigStore.isShowBaseService) {
        getInstalledItemsCommand = "ll-cli --json list --type=all";
    }
    ipcRenderer.send('command', { command: getInstalledItemsCommand, type: 'refreshInstalledApps' });
    // 刷新版本列表
    ipcRenderer.send('reflush-version-list', params.appId);
}

const handleLinglongResult = (_event: any, res: any) => {
    const { param: params, code, command, result } = res;
    downloadLogMsg += result + '<br>';
    if (code == 'close') {
        // 1.从加载列表中移除
        installingItemsStore.removeItem(params);
        // 2.关闭各个列表中的加载状态
        allAppItemsStore.updateItemLoadingStatus(params, false);
        installedItemsStore.updateItemLoadingStatus(params, false);
        difVersionItemsStore.updateItemLoadingStatus(params, false);
        if (flag.value) {
            // 3.获取安装/卸载状态
            params.isInstalled = command.startsWith('ll-cli install');
            // 4.更新各个列表中的安装状态
            if (params.isInstalled) {
                installedItemsStore.addItem(params);
            } else {
                installedItemsStore.removeItem(params);
            }
            // 全部应用列表(判断当前应用安装版本个数小于两个，才进行状态更新)
            let installedItems = installedItemsStore.installedItemList;
            let filteredItems = installedItems.filter((item: InstalledEntity) => item.appId === params.appId);
            if (filteredItems.length < 2) {
                allAppItemsStore.updateItemInstallStatus(params);
            }
            difVersionItemsStore.updateItemInstallStatus(params);
            // 非开发环境发送发送操作命令！
            if (env != "development") {
                params.url = `${baseURL}/visit/save`;
                params.visitorId = systemConfigStore.visitorId;
                params.clientIp = systemConfigStore.clientIP;
                ipcRenderer.send('visit', params);
            }
            // 安装或卸载成功后，弹出通知
            ElNotification({
                title: params.isInstalled ? '安装成功!' : '卸载成功!',
                type: 'success',
                duration: 500,
                message: `${params.name}(${params.version})被成功${params.isInstalled ? '安装' : '卸载'}!`
            });
            // 1.刷新一下已安装列表，根据版本环境获取安装程序列表发送命令
            let getInstalledItemsCommand = "ll-cli --json list";
            if (compareVersions(systemConfigStore.llVersion, "1.3.99") < 0) {
                getInstalledItemsCommand = "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'";
            } else if (compareVersions(systemConfigStore.linglongBinVersion, "1.5.0") >= 0 && systemConfigStore.isShowBaseService) {
                getInstalledItemsCommand = "ll-cli --json list --type=all";
            }
            ipcRenderer.send('command', { command: getInstalledItemsCommand, type: 'refreshInstalledApps' });
            // 刷新版本列表
            ipcRenderer.send('reflush-version-list', params.appId);
        } else {
            ElNotification({ title: '操作异常!', message: downloadLogMsg, type: 'error', duration: 5000, dangerouslyUseHTMLString: true });
            flag.value = true;
        }
        downloadLogMsg = ""; // 清除当前程序安装的日志记录
    }
    if (code == 'stdout') {
        // "[K[?25l0% prepare installing main:app.web.baidu.map/0.9.1.2/x86_64[?25h"
        if (result.toLowerCase().includes('error')) {
            flag.value = false;
        }
        let schedule = '';
        if (compareVersions(systemConfigStore.llVersion,'1.7.0') >= 0) {
            let maohao = result.lastIndexOf(':');
            let baifenhao = result.lastIndexOf('%');
            schedule = result.substring(maohao + 1, baifenhao + 1);
        } else {
            schedule = result.replace('[K[?25l','').replace('[?25h','').split(' ')[0];
        }
        installingItemsStore.updateItemSchedule(params as InstalledEntity, schedule);
    }
}
// 终止安装点击事件
const cancelInstall = (row: InstalledEntity) => {
    ipcRenderer.send('stop-linglong',{ ...row });
    installingItemsStore.removeItem(row);
    // 关闭各个列表中的加载状态
    installedItemsStore.updateItemLoadingStatus(row, false);
    difVersionItemsStore.updateItemLoadingStatus(row, false);
    allAppItemsStore.updateItemLoadingStatus(row, false);
}

// let timer = setInterval(() => {
//     console.log('定时器执行，检查是否有需要更新的应用...');
//     // 检查当前系统有哪些应用
//     if (compareVersions(systemConfigStore.linglongBinVersion, '1.5.0') >= 0) {
//         ipcRenderer.send('command', { command: 'll-cli --json list --type=all', type: 'refreshInstalledApps' });
//     } else {
//         ipcRenderer.send('command', { command: 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'', type: 'refreshInstalledApps' });
//     }
// }, 3000);

// 页面初始化时执行
onMounted(() => {
    // 监听命令执行结果
    ipcRenderer.on('command-result', handleCommandResult);
    ipcRenderer.on('linglong-result', handleLinglongResult);
    // 监听自定义协议
    ipcRenderer.on('custom-protocol', (_event: any, res: any) => {
        ipcRenderer.send('logger', 'info', `接收到了自定义协议的消息：${res}`);
        // 在应用中间弹出通知，接收到了自定义协议的消息
        ElNotification({ title: '自定义协议消息', message: `接收到了自定义协议的消息：${res}`, type: 'success', duration: 5000 });
    });
});
// 页面销毁前执行
onUnmounted(() => {
    ipcRenderer.removeListener('command-result', handleCommandResult);
    ipcRenderer.removeListener('linglong-result', handleLinglongResult);
    // clearInterval(timer);
});
</script>
<style>
.common-layout {
    height: 100%;
    width: 100%;
}

.el-container {
    height: 100%;
}

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
    height: 45px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 10px;
    text-align: center;
    margin: 5px;
    color: var(--menu-base-font-color);
    background-color: var(--menu-base-color);
}

.download-queue {
    position: fixed;
    bottom: 99px;
    margin: 5px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    text-align: center;
    width: 140px;
    height: 30px;
    background-color: var(--menu-base-color);
}

.download-queue:hover {
    background-color: #999999;
    cursor: pointer;
}

.download-btn {
    font-size: 14px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    flex-direction: column;
    color: var(--menu-base-font-color);
}

.network-info {
    position: fixed;
    border-radius: 15px;
    text-align: center;
    margin: 5px;
    bottom: 12px;
    font-size: 12px;
    height: 75px;
    width: 140px;
    color: var(--menu-base-font-color);
    background-color: var(--menu-base-color);
}

.network-info-title {
    font-size: 14px;
    font-weight: bold;
    margin: 3px;
    color: var(--menu-base-font-color);
}

.views {
    overflow: hidden;
    border-radius: 15px;
    margin: 12px;
    padding: 12px;
    position: relative;
    background-color: var(--base-background-color);
}

.transition-queue-box {
    z-index: 3;
    position: fixed;
    bottom: 12px;
    left: 175px;
    padding: 6px;
    box-sizing: border-box;
    text-align: center;
    height: 28%;
    width: 38%;
    border-radius: 12px;
    background: radial-gradient(circle at 50% 50%, transparent, var(--base-color));
}

</style>