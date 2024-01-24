<template>
    <div class="common-layout">
        <el-container>
            <el-aside>
                <el-menu default-active="1">
                    <el-menu-item index="1" @click="toPage('/all_serv_menu')">
                        <el-icon color="#D3D3D3"><HomeFilled /></el-icon>
                        <span>全部程序</span>
                    </el-menu-item>
                    <el-menu-item index="2" @click="toPage('/installed_menu')">
                        <el-icon><GobletSquareFull /></el-icon>
                        <span>已安装程序</span>
                    </el-menu-item>
                    <el-menu-item index="3" @click="toPage('/update_menu')">
                        <el-icon><UploadFilled /></el-icon>
                        <span>可更新程序</span>
                    </el-menu-item>
                    <el-menu-item index="98" @click="toPage('/config_menu')">
                        <el-icon><setting /></el-icon>
                        <span>基础设置</span>
                    </el-menu-item>
                    <el-menu-item index="99" @click="toPage('/about_menu')">
                        <el-icon><InfoFilled /></el-icon>
                        <span>关于程序</span>
                    </el-menu-item>
                    <hr style="display: none;">
                    <el-menu-item index="998" @click="toPage('/card_comp')" style="display: none;">
                        <el-icon><GobletSquareFull /></el-icon>
                        <span>卡片组件</span>
                    </el-menu-item>
                    <el-menu-item index="999" @click="toPage('/')" style="display: none;">
                        <el-icon><Loading /></el-icon>
                        <span>返回首页</span>
                    </el-menu-item>
                </el-menu>
                <!-- 更多菜单项 -->
            </el-aside>
            <el-main class="views">
                <!-- 这里将动态显示不同的功能页面 -->
                <router-view></router-view>
            </el-main>
        </el-container>
    </div>
</template>
<script setup lang="ts">
import { ipcRenderer } from 'electron';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElNotification } from 'element-plus'
import { CardFace } from '@/interface/CardFace';
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useUpdateItemsStore } from "@/store/updateItems";

const installedItemsStore = useInstalledItemsStore();
const allServItemsStore = useAllServItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const updateItemsStore = useUpdateItemsStore();
// 路由对象
const router = useRouter();
// 路由跳转
const toPage = (url:string) => router.push(url);
// 重试次数
let retryNum = ref(0);

const commandResult = (_event: any, res: any) => {
    const params = res.param;
    const code = res.code;
    if ('stdout' != code) {
        if (retryNum.value <= 3) {
            retryNum.value++;
            ipcRenderer.send('command', params);
        } else {
            retryNum.value = 0;
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
    if (params.command.startsWith('ll-cli install')) {
        const item: CardFace = {
            icon: params.icon,
            name: params.name,
            version: params.version,
            description: params.description,
            arch: params.arch,
            isInstalled: true,
            appId: params.appId,
            loading: params.loading
        }
        // 安装成功后，更新已安装应用列表
        installedItemsStore.addItem(item);
        // 安装成功后，更新全部应用中的应用状态
        allServItemsStore.updateItemInstallStatus(item);
        // 安装成功后，更新当前应用加载状态
        allServItemsStore.updateItemLoadingStatus(item,false);
        // 安装完成后，更新版本应用的应用状态
        difVersionItemsStore.updateItemInstallStatus(item);
        // 安装完成后，更新版本应用加载状态
        difVersionItemsStore.updateItemLoadingStatus(item,false);
        // 安装成功后，弹出通知
        ElNotification({
            title: '安装成功',
            message: params.name + '(' + params.version + ')被成功安装!',
            type: 'success',
            duration: 500,
        });
    }
    // 返回结果 - 当前执行卸载的应用信息
    if (params.command.startsWith('ll-cli uninstall')) {
        const item: CardFace = {
            icon: params.icon,
            name: params.name,
            version: params.version,
            description: params.description,
            arch: params.arch,
            isInstalled: false,
            appId: params.appId,
            loading: params.loading
        }
        // 卸载成功后，从已安装应用列表中移除该应用
        installedItemsStore.removeItem(item);
        // 卸载成功后，更新全部应用中的应用状态
        allServItemsStore.updateItemInstallStatus(item);
        // 卸载成功后，更新当前应用加载状态
        allServItemsStore.updateItemLoadingStatus(item,false);
        // 卸载完成后，更新版本应用的应用状态
        difVersionItemsStore.updateItemInstallStatus(item);
        // 卸载完成后，更新版本应用加载状态
        difVersionItemsStore.updateItemLoadingStatus(item,false);
        // 卸载成功后，弹出通知
        ElNotification({
            title: '卸载成功',
            message: params.name + '(' + params.version + ')被成功卸载!',
            type: 'success',
            duration: 500,
        });
    }
}

let timerId: NodeJS.Timeout; // 使用NodeJS.Timer类型

const startTimer = () => {
    timerId = setInterval(() => {
        updateItemsStore.initUpdateItems();
    }, 30000); // 30秒钟执行一次
};

onMounted(() => {
    // startTimer();
    ipcRenderer.on('command-result', commandResult);
});
onBeforeUnmount(() => {
    if (timerId) {
        clearInterval(timerId);
    }
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
    width: 180px;
    margin: 12px 0 12px 12px;
    border-radius: 15px;
}
.el-menu {
    height: 100%;
    background-color: #2D2F2F;
    border-right-style: none;
    overflow-y: hidden;
}
.el-menu-item {
    color: white;
    font-weight: bold;
    border-radius: 15px;
    background-color: #6E6E6E;
    text-align: center;
    margin: 5px;
}
a {
  font-weight: bold;
  color: #D3D3D3;
  text-decoration: inherit;
}
a:hover {
  color: #2D2F2F;
}
.views {
    background-color: #2D2F2F;
    overflow: hidden;
    border-radius: 15px;
    margin: 12px;
    padding: 12px;
    position: relative;
}
</style>