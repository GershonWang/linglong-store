<template>
    <div class="search" style="margin: 10px auto;text-align: center;">
        <el-input v-model="searchName" placeholder="请输入要搜索的程序名" style="width: 300px;" @keydown.enter="submit">
            <template #prefix>
                <el-icon class="el-input__icon">
                    <search />
                </el-icon>
            </template>
        </el-input>
    </div>
    <div class="container" ref="containRef" @scroll="handleScroll">
        <el-row>
            <el-col style="padding:10px" v-for="(item, index) in displayedItems" :key="index" :span="num">
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
import { CardFace } from "@/components/CardFace";
import Card from "@/components/Card.vue";
// 存储在session里源内所有程序数组
const allItems = sessionStorage.getItem('allItems');
// 用于存储当前显示的卡片对象
const displayedItems = reactive<CardFace[]>([]);
// 用于存储当前系统已安装的卡片对象
const installedItems = reactive<CardFace[]>([]);

const containRef = ref<HTMLElement | null>();
const searchName = ref('');
const num = ref(6);
// 记录是否启用滚动条查询
let isScrollQuery = ref(true);
let pageNo = 1;
let pageSize = 12;

/**
 * 根据分页条件查询网络玲珑应用
 * @param pageNo 页数
 * @param pageSize 每页条数
 */
const fetchData = async (pageNo: number, pageSize: number) => {
    let startNum = pageNo == 1 ? 0 : pageNo * pageSize;
    let endNum = startNum + pageSize;
    if (allItems != null && allItems.length > 0) {
        const all = JSON.parse(allItems);
        for (let index = startNum; index < endNum; index++) {
            const element = all[index];
            element.isInstalled = installedItems.some(it => it.appId == element.appId && it.version == element.version);
            displayedItems.push(element);
        }
    }
}
// 搜索框回车事件
function submit() {
    // 执行搜索前，都进行数组的重置操作
    displayedItems.splice(0, displayedItems.length);
    // 获取输入框输入的内容，判空则默认搜索结果
    const msg = searchName.value;
    if (msg != '' && allItems != null) {
        isScrollQuery.value = false;
        const all = JSON.parse(allItems);
        for (let index = 0; index < all.length; index++) {
            const element: CardFace = all[index];
            const name = element.name;
            if (name != undefined && name.includes(msg)) {
                element.isInstalled = installedItems.some(it => it.appId == element.appId && it.version == element.version);
                displayedItems.push(element);
            }
        }
    } else {
        isScrollQuery.value = true;
        // 重置分页查询
        pageNo = 1;
        pageSize = 12;
        fetchData(pageNo, pageSize);
    }
}
// 滚动条监听事件
const handleScroll = () => {
    if (isScrollQuery.value) {
        if (containRef.value) {
            const scrollPosition = containRef.value.scrollTop; // 获取滚动位置
            const windowHeight = containRef.value.clientHeight; // 获取窗口高度
            const contentHeight = containRef.value.scrollHeight; // 获取内容高度
            const scrollbarHeight = contentHeight - windowHeight; // 计算滚动条长度
            if (scrollPosition != 0 && scrollbarHeight != 0
                && scrollbarHeight >= scrollPosition
                && scrollbarHeight - parseInt(String(scrollPosition)) <= 1) {
                // console.log('滚动位置:', scrollPosition);
                // console.log('窗口高度:', windowHeight);
                // console.log('内容高度:', contentHeight);
                // console.log('滚动条长度:', scrollbarHeight);
                pageNo += 1;
                fetchData(pageNo, pageSize);
            }
        }
    }
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
// 命令执行结束返回结果
const commandResult = (_event: any, data: any) => {
    if ('stdout' != data.code) {
        ElNotification({
            title: '请求错误',
            message: '命令执行异常！',
            type: 'error',
        });
        return;
    }
    // 返回结果 - 查询当前已安装的玲珑应用列表
    if (data.data.command == 'll-cli list') {
        const apps = data.result.split("\n");
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
    // 返回结果 - 当前执行安装的应用信息
    if (data.data.command.startsWith('ll-cli install')) {
        displayedItems.splice(data.data.index, 1, {
            icon: data.data.icon,
            name: data.data.name,
            version: data.data.version,
            description: data.data.description,
            arch: data.data.arch,
            isInstalled: true,
            appId: data.data.appId,
        });
        ElNotification({
            title: '安装成功',
            message: '成功安装',
            type: 'success',
        });
    }
    // 返回结果 - 当前执行卸载的应用信息
    if (data.data.command.startsWith('ll-cli uninstall')) {
        displayedItems.splice(data.data.index, 1, {
            icon: data.data.icon,
            name: data.data.name,
            version: data.data.version,
            description: data.data.description,
            arch: data.data.arch,
            isInstalled: false,
            appId: data.data.appId,
        });
        ElNotification({
            title: '卸载成功',
            message: '成功卸载',
            type: 'success',
        });
    }
}
// 组件初始化时加载
onMounted(() => {
    window.addEventListener("resize", () => calculateSpan)
    fetchData(pageNo, pageSize);
    ipcRenderer.send('command', { name: '查询已安装程序列表', command: 'll-cli list' });
    ipcRenderer.on('command-result', commandResult);
});
// 在组件销毁时移除事件监听器
onBeforeUnmount(() => {
    window.removeEventListener("resize", () => calculateSpan);
    ipcRenderer.removeListener('command-result', commandResult);
});
</script>

<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}
</style>