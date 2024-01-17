<template>
    <div class="search">
        <transition name="el-zoom-in-bottom">
            <div v-show="show" class="transition-box">
                <el-input ref="inputRef" v-model="searchName" placeholder="请输入要搜索的程序名" style="width: 300px;"
                    @input="searchSoft">
                    <template #prefix>
                        <el-icon class="el-input__icon">
                            <search />
                        </el-icon>
                    </template>
                </el-input>
            </div>
        </transition>
        <div class="search_image">
            <img src="@/assets/search.svg" @click="openInput(show)">
        </div>
    </div>
    <div class="container" @scroll="handleScroll">
        <div class="card_container" v-if="hasData">
            <div class="card_items" v-for="(item, index) in displayedItems" :key="index">
                <Card :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :index="index" />
            </div>
        </div>
        <div class="card_container" v-else>
            <div style="position: absolute;left: 50%;transform: translate(-50%);text-align: center;">
                <h1>查无数据</h1>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ipcRenderer } from 'electron';
import { ElNotification } from 'element-plus'
import { CardFace } from "@/components/CardFace";
import Card from "@/components/Card.vue";
import { useAllItemsStore, useInstalledItemsStore } from "@/store/items";

const allItemsStore = useAllItemsStore();
const installedItemsStore = useInstalledItemsStore();
// 获取全部程序列表
const allItems = allItemsStore.getItems();
// 获取已安装程序列表
let installedItems = installedItemsStore.getItems();
// 获取显示的程序列表
const displayedItems = reactive<CardFace[]>([]);
// 是否显示搜索框
const show = ref(false);
// 搜索框对象
const inputRef = ref<HTMLElement>();
// 搜索框输入的值
const searchName = ref('');
// 重试次数
let retryNum = ref(0);
// 记录是否启用滚动条查询
let isScrollQuery = ref(true);
// 记录当前页数
let pageNo = ref(1);
let pageSize = ref(50);
// 是否有列表数据
let hasData = ref(false);

// 搜索框监听输入变更事件
const searchSoft = (msg: string) => {
    // 执行搜索前，都进行数组的重置操作
    displayedItems.splice(0, displayedItems.length);
    if (!allItems) {
        console.log("全部程序查询为空...");
        hasData.value = false;
        return;
    }
    // 修改滚动条监听事件的状态
    isScrollQuery.value = !msg;
    hasData.value = true;
    let max = msg ? allItems.length : 50;
    // 根据消息msg对象是否为空，设置页码重置
    if (!msg) {
        pageNo.value = 1;
        pageSize.value = max;
    }
    // 遍历数组，根据消息msg对象是否为空，设置数组显示内容
    for (let index = 0; index < max; index++) {
        const element: CardFace = allItems[index];
        const name = element.name.toLowerCase();
        const message = msg.toLowerCase();
        if (name.includes(message)) {
            element.isInstalled = installedItems.some(it => it.appId == element.appId && it.version == element.version);
            displayedItems.push(element);
        }
    }
}
// 搜索图标的点击事件
const openInput = (status: boolean) => {
    show.value = !status;
    if (inputRef.value) {
        if (status) {
            inputRef.value.blur();
        } else {
            inputRef.value.focus();
        }
    }
}
// 滚动条监听事件
const handleScroll = () => {
    if (!isScrollQuery.value) {
        console.log("滚动条监听事件被忽略...");
        return;
    }
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
    const scrollPosition = container.scrollTop; // 获取滚动位置
    const windowHeight = container.clientHeight; // 获取窗口高度
    const contentHeight = container.scrollHeight; // 获取内容高度
    // 判断滚动条位置是否接近底部，如果接近则加载更多数据
    if (scrollPosition + windowHeight >= contentHeight) {
        pageNo.value ++;
        let startNum = pageNo.value * pageSize.value;
        let endNum = startNum + pageSize.value;
        if (startNum > allItems.length) return;
        if (endNum > allItems.length) endNum = allItems.length;
        for (let index = startNum; index < endNum; index++) {
            const element = allItems[index];
            element.isInstalled = installedItems.some(it => it.appId == element.appId && it.version == element.version);
            displayedItems.push(element);
        }
    }
}
// 命令执行结束返回结果
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
            });
        }
        return;
    }
    // 返回结果 - 当前执行安装的应用信息
    if (params.command.startsWith('ll-cli install')) {
        const item = {
            index: params.index,
            icon: params.icon,
            name: params.name,
            version: params.version,
            description: params.description,
            arch: params.arch,
            isInstalled: true,
            appId: params.appId,
        }
        // 安装成功后，更新已安装应用列表
        displayedItems.splice(params.index, 1, item);
        // 安装成功后，更新已安装应用列表
        installedItems.push(item);
        // 安装成功后，弹出通知
        ElNotification({
            title: '安装成功',
            message: params.name + '(' + params.version + ')被成功安装!',
            type: 'success',
        });
    }
    // 返回结果 - 当前执行卸载的应用信息
    if (params.command.startsWith('ll-cli uninstall')) {
        const item = {
            index: params.index,
            icon: params.icon,
            name: params.name,
            version: params.version,
            description: params.description,
            arch: params.arch,
            isInstalled: false,
            appId: params.appId,
        }
        // 卸载成功后，更新已安装应用列表
        displayedItems.splice(params.index, 1, item);
        // 卸载成功后，更新已安装应用列表
        installedItems = installedItems.filter(item => item.appId !== params.appId);
        // 卸载成功后，弹出通知
        ElNotification({
            title: '卸载成功',
            message: params.name + '(' + params.version + ')被成功卸载!',
            type: 'success',
        });
    }
}
// 组件初始化时加载
onMounted(() => {
    ipcRenderer.on('command-result', commandResult);
    searchSoft(searchName.value); // 查询程序展示软件列表
});
// 在组件销毁时移除事件监听器
onBeforeUnmount(() => ipcRenderer.removeListener('command-result', commandResult));
</script>

<style scoped>
.search {
    margin: 10px auto;
    position: fixed;
    z-index: 999;
    bottom: 20px;
    right: 50px;
}

.transition-box {
    margin-bottom: 60px;
    border-radius: 10px;
    background-color: #335061;
    text-align: center;
    color: #fff;
    padding: 40px 20px;
    box-sizing: border-box;
    margin-right: 10px;
}

.search_image {
    height: 48px;
    position: fixed;
    bottom: 30px;
    right: 60px;
    border-radius: 15px;
    background-color: #335061;
    padding: 5px;
}

.container {
    height: 100%;
    overflow-y: auto;
}

.card_container {
    display: grid;
    grid-gap: 10px;
    margin-right: 12px;
    grid-template-columns: repeat(auto-fill, minmax(200px, auto));
}

.card_items {
    padding: 10px;
    flex: 1;
    min-width: 200px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}
</style>