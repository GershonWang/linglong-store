<template>
    <div class="container">
        <el-row>
            <el-col style="padding:10px" v-for="(item, index) in installedItems" :key="index" :span="num">
                <Card :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :index="index" />
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { ElNotification } from 'element-plus'
import { ipcRenderer } from 'electron';
import { CardFace } from "@/components/CardFace";
import Card from "@/components/Card.vue";

let installedItems = reactive<CardFace[]>([]); // 用于存储当前系统已安装的卡片对象
const num = ref(6);

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
// 命令执行返回结果
const commandResult = (_event: any, data: any) => {
    if ('stdout' != data.code) {
        ElNotification({
            title: '请求错误',
            message: '命令执行异常！',
            type: 'error',
        });
        return;
    }
    const params = data.param;
    const result = data.result;
    // 查询已安装命令
    if (params.command == 'll-cli list') {
        const apps = result.split("\n");
        if (apps.length > 1) {
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
                const appId = element.substring(appIdNum, nameNum).trim();
                if (appId != 'org.deepin.Runtime') { // 去除运行时服务
                    const item = {
                        appId: appId,
                        name: element.substring(nameNum, versionNum).trim() ? element.substring(nameNum, versionNum).trim() : '-',
                        version: element.substring(versionNum, archNum).trim(),
                        arch: element.substring(archNum, channelNum).trim(),
                        channel: element.substring(channelNum, moduleNum).trim(),
                        module: element.substring(moduleNum, descriptionNum).trim(),
                        description: element.substring(descriptionNum, element.length),
                        icon: "https://linglong.dev/asset/logo.svg"
                    }
                    installedItems.push(item);
                }
            }
        }
    }
    // 卸载命令
    if (params.command.startsWith('ll-cli uninstall')) {
        installedItems.splice(params.index, 1);
        ElNotification({
            title: '卸载成功',
            message: params.name + '(' + params.version + ')被成功卸载!',
            type: 'success',
        });
    }
}
// 组件初始化时加载
onMounted(() => {
    // 监听窗口大小变化，实时更新 span 值
    window.addEventListener("resize", () => calculateSpan);
    // 初始加载当前系统已经安装的玲珑程序
    ipcRenderer.send('command', { name: '查询已安装程序列表', command: 'll-cli list' });
    ipcRenderer.on('command-result', commandResult);
});
// 在组件销毁时移除事件监听器
onBeforeUnmount(() => {
    window.removeEventListener("resize", () => calculateSpan);
    ipcRenderer.removeListener('command-result', commandResult)
});
</script>

<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}
</style>