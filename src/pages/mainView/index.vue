<template>
    <div class="common-layout">
        <el-container>
            <el-aside>
                <el-menu :default-active="defaultActive">
                    <el-menu-item index="1" @click="toPage('/welcome_menu')">
                        <el-icon color="#D3D3D3">
                            <Star />
                        </el-icon>
                        <span>珑珑推荐</span>
                    </el-menu-item>
                    <el-menu-item index="6" @click="toPage('/ranking_menu')">
                        <el-icon color="#D3D3D3">
                            <Histogram />
                        </el-icon>
                        <span>排行榜</span>
                    </el-menu-item>
                    <el-menu-item index="2" @click="toPage('/all_app_menu')">
                        <el-icon color="#D3D3D3">
                            <HomeFilled />
                        </el-icon>
                        <span>全部程序</span>
                    </el-menu-item>
                    <el-menu-item index="3" @click="toPage('/installed_menu')">
                        <el-icon>
                            <GobletSquareFull />
                        </el-icon>
                        <span>卸载程序</span>
                    </el-menu-item>
                    <el-menu-item index="4" @click="toPage('/update_menu')">
                        <el-icon>
                            <UploadFilled />
                        </el-icon>
                        <span>更新程序</span>
                    </el-menu-item>
                    <el-menu-item index="5" @click="toPage('/runtime_menu')">
                        <el-icon>
                            <Odometer />
                        </el-icon>
                        <span>玲珑进程</span>
                    </el-menu-item>
                    <el-menu-item index="98" @click="toPage('/config_menu')">
                        <el-icon>
                            <setting />
                        </el-icon>
                        <span>基础设置</span>
                    </el-menu-item>
                    <el-menu-item index="99" @click="toPage('/about_menu')">
                        <el-icon>
                            <InfoFilled />
                        </el-icon>
                        <span>关于程序</span>
                    </el-menu-item>
                    <el-menu-item index="999" @click="toPage('/')" style="display: none;">
                        <el-icon>
                            <Loading />
                        </el-icon>
                        <span>返回首页</span>
                    </el-menu-item>
                </el-menu>
                <!-- 更多菜单项 -->
                <div class="download-queue" @click="showQueueBox = !showQueueBox">
                    <div class="download-btn">下载队列</div>
                </div>
                <div class="network-info">
                    <div class="network-info-title">当前实时网速</div>
                    <el-icon>
                        <Top />
                    </el-icon>上传速度: {{ uploadSpeed }}<br>
                    <el-icon>
                        <Bottom />
                    </el-icon>下载速度: {{ downloadSpeed }}
                </div>
            </el-aside>
            <el-main class="views">
                <!-- 这里将动态显示不同的功能页面 -->
                <router-view></router-view>
            </el-main>
            <transition name="el-zoom-in-left">
                <div v-show="showQueueBox" class="transition-queue-box">
                    <el-table :data="installingItemsStore.installingItemList" style="width: 100%;height: 100%;">
                        <el-table-column prop="name" label="名称" width="100" 
                            class-name="name-column" header-align="center" align="center">
                            <template #default="scope">
                                <el-tooltip class="item" effect="dark" :content=scope.row.name placement="top">  
                                    <span>{{ scope.row.name }}</span>  
                                </el-tooltip>
                            </template>
                        </el-table-column>
                        <el-table-column prop="version" label="版本" header-align="center" align="center" width="180" />
                        <el-table-column label="安装进度" header-align="center" align="center">
                            <template #default="scope">
                                <a v-if="compareVersions(systemConfigStore.linglongBinVersion,'1.5.0') >= 0 && scope.row.schedule != '-'">{{ scope.row.schedule }}</a>
                                <a v-else-if="compareVersions(systemConfigStore.linglongBinVersion,'1.5.0') >= 0 && scope.row.schedule == '-'">等待中...</a>
                                <a v-else>-</a>
                            </template>
                        </el-table-column>
                        <el-table-column fixed="right" label="操作" header-align="center" align="center" width="120">
                            <template #default="scope">
                                <el-button v-if="!scope.row.isInstalled && scope.row.loading && scope.row.schedule != '-'" loading>安装中...</el-button>
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
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import si from 'systeminformation';
import { compareVersions } from '@/util/checkVersion';
import { ElNotification } from 'element-plus'
import { CardFace,InstalledEntity } from '@/interface';
import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const updateItemsStore = useUpdateItemsStore();
const systemConfigStore = useSystemConfigStore();

// 默认菜单页签
const defaultActive = ref('1');
// 路由对象
const router = useRouter();
// 路由跳转
const toPage = (url: string) => router.push(url);
// 实时上传速度
const uploadSpeed = ref("0");
// 实时下载速度
const downloadSpeed = ref("0");
// 显示下载队列框
const showQueueBox = ref(false);
// 下载过程中状态标识
const flag = ref(true);
// 下载日志
let downloadLogMsg = "";
// 命令执行响应函数
const commandResult = (_event: any, res: any) => {
    const code = res.code;   // 返回命令执行状态
    const params = res.param;  // 返回命令执行入参参数
    const result = res.result;  // 返回命令执行结果
    const command: string = params.command;  // 返回执行的命令
    if (code != 'stdout') {
        ipcRenderer.send('logger', 'error', "\"" + command + "\"命令执行异常::" + result);
        // 网络异常，变更标识
        // systemConfigStore.changeNetworkRunStatus(false);
        return;
    }
    // 监听获取玲珑列表的命令
    if (command.startsWith('ll-cli list') && params.type && params.type == 'refreshInstalledApps') {
        if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
          installedItemsStore.initInstalledItemsOld(result);
        }
        if (command == 'll-cli list --json') {
          installedItemsStore.initInstalledItems(result);
        }
    }
    if (command.startsWith('ll-cli install') || command.startsWith('ll-cli uninstall')) {
        const installedEntity: InstalledEntity = params;
        installedEntity.isInstalled = false;
        // 移除加载中列表
        installingItemsStore.removeItem(installedEntity);
        if (command.startsWith('ll-cli install')) {
            installedEntity.isInstalled = true;
            installedItemsStore.addItem(installedEntity);
        } else {
            installedItemsStore.removeItem(installedEntity);
        }
        difVersionItemsStore.updateItemLoadingStatus(installedEntity, false);
        difVersionItemsStore.updateItemInstallStatus(installedEntity);
        // 更新全部应用列表
        const item: CardFace = params;
        item.isInstalled = command.startsWith('ll-cli install');
        allAppItemsStore.updateItemLoadingStatus(item, false); // 全部程序列表(新)-加载状态停止
        // 判断当前应用安装版本个数小于两个，才进行状态更新
        const app = installedItemsStore.installedItemList.findIndex(item => item.appId === params.appId);
        if ((app == -1 && command.startsWith('ll-cli uninstall')) || (app != -1 && command.startsWith('ll-cli install'))) {
            allAppItemsStore.updateItemInstallStatus(item); // 全部程序列表(新)-安装状态更新
        }
        // 移除需要更新的应用
        updateItemsStore.removeItem(item);
        // 检测当前环境
        const mode = import.meta.env.MODE as string;
        if (mode != "development") {
            // 非开发环境发送发送操作命令！
            let baseURL = import.meta.env.VITE_SERVER_URL as string;
            params.url = baseURL + "/visit/save";
            params.visitorId = systemConfigStore.visitorId;
            ipcRenderer.send('visit', params);
        }
        // 安装成功后，弹出通知
        const msg = command.startsWith('ll-cli install') ? '安装' : '卸载';
        ElNotification({
            title: msg + '成功!',
            message: params.name + '(' + params.version + ')被成功' + msg + '!',
            type: 'success',
            duration: 500,
        });
    }
}
const linglongResult = (_event: any, res: any) => {
    const params = res.param;                   // 要执行的命令的入参对象
    const code: string = res.code;              // 执行命令返回的状态码
    const command: string = params.command;     // 执行的命令
    const result: string = res.result;          // 执行命令返回的结果
    downloadLogMsg += result + '<br>';
    if ('close' == code) {
        const installedEntity: InstalledEntity = params;
        // 1.从加载列表中移除
        installingItemsStore.removeItem(installedEntity);
        // 2.关闭各个列表中的加载状态
        allAppItemsStore.updateItemLoadingStatus(installedEntity, false);
        installedItemsStore.updateItemLoadingStatus(installedEntity, false);
        difVersionItemsStore.updateItemLoadingStatus(installedEntity, false);
        if (flag.value) {
            // 3.获取安装/卸载状态
            installedEntity.isInstalled = command.startsWith('ll-cli install');
            // 4.更新各个列表中的安装状态
            // 判断当前应用安装版本个数小于两个，才进行状态更新
            const app = installedItemsStore.installedItemList.findIndex(item => item.appId === params.appId);
            if ((app == -1 && command.startsWith('ll-cli uninstall')) || (app != -1 && command.startsWith('ll-cli install'))) {
                allAppItemsStore.updateItemInstallStatus(installedEntity);
            }
            if (command.startsWith('ll-cli install')) {
                installedItemsStore.addItem(installedEntity);
            } else {
                installedItemsStore.removeItem(installedEntity);
            }
            difVersionItemsStore.updateItemInstallStatus(installedEntity);
            // 检测当前环境
            const mode = import.meta.env.MODE as string;
            if (mode != "development") {
                // 非开发环境发送发送操作命令！
                let baseURL = import.meta.env.VITE_SERVER_URL as string;
                params.url = baseURL + "/visit/save";
                params.visitorId = systemConfigStore.visitorId;
                ipcRenderer.send('visit', params);
            }
            // 安装成功后，弹出通知
            const msg = command.startsWith('ll-cli install') ? '安装' : '卸载';
            ElNotification({
                title: msg + '成功!',
                message: params.name + '(' + params.version + ')被成功' + msg + '!',
                type: 'success',
                duration: 500,
            });
        } else {
            ElNotification({
                title: '操作异常!',
                message: downloadLogMsg,
                type: 'error',
                duration: 5000,
                dangerouslyUseHTMLString: true
            });
            flag.value = true;
        }
        downloadLogMsg = ""; // 清除当前程序安装的日志记录
    }
    if ('stdout' == code) {
        // "[K[?25l0% prepare installing main:app.web.baidu.map/0.9.1.2/x86_64[?25h"
        if (result.toLowerCase().includes('error')) {
            flag.value = false;
        }
        const aaa = res.result.replace('[K[?25l','').replace('[?25h','');
        const schedule = aaa.split(' ')[0];
        installingItemsStore.updateItemSchedule(params as InstalledEntity, schedule);
    }
}
// 终止安装点击事件
const cancelInstall = (row: any) => {
    ipcRenderer.send('stop-linglong',{ ...row });
    installingItemsStore.removeItem(row);
    // 关闭各个列表中的加载状态
    installedItemsStore.updateItemLoadingStatus(row, false);
    difVersionItemsStore.updateItemLoadingStatus(row, false);
    allAppItemsStore.updateItemLoadingStatus(row, false);
}
// 网卡网速检测函数
function initNetStatus() {
    si.networkStats().then((data: { [x: string]: any; }) => {
        // 假设我们使用的是第一个网络接口
        const iface = Object.keys(data)[0];
        const networkData = data[iface];
        // 设置两个变量来跟踪之前的接收和发送的字节数
        let prevInBytes = networkData.tx_bytes;
        let prevOutBytes = networkData.rx_bytes;
        // 每隔一定时间计算网速
        setInterval(() => {
            si.networkStats().then((data: { [x: string]: any; }) => {
                const networkData = data[iface];
                const inBytes = networkData.tx_bytes;
                const outBytes = networkData.rx_bytes;
                // 计算两次间隔的字节数差异
                const inDiff = inBytes - prevInBytes;
                const outDiff = outBytes - prevOutBytes;
                // 更新之前的字节数
                prevInBytes = inBytes;
                prevOutBytes = outBytes;
                // 转换为KB/s
                const inSpeed = (inDiff / 1024);
                const outSpeed = (outDiff / 1024);
                //当速度超过1024时，则以MB/s为单位
                if (inSpeed > 1024) {
                    uploadSpeed.value = (inSpeed / 1024).toFixed(2) + ' MB/s';
                } else {
                    uploadSpeed.value = inSpeed.toFixed(2) + ' KB/s';
                }
                if (outSpeed > 1024) {
                    downloadSpeed.value = (outSpeed / 1024).toFixed(2) + ' MB/s';
                } else {
                    downloadSpeed.value = outSpeed.toFixed(2) + ' KB/s';
                }
            });
        }, 1000); // 每1000毫秒计算一次网速
    });
}

// 页面初始化时执行
onMounted(() => {
    // 监听命令执行结果
    ipcRenderer.on('command-result', commandResult);
    ipcRenderer.on('linglong-result', linglongResult);
    // 获取网络接口信息 获取实时网速
    initNetStatus();
});
// 页面销毁前执行
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
    ipcRenderer.removeListener('linglong-result', linglongResult);
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
    background-color: #6418b9;
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

.name-column .cell{
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
</style>