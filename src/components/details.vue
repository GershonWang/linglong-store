<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item class="firstMenu" @click="router.back">{{ query.menuName }}</el-breadcrumb-item>
        <el-breadcrumb-item class="secondMenu">{{ query.name }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="baseContainer">
        <div class="title">参数信息</div>
        <div class="baseMessage">
            <div class="imageDiv">
                <img class="image" v-lazy="query.icon" alt="Image" />
            </div>
            <div class="same">
                <div class="soft">
                    <div>
                        <span class="softTitle">应用程序名称：</span>{{ query.name }}
                    </div>
                    <div>
                        <span class="softTitle">AppID：</span>{{ query.appId }}
                    </div>
                    <div>
                        <span class="softTitle">应用架构：</span>{{ query.arch }}
                    </div>
                </div>
                <div>
                    <span class="softTitle">应用简述：</span>{{ query.description }}
                </div>
            </div>
        </div>
    </div>
    <div class="chooseVerson">
        <div class="title">版本选择</div>
        <el-table :data="difVersionItemsStore.difVersionItemList" :default-sort="{ prop: 'version', order: 'descending' }"
            height="94%" style="width: 100%;border-radius: 5px">
            <el-table-column prop="name" label="名称" header-align="center" align="center" width="180" />
            <el-table-column prop="version" label="版本号" header-align="center" align="center" width="120" />
            <el-table-column prop="description" label="描述" header-align="center" />
            <el-table-column fixed="right" label="操作" header-align="center" align="center" width="120">
                <template #default="scope">
                    <!-- 卸载按钮 -->
                    <el-button class="uninstallBtn" v-if="scope.row.isInstalled && !scope.row.loading"
                        @click="changeStatus(scope.row, 'uninstall')">卸载</el-button>
                    <el-button v-if="scope.row.isInstalled && scope.row.loading" loading>卸载中</el-button>
                    <!-- 运行按钮 -->
                    <el-button class="runBtn" v-if="scope.row.isInstalled && !scope.row.loading"
                        @click="toRun(scope.row)">运行</el-button>
                    <!-- 安装按钮 -->
                    <el-button class="installBtn" v-if="!scope.row.isInstalled && !scope.row.loading"
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
import { CardFace } from '@/interface/CardFace';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { ElNotification } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import hasUpdateVersion from "@/util/checkVersion";
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const systemConfig = useSystemConfigStore();
// 路由对象
const router = useRouter();
const query = router.currentRoute.value.query;
// 操作按钮的点击事件
const changeStatus = async (item: any, flag: string) => {
    // 启用加载框
    allServItemsStore.updateItemLoadingStatus(item, true);
    installedItemsStore.updateItemLoadingStatus(item, true);
    difVersionItemsStore.updateItemLoadingStatus(item, true);
    // 根据flag判断是安装还是卸载
    let message: string = '正在安装' + item.name + '(' + item.version + ')';
    let command: string = 'll-cli install ' + item.appId + '/' + item.version;
    if (flag == 'uninstall') {
        message = '正在卸载' + item.name + '(' + item.version + ')';
        command = 'll-cli uninstall ' + item.appId + '/' + item.version;
    }
    // 从所有程序列表中捞取程序图标icon
    let icon: string | undefined;
    const allItems = allServItemsStore.allServItemList;
    const findItem = allItems.find(it => it.appId == item.appId && it.name == item.name);
    if (findItem) {
        icon = findItem.icon;
    }
    // 弹出提示框
    ElNotification({
        title: '提示',
        message: message,
        type: 'info',
        duration: 500,
    });
    // 发送操作命令
    ipcRenderer.send('command', {
        appId: item.appId,
        name: item.name,
        version: item.version,
        arch: item.arch,
        description: item.description,
        isInstalled: item.isInstalled,
        icon: icon,
        command: command,
        loading: false,
    });
}
// 运行按钮
const toRun = (item: CardFace) => {
    // 弹出运行提示框
    ElNotification({
        title: '提示',
        message: item.name + '(' + item.version + ')即将被启动！',
        type: 'info',
        duration: 500,
    });
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
}
// 查询同应用不同版本的列表
const commandResult = (_event: any, res: any) => {
    const command: string = res.param.command;
    if (command.startsWith('ll-cli query') || command.startsWith('ll-cli search')) {
        if ('stdout' == res.code) {
            const data = res.result;
            difVersionItemsStore.initDifVersionItems(data, query);
        }
    }
}
// 启动时加载
onMounted(() => {
    if (!systemConfig.networkRunStatus) {
        ElNotification({
            title: '提示',
            message: "网络状态不可用！请检查网络后,再重启商店使用...",
            type: 'error',
            duration: 5000,
        });
        return;
    }
    if (hasUpdateVersion('1.3.99', systemConfig.llVersion) == 1) {
        ipcRenderer.send("command", { command: "ll-cli search " + query.appId + " --json"});
    } else {
        ipcRenderer.send("command", { command: "ll-cli query " + query.appId });
    }
    ipcRenderer.on('command-result', commandResult);
})
// 关闭前销毁
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
})
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
}

.secondMenu :deep(.el-breadcrumb__inner) {
    color: #999999;
}

.baseContainer {
    background-color: #999999;
    border-radius: 5px;
    margin-top: 10px;
    margin-bottom: 3px;
    height: 30%;
}

.chooseVerson {
    background-color: #999999;
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
    padding: 12px;
    display: flex;
}

.imageDiv {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 20%;
    height: 150px;
}

.image {
    width: 120px;
    height: 120px;
}

.same {
    width: 80%;
    color: #606274;
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