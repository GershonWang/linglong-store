<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item class="firstMenu" @click="router.back">{{ query.menuName }}</el-breadcrumb-item>
        <el-breadcrumb-item class="secondMenu">{{ query.name }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="base-container">
        <div class="title">参数信息</div>
        <div class="base-message">
            <div class="image-div">
                <img v-lazy="query.icon" alt="程序图标" width="120px" height="120px" />
            </div>
            <div style="width: 100%;height: 100%;color: #606274;">
                <div class="soft">
                    <div><span class="soft-title">程序名称：</span>{{ query.name }}</div>
                    <div v-if="query.zhName"><span class="soft-title">程序中文名称：</span>{{ query.zhName }}</div>
                </div>
                <div class="soft">
                    <div><span class="soft-title">AppID：</span>{{ query.appId }}</div>
                    <div><span class="soft-title">架构：</span>{{ query.arch }}</div>
                </div>
                <div class="soft-js">
                    <div class="soft-title">简述：</div>
                    <div class="soft-description">{{ query.description }}</div>
                </div>
            </div>
        </div>
    </div>
    <div class="choose-version">
        <div class="title">版本选择</div>
        <el-table :data="difVersionItemsStore.difVersionItemList" style="width: 100%;border-radius: 5px;flex-grow: 1;">
            <el-table-column prop="version" label="版本号" width="120" />
            <el-table-column prop="runtime" label="运行环境" header-align="center" align="center" width="240"
                :formatter="formatRuntime" />
            <el-table-column prop="description" label="描述" />
            <el-table-column fixed="right" label="操作" header-align="center" align="center" width="160">
                <template #default="scope">
                    <!-- 卸载按钮 -->
                    <el-button class="uninstall-btn" v-if="scope.row.isInstalled && !scope.row.loading"
                        @click="changeStatus(scope.row, 'uninstall')">卸载</el-button>
                    <el-button v-if="scope.row.isInstalled && scope.row.loading" loading>卸载中</el-button>
                    <!-- 运行按钮 -->
                    <el-button class="run-btn"
                        v-if="scope.row.isInstalled && !scope.row.loading && scope.row.kind == 'app'"
                        @click="toRun(scope.row)">运行</el-button>
                    <!-- 安装按钮 -->
                    <el-button class="install-btn"
                        v-if="!scope.row.isInstalled && !scope.row.loading && scope.row.kind == 'app'"
                        @click="changeStatus(scope.row, 'install')">安装</el-button>
                    <el-button v-if="!scope.row.isInstalled && scope.row.loading" loading>安装中</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import { ipcRenderer } from 'electron';
import { CardFace } from '@/interface';
import { onBeforeRouteLeave } from 'vue-router';
import { ElNotification, TableColumnCtx } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import hasUpdateVersion from "@/util/checkVersion";

import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useWelcomeItemsStore } from "@/store/welcomeItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import elertTip from "@/util/NetErrorTips";
import si from 'systeminformation';
import { useRouter } from 'vue-router';

const router = useRouter();

const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const welcomeItemsStore = useWelcomeItemsStore();
const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();
// 路由传递的对象
const query = router.currentRoute.value.query;
// 格式化运行时字段
function formatRuntime(row: any, _column: TableColumnCtx<any>, _cellValue: any, _index: number) {
    const runtime = row.runtime;
    if (!runtime) return '';
    const values: string[] = (runtime as string).split("/");
    const value = values.length > 2 ? values[0] + "/" + values[1] : values[0];
    return value; // 做一些格式化处理并返回字符串
};
// 操作按钮的点击事件
const changeStatus = async (item: any, flag: string) => {
    // 启用加载框
    allServItemsStore.updateItemLoadingStatus(item, true);
    installedItemsStore.updateItemLoadingStatus(item, true);
    difVersionItemsStore.updateItemLoadingStatus(item, true);
    welcomeItemsStore.updateItemLoadingStatus(item, true);
    // 新增到加载中列表
    installingItemsStore.addItem(item);
    // 根据flag判断是安装还是卸载
    let message: string = '正在安装' + item.name + '(' + item.version + ')';
    let command: string = 'll-cli install ' + item.appId + '/' + item.version;
    if (flag == 'uninstall') {
        message = '正在卸载' + item.name + '(' + item.version + ')';
        command = 'll-cli uninstall ' + item.appId + '/' + item.version;
    }
    // 从所有程序列表中捞取程序图标icon
    const allItems = allServItemsStore.allServItemList;
    const findItem = allItems.find(it => it.appId == item.appId && it.name == item.name);
    // 发送操作命令
    const commandParams = {
        ...item,
        icon: findItem ? findItem.icon : '',
        command: command,
        loading: false,
    }
    ipcRenderer.send('command', commandParams);
    // 弹出提示框
    ElNotification({
        title: '提示',
        message: message,
        type: 'info',
        duration: 500,
    });
    if (flag == 'install') {
        // 获取下载进度
        simulateDownload();
    }
}
// 模拟下载函数，每隔一段时间计算并打印下载进度，直至下载完成
function simulateDownload() {
    // 假设我们使用的是第一个网络接口
    si.networkStats().then((data: { [x: string]: any; }) => {
        // 假设我们使用的是第一个网络接口
        const iface = Object.keys(data)[0];
        const networkData = data[iface];
        let beforeOutBytes = networkData.rx_bytes;
        let downloadedBytes = 0;
        const interval = 1000; // 1秒
        let timerId = setInterval(() => {
            si.networkStats().then((data1: { [x: string]: any }) => {
                const iface = Object.keys(data1)[0];
                const networkData = data1[iface];
                const outBytes = networkData.rx_bytes;
                console.log('outBytes', outBytes);
                // 计算两次间隔的字节数差异
                downloadedBytes += outBytes - beforeOutBytes;
                beforeOutBytes = outBytes; // 更新已下载的字节数
                // 计算下载进度
                const fileSizeInBytes = query.size ? query.size as unknown as number : 0;
                console.log('fileSize', fileSizeInBytes);
                const progress = (downloadedBytes / fileSizeInBytes) * 100;
                console.log(`下载进度: ${progress.toFixed(2)}%`);
                if (progress >= 100) {
                    console.log('下载完成');
                    clearInterval(timerId);
                }
            });
        }, interval);
    });
}
// 运行按钮
const toRun = (item: CardFace) => {
    // 发送操作命令
    let commandParams = {
        ...item,
        command: 'll-cli run ' + item.appId + '/' + item.version,
        loading: false,
    }
    ipcRenderer.send('command', commandParams);
    // 弹出运行提示框
    ElNotification({
        title: '提示',
        message: item.name + '(' + item.version + ')即将被启动！',
        type: 'info',
        duration: 500,
    });
}
// 页面启动时加载
onMounted(() => {
    // 清除表单数据
    difVersionItemsStore.clearItems();
    // 检测网络
    elertTip();
    // 初始化数据：发送命令到主线程获取版本列表结果
    let command = "ll-cli query " + query.appId;
    if (hasUpdateVersion('1.3.99', systemConfigStore.llVersion) == 1) {
        command = "ll-cli search " + query.appId + " --json";
    }
    ipcRenderer.send("command", { 'command': command });
    ipcRenderer.once('command-result', (_event: any, res: any) => {
        const command: string = res.param.command;
        if (command.startsWith('ll-cli query') || command.startsWith('ll-cli search')) {
            if (command.startsWith("ll-cli query") && 'stdout' == res.code) {
                difVersionItemsStore.initDifVersionItemsOld(res.result, query);
            }
            if (command.startsWith("ll-cli search") && 'stdout' == res.code) {
                difVersionItemsStore.initDifVersionItems(res.result, query);
            }
        }
    });
})
// 路由跳转离开前
onBeforeRouteLeave((to: any, from: any, next: any) => {
    const { meta: toMeta } = to;
    const { meta: fromMeta } = from;
    Object.keys(fromMeta).forEach((key) => {
        toMeta[key] = fromMeta[key];
    });
    next();
})
</script>
<style scoped>
.el-breadcrumb {
    height: 25px;
}

.firstMenu :deep(.el-breadcrumb__inner) {
    color: white;
    cursor: pointer;
    font-weight: bold;
    font-size: 16px;
}

.secondMenu :deep(.el-breadcrumb__inner) {
    color: #999999;
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

.choose-version {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    height: 60%;
    background-color: #6a6d7b;
    padding: 10px;
}

.title {
    background-color: #6a6d7b;
    border-radius: 5px;
    padding-bottom: 5px;
    font-weight: bold;
}

.base-message {
    flex-grow: 1;
    padding: 12px;
    display: flex;
    background-color: white;
    border-radius: 5px;
    height: 30%;
}

.image-div {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 23%;
}

.soft {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.soft-js {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 60%;
}

.soft-title {
    font-size: 18px;
    color: #0E0101;
    font-weight: bold;
}

.soft-description {
    overflow: auto;
    height: 100%;
    width: 93%;
}

.install-btn {
    background-color: blue;
    color: white;
    padding: 6px;
    height: 24px;
}

.uninstall-btn {
    background-color: red;
    color: white;
    padding: 6px;
    height: 24px;
}

.run-btn {
    background-color: #5F9EA0;
    color: white;
    padding: 6px;
    height: 24px;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
    display: none;
}

@media (prefers-color-scheme: light) {
    .firstMenu :deep(.el-breadcrumb__inner) {
        color: #000;
    }

    .base-container {
        color: #DCDCDC;
    }

    .title {
        color: #DCDCDC;
    }
}
</style>