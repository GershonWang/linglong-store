<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item class="firstMenu" @click="router.back">{{ query.menuName }}</el-breadcrumb-item>
        <el-breadcrumb-item class="secondMenu">{{ query.name }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div class="baseContainer">
        <div class="title">参数信息</div>
        <div class="baseMessage">
            <div class="imageDiv">
                <img class="image" :src="query.icon as string || defaultImage"
                    @error="(e: any) => e.target.src = defaultImage" alt="Image" />
            </div>
            <div class="same">
                <div class="soft">
                    <div>
                        <a class="softTitle">应用程序名称：</a>{{ query.name }}
                    </div>
                    <div>
                        <a class="softTitle">AppID：</a>{{ query.appId }}
                    </div>
                    <div>
                        <a class="softTitle">应用架构：</a>{{ query.arch }}
                    </div>
                </div>
                <div>
                    <a class="softTitle">应用简述：</a>{{ query.description }}
                </div>
            </div>
        </div>
    </div>
    <div class="chooseVerson">
        <div class="title">版本选择</div>
        <el-table :data="difVersionItemsStore.difVersionItemList" height="94%" style="width: 100%;border-radius: 5px">
            <el-table-column prop="name" label="名称" width="180" />
            <el-table-column prop="version" label="版本号" width="180" />
            <el-table-column prop="description" label="描述" />
            <el-table-column fixed="right" label="操作" width="120">
                <template #default="scope">
                    <el-button class="uninstallBtn" v-if="scope.row.isInstalled" :disabled="scope.row.loading"
                        @click="changeStatus(scope.row,'uninstall')">卸载</el-button>
                    <el-button class="installBtn" v-else :disabled="scope.row.loading"
                        @click="changeStatus(scope.row,'install')">安装</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { ipcRenderer } from 'electron';
import { CardFace } from './CardFace';
import { useRouter } from 'vue-router';
import { ElNotification } from 'element-plus'
import { ArrowRight } from '@element-plus/icons-vue'
import defaultImage from '@/assets/logo.svg'
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";

const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
// 路由对象
const router = useRouter();
const query = router.currentRoute.value.query;
// 操作按钮的点击事件
const changeStatus = async (item: CardFace,flag: string) => {
    // 启用加载框
    allServItemsStore.updateItemLoadingStatus(item, true);
    installedItemsStore.updateItemLoadingStatus(item, true);
    difVersionItemsStore.updateItemLoadingStatus(item,true);
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
    const findItem = allItems.find(item => item.appId == item.appId && item.name == item.name);
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
        icon: icon,
        name: item.name,
        version: item.version,
        description: item.description,
        arch: item.arch,
        isInstalled: item.isInstalled,
        appId: item.appId,
        command: command,
        loading: false
    });
}
// 查询同应用不同版本的列表
const commandResult = (_event: any, res: any) => {
    const command: string = res.param.command;
    if (command.startsWith('ll-cli query') && 'stdout' == res.code) {
        const data = res.result;
        difVersionItemsStore.initDifVersionItems(data,query);
    }
}
// 启动时加载
onMounted(() => {
    ipcRenderer.send("command", { name: "查询该程序所有版本列表", command: "ll-cli query " + query.appId });
    ipcRenderer.on('command-result', commandResult);
})
// 关闭前销毁
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
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
</style>