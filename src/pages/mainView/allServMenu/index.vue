<template>
    <div class="row" ref="rowRef" @scroll="handleScroll">
        <el-row>
            <el-col v-for="(item, index) in displayedItems" :key="index" :span="num">
                <el-card :body-style="{ padding: '0px' }">
                    <img class="image" :src="itemImageUrl(item.icon)" @error="setDefault(item)" alt="Image" />
                    <div style="padding: 14px">
                        <span>{{ item.name }}</span>
                        <span class="version">{{ item.version }}</span>
                        <div class="bottom" v-if="item.isInstalled">
                            <p class="desc">{{ item.description }}</p>
                            <p class="time">{{ item.arch }}</p>
                            <el-button class="uninstallBtn" @click="uninstallServ(item)">卸载</el-button>
                        </div>
                        <div class="bottom" v-else>
                            <p class="desc">{{ item.description }}</p>
                            <p class="time">{{ item.arch }}</p>
                            <el-button class="installBtn" @click="installServ(item)">安装</el-button>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElNotification } from 'element-plus'
import { ipcRenderer } from 'electron';
import { getList } from '../../../api/service';

const items = reactive<Card[]>([]); // 用于存储所有卡片对象
const displayedItems = reactive<Card[]>([]); // 用于存储当前显示的卡片对象
const installedItems = reactive<Card[]>([]); // 用于存储当前系统已安装的卡片对象

const rowRef = ref<HTMLElement | null>();

const num = ref(4);
let pageNo = 1;
let pageSize = 12;

interface Card {
    appId: string;
    arch: string;
    description: string;
    icon: string;
    id: string;
    name: string;
    version: string;
    isInstalled: boolean;
}
/**
 * 根据分辨率计算栅格行卡片数量
 */
function calculateSpan() {
    // 根据屏幕宽度动态计算 span 值
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
}
/**
 * 获取已经安装的玲珑程序
 */
function getInstalled() {
    ipcRenderer.send('installed-command', 'll-cli list');
}
/**
 * 根据分页条件查询网络玲珑应用
 * @param pageNo 页数
 * @param pageSize 每页条数
 */
const fetchData = async (pageNo: number, pageSize: number) => {
    getList({ page: pageNo, size: pageSize }).then(res => {
        const temp = res.data.list;
        if (temp != null) {
            temp.forEach((item: Card) => {
                item.isInstalled = false; // 设置标识为false
                let count = 0;
                installedItems.forEach((it: Card) => {
                    if (item.appId == it.appId) {
                        count++;
                        items.push(it);
                        displayedItems.push(it);
                        return;
                    }
                })
                if (count > 0) {
                    return;
                }
                items.push(item);
                displayedItems.push(item);
            });
        }
    });
}

// 返回默认图片路径，如果图片地址为空或加载失败
const itemImageUrl = (url: string) => {
    return url || 'https://linglong.dev/asset/logo.svg'; // 替换为您的默认图片路径
};
// 图片加载失败，加载默认图片
const setDefault = (item: { icon: string; }) => {
    item.icon = '/logo.png';
}
// 安装程序
const installServ = (item: Card) => {
    ipcRenderer.send('install-command', 'll-cli install ' + item.appId);
    item.isInstalled = !item.isInstalled;
}
// 卸载程序
const uninstallServ = (item: Card) => {
    ipcRenderer.send('uninstall-command', 'll-cli uninstall ' + item.appId);
    item.isInstalled = !item.isInstalled;
}
// 滚动条监听事件
const handleScroll = () => {
    if (rowRef.value) {
        const scrollPosition = rowRef.value.scrollTop; // 获取滚动位置
        const windowHeight = rowRef.value.clientHeight; // 获取窗口高度
        const contentHeight = rowRef.value.scrollHeight; // 获取内容高度
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
                module: dataArray[5],
                isInstalled: true
            }
            installedItems.push(item);
        }
    }
}
const installListener = (_event: any, data: any) => {
    console.log(data);
    ElNotification({
        title: '安装成功',
        message: '成功安装',
        type: 'success',
    });
};
const uninstallListener = (_event: any, data: any) => {
    console.log(data);
    ElNotification({
        title: '卸载成功',
        message: '成功卸载',
        type: 'success',
    });
};
// 组件初始化时加载
onMounted(() => {
    calculateSpan();
    getInstalled(); // 初始加载当前系统已经安装的玲珑程序
    fetchData(pageNo, pageSize); // 分页查询第一页程序
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
// 监听窗口大小变化，实时更新 span 值
window.addEventListener("resize", () => {
    calculateSpan();
});
</script>
<style scoped>
.row {
    height: 100%;
    overflow-y: auto;
}

.el-col {
    text-align: center;
    padding: 18px;
}

.el-card {
    height: 100%;
    width: 100%;
    position: relative;
}

.image {
    width: 80%;
    margin: 10px;
}

.desc {
    font-size: 12px;
    color: #999;
    /* 限制显示两行文本 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    /* 可根据需要设置为nowrap来禁用折行 */
    max-width: 50%;
    /* 可根据需要设置最大宽度 */
}

.time {
    font-size: 12px;
    color: #999;
}

.version {
    position: absolute;
    top: 30px;
    right: -80px;
    transform: rotate(45deg);
    background-color: red;
    width: 100%;
}

.bottom {
    margin-top: 13px;
    line-height: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.el-button {
    background-color: blue;
    color: white;
    padding: 5px;
    min-height: auto;
}

.uninstallBtn {
    background-color: red;
}

.loading {
    text-align: center;
    padding: 10px;
}
</style>