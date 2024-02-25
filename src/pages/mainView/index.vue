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
                    <hr style="display: none;">
                    <el-menu-item index="998" @click="toPage('/card_comp')" style="display: none;">
                        <el-icon>
                            <GobletSquareFull />
                        </el-icon>
                        <span>卡片组件</span>
                    </el-menu-item>
                    <el-menu-item index="999" @click="toPage('/')" style="display: none;">
                        <el-icon>
                            <Loading />
                        </el-icon>
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
        welcomeItemsStore.updateItemLoadingStatus(installedEntity,false);
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
// 页面初始化时执行
onMounted(() => {
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
}

.el-menu {
    height: 100%;
    background-color: #2D2F2F;
    border-right-style: none;
    overflow-y: hidden;
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

@media (prefers-color-scheme: light) {
    .el-menu {
        background-color: #6e6e6e2e;
    }

    .el-menu-item {
        color: #0e0101;
        background-color: #6e6e6e2e;
    }

    .views {
        background-color: #2d2f2f2b;
    }
}
</style>