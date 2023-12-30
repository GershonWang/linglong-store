<template>
    <div class="container">
        <el-row>
            <el-col style="padding:10px" v-for="(item,index) in installedItems" :key="index" :span="num">
                <Card :name="item.name" 
                    :version="item.verion"
                    :description="item.description"
                    :arch="item.arch"
                    :isInstalled="true"/>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
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
// 获取已经安装的玲珑程序
function getInstalled() {
    ipcRenderer.send('installed-command', 'll-cli list');
}
const installedResListener = (_event: any, data: string) => {
    const apps = data.split("\n");
    // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
    for (let index = 1; index < apps.length - 1; index++) {
        const element = apps[index];
        // 使用正则表达式来分割数据行
        const dataArray = element.match(/'[^']+'|\S+/g);
        // 现在 dataArray 包含了每个字段的值，包括可能包含空格的字段
        if (dataArray != null && 'x86_64' == dataArray[3]) {
            const item = {
                appId: dataArray[0].replace(/'/g, ''), // 去除可能包含的单引号
                arch: dataArray[3],
                description: dataArray[6],
                icon: "/logo.png",
                id: "",
                name: dataArray[1].replace(/'/g, ''), // 去除可能包含的单引号
                version: dataArray[2].replace(/'/g, ''), // 去除可能包含的单引号
                channel: dataArray[4],
                module: dataArray[5]
            }
            installedItems.push(item);
        }
    }
    console.log('installedItems',installedItems)
}
// 组件初始化时加载
onMounted(() => {
    getInstalled(); // 初始加载当前系统已经安装的玲珑程序
    ipcRenderer.on('installed-result', installedResListener);
});
// 在组件销毁时移除事件监听器
onBeforeUnmount(() => {
    ipcRenderer.removeListener('installed-result', installedResListener);
});
</script>

<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}
</style>