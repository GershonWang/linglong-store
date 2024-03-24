<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item class="firstMenu" @click="router.back">{{ query.menuName }}</el-breadcrumb-item>
        <el-breadcrumb-item class="secondMenu">{{ query.name }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="baseContainer">
        <div class="title">参数信息</div>
        <div class="baseMessage">
            <div class="imageDiv">
                <img v-lazy="query.icon" alt="程序图标" width="120px" height="120px" />
            </div>
            <div style="width: 80%;color: #606274;">
                <div class="soft">
                    <div><span class="softTitle">应用程序名称：</span>{{ query.name }}</div>
                    <div><span class="softTitle">AppID：</span>{{ query.appId }}</div>
                    <div><span class="softTitle">应用架构：</span>{{ query.arch }}</div>
                </div>
                <div><span class="softTitle">应用简述：</span>{{ query.description }}</div>
            </div>
        </div>
    </div>
    <div class="chooseVerson">
        <div class="title">版本选择</div>
        <el-table :data="difVersionItemsStore.difVersionItemList" style="width: 100%;border-radius: 5px;flex-grow: 1;">
            <el-table-column prop="version" label="版本号" width="120" />
            <el-table-column prop="runtime" label="运行环境" header-align="center" align="center" width="240"
                :formatter="formatRuntime" />
            <el-table-column prop="description" label="描述"/>
            <el-table-column fixed="right" label="操作" header-align="center" align="center" width="120">
                <template #default="scope">
                    <!-- 卸载按钮 -->
                    <el-button class="uninstallBtn" v-if="scope.row.isInstalled && !scope.row.loading"
                        @click="changeStatus(scope.row, 'uninstall')">卸载</el-button>
                    <el-button v-if="scope.row.isInstalled && scope.row.loading" loading>卸载中</el-button>
                    <!-- 运行按钮 -->
                    <el-button class="runBtn"
                        v-if="scope.row.isInstalled && !scope.row.loading && scope.row.kind == 'app'"
                        @click="toRun(scope.row)">运行</el-button>
                    <!-- 安装按钮 -->
                    <el-button class="installBtn"
                        v-if="!scope.row.isInstalled && !scope.row.loading && scope.row.kind == 'app'"
                        @click="changeStatus(scope.row, 'install')">安装</el-button>
                    <el-button v-if="!scope.row.isInstalled && scope.row.loading" loading>安装中</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { ipcRenderer } from 'electron';
import { CardFace, CommandData } from '@/interface/CardFace';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { ElNotification, TableColumnCtx } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import hasUpdateVersion from "@/util/checkVersion";
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useWelcomeItemsStore } from "@/store/welcomeItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const welcomeItemsStore = useWelcomeItemsStore();
const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();
// 路由对象
const router = useRouter();
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
    ipcRenderer.send('command', {
        appId: item.appId,
        name: item.name,
        version: item.version,
        arch: item.arch,
        description: item.description,
        isInstalled: item.isInstalled,
        icon: findItem ? findItem.icon : '',
        command: command,
        loading: false,
    });
    // 弹出提示框
    ElNotification({
        title: '提示',
        message: message,
        type: 'info',
        duration: 500,
    });
}
// 运行按钮
const toRun = (item: CardFace) => {
    // 发送操作命令
    ipcRenderer.send('command', {
        appId: item.appId,
        name: item.name,
        version: item.version,
        arch: item.arch,
        description: item.description,
        isInstalled: item.isInstalled,
        icon: item.icon,
        command: 'll-cli run ' + item.appId + '/' + item.version,
        loading: false,
    });
    // 弹出运行提示框
    ElNotification({
        title: '提示',
        message: item.name + '(' + item.version + ')即将被启动！',
        type: 'info',
        duration: 500,
    });
}
// 查询同应用不同版本的列表
const commandResult = (_event: any, res: any) => {
    const command: string = res.param.command;
    if (command.startsWith('ll-cli query') || command.startsWith('ll-cli search')) {
        if (command.startsWith("ll-cli query") && 'stdout' == res.code) {
            difVersionItemsStore.initDifVersionItemsOld(res.result, query);
        }
        if (command.startsWith("ll-cli search") && 'stdout' == res.code) {
            difVersionItemsStore.initDifVersionItems(res.result, query);
        }
    }
}
// 启动时加载
onMounted(() => {
    if (!systemConfigStore.networkRunStatus) {
        ElNotification({
            title: '提示',
            message: "网络状态不可用！请检查网络后,再重启商店使用...",
            type: 'error',
            duration: 5000,
        });
        return;
    }
    let ipcData: CommandData = {
        command: ''
    };
    if (hasUpdateVersion('1.3.99', systemConfigStore.llVersion) == 1) {
        ipcData.command = "ll-cli search " + query.appId + " --json";
    } else {
        ipcData.command = "ll-cli query " + query.appId;
    }
    ipcRenderer.send("command", ipcData);
    ipcRenderer.on('command-result', commandResult);
})
// 关闭前销毁
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
})
// 路由跳转离开前
onBeforeRouteLeave((to: any, from: any, next: any) => {
    to.meta.savedPosition = from.meta.savedPosition;
    to.meta.savedPageNo = from.meta.savedPageNo;
    to.meta.savedPageSize = from.meta.savedPageSize;
    to.meta.savedSearchName = from.meta.savedSearchName;
    next();
})
</script>
<style scoped>
.firstMenu :deep(.el-breadcrumb__inner) {
    color: white;
    cursor: pointer;
    font-weight: bold;
    font-size: 16px;
}

.secondMenu :deep(.el-breadcrumb__inner) {
    color: #999999;
}

.baseContainer {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    margin-top: 10px;
    margin-bottom: 3px;
    height: 30%;
}

.chooseVerson {
    display: flex;
    flex-direction: column;
    border-radius: 5px;
    height: 67%;
}

.title {
    background-color: cadetblue;
    border-radius: 5px;
    padding-left: 16px;
    padding-top: 3px;
    padding-bottom: 3px;
    margin-bottom: 1px;
    font-weight: bold;
}

.baseMessage {
    flex-grow: 1;
    padding: 12px;
    display: flex;
    background-color: white;
    border-radius: 5px
}

.imageDiv {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 15%;
}

.soft {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-right: 12px;
    margin-bottom: 16px;
}

.softTitle {
    font-size: 18px;
    color: #0E0101;
    font-weight: bold;
}

.installBtn {
    background-color: blue;
    color: white;
    padding: 6px;
    height: 24px;
}

.uninstallBtn {
    background-color: red;
    color: white;
    padding: 6px;
    height: 24px;
}

.runBtn {
    background-color: #5F9EA0;
    color: white;
    padding: 6px;
    height: 24px;
}

@media (prefers-color-scheme: light) {
    .firstMenu :deep(.el-breadcrumb__inner) {
        color: #000;
    }

    .baseContainer {
        color: #DCDCDC;
        background-color: white;
    }
}
</style>