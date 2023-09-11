<template>
    <el-row>
        <el-col v-for="(item, index) in displayedItems" :key="index" :span="6">
            <el-card :body-style="{ padding: '0px' }" style="position: relative;">
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
</template>
<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { ElNotification } from 'element-plus'
import { ipcRenderer } from 'electron';
import { getList } from '../../api/service';

const items = reactive<Card[]>([]); // 用于存储所有卡片对象
const displayedItems = reactive<Card[]>([]); // 用于存储当前显示的卡片对象
const installedItems = reactive<Card[]>([]); // 用于存储当前系统已安装的卡片对象

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
 * 获取已经安装的玲珑程序
 */
function getInstalled() {
    ipcRenderer.send('execute-command', 'll-cli list');
    ipcRenderer.on('command-result', (_event, data) => {
        const apps = data.split("\n");
        // 第0条是分类项不是应用，需要剔除，最后一行空，也需要剔除
        for (let index = 1; index < apps.length -1; index++) {
            const element = apps[index];
            // 使用正则表达式来分割数据行
            const dataArray = element.match(/'[^']+'|\S+/g);
            // 现在 dataArray 包含了每个字段的值，包括可能包含空格的字段
            const item = {
                appId: dataArray[0].replace(/'/g, ''), // 去除可能包含的单引号
                arch: dataArray[3],
                description: dataArray[6],
                icon: "",
                id: "",
                name: dataArray[1].replace(/'/g, ''), // 去除可能包含的单引号
                version: dataArray[2].replace(/'/g, ''), // 去除可能包含的单引号
                channel: dataArray[4],
                module: dataArray[5],
                isInstalled: true
            }
            installedItems.push(item);
        }
    })
}
/**
 * 根据分页条件查询网络玲珑应用
 * @param pageNo 页数
 * @param pageSize 每页条数
 */
const fetchData = async (pageNo: number, pageSize: number) => {
    getList({page: pageNo, size: pageSize}).then(res => {
        const temp = res.data.list;
        if (temp != null) {
            temp.forEach((item: Card) => {
                item.isInstalled = false; // 设置标识为false
                let count = 0;
                installedItems.forEach((it: Card) => {
                    if(item.appId == it.appId) {
                        count ++;
                        items.push(it);
                        displayedItems.push(it);
                        return;
                    }
                })
                if(count > 0) {
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
    item.isInstalled = !item.isInstalled;
    ipcRenderer.send('install-command', 'll-cli install ' + item.appId);
    ipcRenderer.on('install-result', (_event, data) => {
        console.log(data);
        ElNotification({
            title: '安装成功',
            message: '成功安装 ' + item.name,
            type: 'success',
        })
    })
}
// 卸载程序
const uninstallServ = (item: Card) => {
    item.isInstalled = !item.isInstalled;
    ipcRenderer.send('uninstall-command', 'll-cli uninstall ' + item.appId);
    ipcRenderer.on('uninstall-result', (_event, data) => {
        console.log(data);
        ElNotification({
            title: '卸载成功',
            message: '成功卸载 ' + item.name,
            type: 'success',
        })
    })
}
// 初始化加载
onMounted(() => {
    getInstalled(); // 初始加载当前系统已经安装的玲珑程序
    fetchData(pageNo, pageSize); // 分页查询第一页程序
});
// 监听滚动事件以触发加载更多
window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    if (scrollPosition != 0 && (documentHeight - scrollPosition) % windowHeight == 0) {
        pageNo += 1;
        fetchData(pageNo, pageSize);
    }
});
</script>
<style>
.el-col {
    margin-bottom: 15px;
}

.el-card {
    height: 100%;
    width: 90%;
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

.desc:hover::after {
    /* 显示完整内容的浮框 */
    content: attr(data-fulltext);
    display: block;
    position: absolute;
    top: 100%;
    /* 定位在文本下方 */
    left: 0;
    background-color: #fff;
    border: 1px solid #ccc;
    padding: 5px;
    visibility: visible;
    white-space: normal;
    /* 显示全部文本，禁用折行 */
    z-index: 1;
    /* 使浮框位于其他元素之上 */
}

.desc::after {
    /* 默认隐藏浮框 */
    content: attr(data-fulltext);
    display: none;
    position: absolute;
    top: 100%;
    /* 定位在文本下方 */
    left: 0;
    background-color: #fff;
    border: 1px solid #ccc;
    padding: 5px;
    visibility: hidden;
    white-space: normal;
    /* 显示全部文本，禁用折行 */
    z-index: 1;
    /* 使浮框位于其他元素之上 */
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