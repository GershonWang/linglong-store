<template>
    <div class="common-layout">
        <el-container>
            <el-aside>
                <el-menu default-active="1">
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
                    <el-menu-item index="2" @click="toPage('/all_serv_menu')">
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
                        <el-table-column prop="name" label="名称" header-align="center" align="center" width="180" />
                        <el-table-column prop="version" label="版本" header-align="center" align="center" width="180" />
                        <el-table-column fixed="right" label="操作" header-align="center" align="center" width="120">
                            <template #default="scope">
                                <!-- 安装按钮 -->
                                <el-button v-if="!scope.row.isInstalled && scope.row.loading" loading>安装中</el-button>
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
import { ElNotification } from 'element-plus'
import { CardFace } from '@/interface/CardFace';
import { InstalledEntity } from '@/interface/InstalledEntity';
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useWelcomeItemsStore } from "@/store/welcomeItems";
import { useInstallingItemsStore } from "@/store/installingItems";

const installedItemsStore = useInstalledItemsStore();
const allServItemsStore = useAllServItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const welcomeItemsStore = useWelcomeItemsStore();
const installingItemsStore = useInstallingItemsStore();
// 路由对象
const router = useRouter();
// 路由跳转
const toPage = (url: string) => router.push(url);
// 重试次数
let retryNum = ref(0);
// 实时上传速度
const uploadSpeed = ref("0");
// 实时下载速度
const downloadSpeed = ref("0");
// 显示下载队列框
const showQueueBox = ref(false);
// 命令执行响应函数
const commandResult = (_event: any, res: any) => {
    const params = res.param;
    const code: string = res.code;
    if ('stdout' != code) {
        if (retryNum.value <= 3) {
            retryNum.value++;
            ipcRenderer.send('command', params);
        } else {
            retryNum.value = 0;
            // 执行异常时，停止相关的加载状态
            installingItemsStore.removeItem(params as InstalledEntity);
            allServItemsStore.updateItemLoadingStatus(params as InstalledEntity, false);
            installedItemsStore.updateItemLoadingStatus(params as InstalledEntity, false);
            difVersionItemsStore.updateItemLoadingStatus(params as InstalledEntity, false);
            welcomeItemsStore.updateItemLoadingStatus(params as InstalledEntity, false);
            // 弹框提示
            ElNotification({
                title: '请求错误',
                message: '命令执行异常！',
                type: 'error',
                duration: 500,
            });
        }
        return;
    }
    // 返回结果 - 当前执行安装的应用信息
    const command: string = params.command;
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
        welcomeItemsStore.updateItemLoadingStatus(installedEntity, false);
        difVersionItemsStore.updateItemInstallStatus(installedEntity);
        welcomeItemsStore.updateItemInstallStatus(installedEntity);
        // 更新全部应用列表
        const item: CardFace = params;
        item.isInstalled = command.startsWith('ll-cli install');
        allServItemsStore.updateItemLoadingStatus(item, false);
        // 判断当前应用安装版本个数小于两个，才进行状态更新
        const app = installedItemsStore.installedItemList.findIndex(item => item.appId === params.appId);
        if ((app == -1 && command.startsWith('ll-cli uninstall')) || (app != -1 && command.startsWith('ll-cli install'))) {
            allServItemsStore.updateItemInstallStatus(item);
        }
        // 发送操作命令
        let baseURL = import.meta.env.VITE_SERVER_URL as string;
        params.url = baseURL + "/visit/save";
        ipcRenderer.send('visit', params);
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
// 获取实时网速
const getNetworkSpeed = () => {
    // 获取网络接口信息
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
    getNetworkSpeed();
    // 监听命令执行结果
    ipcRenderer.on('command-result', commandResult);
});
// 页面销毁前执行
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult)
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
    background-color: #6e6e6e2e;
}

.el-menu-item {
    height: 45px;
    color: white;
    font-size: 12px;
    font-weight: bold;
    border-radius: 10px;
    background-color: #6E6E6E;
    text-align: center;
    margin: 5px;
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
    background: radial-gradient(circle at 50% 50%, transparent, #E2AB5F);
}

.download-btn {
    color: #ffffff;
    font-size: 14px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    flex-direction: column;
}

.download-queue:hover {
    background-color: #6418b9;
    cursor: pointer;
}

.network-info {
    position: fixed;
    border-radius: 15px;
    text-align: center;
    margin: 5px;
    bottom: 12px;
    font-size: 12px;
    background-color: #c1c1c1;
    height: 75px;
    width: 140px;
    color: #000;
}

.network-info-title {
    font-size: 14px;
    font-weight: bold;
    color: #a12f2f;
    margin: 3px;
}

.views {
    background-color: #2D2F2F;
    overflow: hidden;
    border-radius: 15px;
    margin: 12px;
    padding: 12px;
    position: relative;
}

.transition-queue-box {
    border-radius: 10px;
    background-color: #335061;
    text-align: center;
    color: #fff;
    padding: 20px 15px;
    box-sizing: border-box;
    position: fixed;
    bottom: 12px;
    left: 175px;
    height: 25%;
    width: 30%;
    z-index: 9;
}

@media (prefers-color-scheme: light) {
    .el-menu-item {
        color: #0e0101;
        background-color: #6e6e6e2e;
    }

    .views {
        background-color: #2d2f2f2b;
    }

    .download-btn {
        color: #675e5b;
    }

    .download-btn:hover {
        color: #ffffff;
    }

    .transition-queue-box {
        background: radial-gradient(circle at 50% 50%, transparent, #E2AB5F);
    }
}
</style>