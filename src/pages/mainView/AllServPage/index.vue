<template>
    <div class="container" ref="containRef" @scroll="handleScroll">
        <el-row>
            <el-col style="padding:10px" v-for="(item, index) in displayedItems" :key="item.appId" :span="num">
                <Card :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" />
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ipcRenderer } from 'electron';
import { ElNotification } from 'element-plus'
import { getList } from "@/api/service";
import { CardFace } from "@/components/CardFace";
import Card from "@/components/Card.vue";

const displayedItems = reactive<CardFace>([]); // 用于存储当前显示的卡片对象
const installedItems = reactive<CardFace>([]); // 用于存储当前系统已安装的卡片对象
const containRef = ref<HTMLElement | null>();
const num = ref(6);
let pageNo = 1;
let pageSize = 12;

/**
 * 根据分页条件查询网络玲珑应用
 * @param pageNo 页数
 * @param pageSize 每页条数
 */
const fetchData = async (pageNo: number, pageSize: number) => {
    getList({ page: pageNo, size: pageSize }).then(res => {
        const element = res.data.list;
        if (element != null) {
            element.forEach((item: CardFace) => {
                item.isInstalled = installedItems.some(it => it.appId == item.appId && it.version == item.version);
                displayedItems.push(item);
            });
        }
    });
}
// 根据分辨率计算栅格行卡片数量
function calculateSpan() {
    const screenWidth = window.innerWidth;
    if (screenWidth > 1366) {
        num.value = 4; // 大屏幕，一行显示 6 个卡片
        pageSize = 18;
    } else if (screenWidth <= 1366 && screenWidth > 768) {
        num.value = 6; // 中等屏幕，一行显示 4 个卡片
        pageSize = 12;
    } else {
        num.value = 8; // 小屏幕，一行显示 3 个卡片
        pageSize = 9;
    }
    // 分页查询第一页程序
    fetchData(pageNo, pageSize);
}
// 滚动条监听事件
const handleScroll = () => {
    if (containRef.value) {
        const scrollPosition = containRef.value.scrollTop; // 获取滚动位置
        const windowHeight = containRef.value.clientHeight; // 获取窗口高度
        const contentHeight = containRef.value.scrollHeight; // 获取内容高度
        const scrollbarHeight = contentHeight - windowHeight; // 计算滚动条长度
        if (scrollPosition != 0 && scrollbarHeight != 0 && scrollbarHeight >= scrollPosition && scrollbarHeight - parseInt(String(scrollPosition)) <= 1) {
            console.log('滚动位置:', scrollPosition);
            console.log('窗口高度:', windowHeight);
            console.log('内容高度:', contentHeight);
            console.log('滚动条长度:', scrollbarHeight);
            pageNo += 1;
            fetchData(pageNo, pageSize);
        }
    }
}
// 添加事件监听器
const installedResListener = (_event: any, data: string) => {
    const apps = data.split("\n");
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
            const item: CardFace = {
                appId: element.substring(appIdNum, nameNum).trim(),
                name: element.substring(nameNum, versionNum).trim() ? element.substring(nameNum, versionNum).trim() : '-',
                version: element.substring(versionNum, archNum).trim(),
                arch: element.substring(archNum, channelNum).trim(),
                channel: element.substring(channelNum, moduleNum).trim(),
                module: element.substring(moduleNum, descriptionNum).trim(),
                description: element.substring(descriptionNum, element.length)
            }
            installedItems.push(item);
        }
    }
}
const installListener = (_event: any, data: any) => {
    console.log(data);
    calculateSpan();
    ElNotification({
        title: '安装成功',
        message: '成功安装',
        type: 'success',
    });
};
const uninstallListener = (_event: any, data: any) => {
    console.log(data);
    calculateSpan();
    ElNotification({
        title: '卸载成功',
        message: '成功卸载',
        type: 'success',
    });
};
// 组件初始化时加载
onMounted(() => {
    window.addEventListener("resize", () => calculateSpan)
    fetchData(pageNo, pageSize);
    // 初始加载当前系统已经安装的玲珑程序
    ipcRenderer.send('installed-command', 'll-cli list');
    ipcRenderer.on('installed-result', installedResListener);
    ipcRenderer.on('install-result', installListener);
    ipcRenderer.on('uninstall-result', uninstallListener);
});
// 在组件销毁时移除事件监听器
onBeforeUnmount(() => {
    ipcRenderer.removeListener('installed-result', installedResListener);
    ipcRenderer.removeListener('install-result', installListener);
    ipcRenderer.removeListener('uninstall-result', uninstallListener);
});
</script>

<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}
</style>