<template>
    <div class="container">
        <el-row>
            <el-col style="padding:10px" v-for="(item,index) in installedItems" :key="index" :span="num">
                <Card :name="item.name" 
                    :version="item.verion"
                    :description="item.description"
                    :arch="item.arch"
                    :isInstalled="true"
                    :appId="item.appId"/>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { ElNotification } from 'element-plus'
import { ipcRenderer } from 'electron';
import Card from "@/components/Card.vue";

let installedItems = reactive<Card[]>([]); // 用于存储当前系统已安装的卡片对象
const num = ref(6);
interface Card {
    appId: string;
    arch: string;
    description: string;
    icon: string;
    id: string;
    name: string;
    version: string;
}
// 根据分辨率计算栅格行卡片数量
function calculateSpan() {
    // 根据屏幕宽度动态计算 span 值
    const screenWidth = window.innerWidth;
    if (screenWidth > 1366) {
        num.value = 4; // 大屏幕，一行显示 6 个卡片
    } else if (screenWidth <= 1366 && screenWidth > 768) {
        num.value = 6; // 中等屏幕，一行显示 4 个卡片
    } else {
        num.value = 8; // 小屏幕，一行显示 3 个卡片
    }
}
// 获取已经安装的玲珑程序
function getInstalled() {
    ipcRenderer.send('installed-command', 'll-cli list');
}
const installedResListener = (_event: any, data: string) => {
    const apps = data.split("\n");
    if(apps.length > 1) {
        const header = apps[0].split('[1m[38;5;214m')[1];
        const appIdNum = header.indexOf('appId');
        const nameNum = header.indexOf('name');
        const versionNum = header.indexOf('version');
        const archNum = header.indexOf('arch');
        const channelNum = header.indexOf('channel');
        const moduleNum = header.indexOf('module');
        const descriptionNum = header.indexOf('description');
        // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
        for (let index = 1; index < apps.length - 1; index++) {
            const element = apps[index];
            const item = {
                appId: element.substring(appIdNum,nameNum).trim(),
                name: element.substring(nameNum,versionNum).trim() ? element.substring(nameNum,versionNum).trim() : '-',
                verion: element.substring(versionNum,archNum).trim(),
                arch: element.substring(archNum,channelNum).trim(),
                channel: element.substring(channelNum,moduleNum).trim(),
                module: element.substring(moduleNum,descriptionNum).trim(),
                description: element.substring(descriptionNum,element.length)
            }
            installedItems.push(item);
        }
    }
}
// installedItems.splice(index, 1);
const uninstallListener = (_event: any, data: any) => {
    console.log(data);
    getInstalled();
    ElNotification({
        title: '卸载成功',
        message: '成功卸载',
        type: 'success',
    });
};
// 监听窗口大小变化，实时更新 span 值
window.addEventListener("resize", () => {
    calculateSpan();
});
// 组件初始化时加载
onMounted(() => {
    calculateSpan();
    getInstalled(); // 初始加载当前系统已经安装的玲珑程序
    ipcRenderer.on('installed-result', installedResListener);
    ipcRenderer.on('uninstall-result', uninstallListener);
});
// 在组件销毁时移除事件监听器
onBeforeUnmount(() => {
    ipcRenderer.removeListener('installed-result', installedResListener);
    ipcRenderer.removeListener('uninstall-result', uninstallListener);
});
</script>

<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}
</style>