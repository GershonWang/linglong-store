<template>
    <el-row>
        <el-col v-for="(item, index) in displayedItems" :key="index" :span="6">
            <el-card :body-style="{ padding: '0px' }">
                <img class="image" :src="itemImageUrl(item.icon)" @error="setDefault(item)" alt="Image" />
                <div style="padding: 14px">
                    <span>{{ item.name }}{{ item.version }}</span>
                    <hr>
                    <div class="bottom">
                        <p class="desc">{{ item.description }}</p>
                        <p class="time">{{ item.arch }}</p>
                        <el-button text class="installBtn" @click="installServ(item)">安装</el-button>
                    </div>
                </div>
            </el-card>
        </el-col>
    </el-row>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ipcRenderer } from 'electron';
import { getList } from '../../api/service';
import { ElMessageBox } from 'element-plus'

const items = ref<Card[]>([]); // 用于存储所有卡片对象
const displayedItems = ref<Card[]>([]); // 用于存储当前显示的卡片对象

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
}
/**
 * 获取已经安装的玲珑程序
 */
function getInstalled() {
    ipcRenderer.send('execute-command', 'll-cli list');
    ipcRenderer.on('command-result', (_event, data) => {
        const apps = data.split("\n");
        // 第0条是分类项不是应用，需要剔除
        for (let index = 1; index < apps.length; index++) {
            const element = apps[index];
            if (element == null) return
            // 使用正则表达式来分割数据行
            const dataArray = element.match(/'[^']+'|\S+/g);
            // 现在 dataArray 包含了每个字段的值，包括可能包含空格的字段
            const appId = dataArray[0].replace(/'/g, ''); // 去除可能包含的单引号
            const name = dataArray[1].replace(/'/g, ''); // 去除可能包含的单引号
            const version = dataArray[2].replace(/'/g, ''); // 去除可能包含的单引号
            const arch = dataArray[3];
            const channel = dataArray[4];
            const module = dataArray[5];
            const description = dataArray[6];
            const item = {
                appId: appId,
                arch: arch,
                description: description,
                icon: null,
                id: null,
                name: name,
                version: version,
                channel: channel,
                module: module
            }
            console.log('当前'+ index +'的item',item);
            
        }
    })
}
/**
 * 根据分页条件查询网络玲珑应用
 * @param pageNo 页数
 * @param pageSize 每页条数
 */
const fetchData = async (pageNo: number, pageSize: number) => {
    const data = {
        page: pageNo,
        size: pageSize
    }
    getList(data).then(res => {
        console.log('res :>>', res);
        const temp = res.data.list;
        if (temp != null) {
            temp.forEach((item: Card) => {
                items.value.push(item);
                displayedItems.value.push(item);
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
const installServ = (item: any) => {
    console.log(item.appId);
    ipcRenderer.send('execute-command', 'll-cli install ' + item.appId);
    ipcRenderer.on('command-result', (_event, data) => {
        console.log(data);
        ElMessageBox.alert('安装成功');
    })
}

onMounted(() => {
    getInstalled();
    fetchData(pageNo, pageSize);
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

.image {
    width: 80%;
    margin: 10px;
}

.loading {
    text-align: center;
    padding: 10px;
}
</style>