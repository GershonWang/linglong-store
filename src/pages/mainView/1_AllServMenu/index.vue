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
        <div class="card_container" v-if="displayedItems && displayedItems.length > 0">
            <div class="card_items" v-for="(item, index) in displayedItems" :key="index">
                <allServCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading" />
            </div>
        </div>
        <div class="noDataContainer" v-else>
            <div class="imageDiv">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>查无数据</h1>
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import allServCard from "@/components/allServCard.vue";
import { CardFace } from '@/interface';
import defaultImage from '@/assets/logo.svg';
import elertTip from "@/util/NetErrorTips";
// 引入 lodash 中的 debounce 函数(延时请求，防抖动)
import debounce from 'lodash/debounce';
import { useAllServItemsStore } from "@/store/allServItems";

const allServItemsStore = useAllServItemsStore();
// 获取全部程序列表
const allItems = allServItemsStore.allServItemList;
// 获取显示的程序列表
const displayedItems = reactive<CardFace[]>([]);
// 是否显示搜索框
const show = ref(false);
// 搜索框对象
const inputRef = ref<HTMLElement>();
// 搜索框输入的值
const searchName = ref('');
// 记录是否启用滚动条查询
let isScrollQuery = ref(true);
// 路由对象
const router = useRouter();
// 记录当前页数
let pageNo = ref(1);
let pageSize = ref(50);
// 搜索框监听输入变更事件
const searchSoft = debounce(async () => {
    // 执行搜索前，都进行数组的重置操作
    displayedItems.splice(0, displayedItems.length);
    // 执行搜索前，都进行页码重置到第一页的操作
    pageNo.value = 1;
    const msg = searchName.value;
    // 消息内容存在时，修改滚动条监听事件的状态为false
    isScrollQuery.value = !msg;
    if (allItems && allItems.length > 0) { // 网络应用数据不为空才进行后续操作
        let max = msg ? allItems.length : 50;
        // 根据消息msg对象是否为空，设置页码重置
        pageSize.value = max;
        // 遍历数组，根据消息msg对象是否为空，设置数组显示内容
        for (let index = 0; index < max; index++) {
            const element: CardFace = allItems[index];
            const name = element.name.toLowerCase();
            const description = element.description?.toLowerCase();
            const message = msg.toLowerCase();
            if (name.includes(message) || description?.includes(message)) {
                displayedItems.push(element);
            }
        }
        // 等待下一次 DOM 更新
        await nextTick();
        // 恢复保存的滚动位置
        const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
        container.scrollTop = 0;
    }
},500) 
// 明细页返回执行事件
const recover = async (msg: string, savedPageNo: number, savedPageSize: number) => {
    // 执行搜索前，都进行数组的重置操作
    displayedItems.splice(0, displayedItems.length);
    // 执行搜索前，都进行页码重置到第一页的操作
    pageNo.value = savedPageNo;
    pageSize.value = savedPageSize;
    // 消息内容存在时，修改滚动条监听事件的状态为false
    isScrollQuery.value = !msg;
    if (allItems && allItems.length > 0) { // 网络应用数据不为空才进行后续操作
        const temp = reactive<CardFace[]>([]);
        for (let index = 0; index < allItems.length; index++) {
            const element: CardFace = allItems[index];
            const name = element.name.toLowerCase();
            const description = element.description?.toLowerCase();
            const message = msg.toLowerCase();
            if (name.includes(message) || description?.includes(message)) {
                temp.push(element);
            }
        }
        if (temp.length > 0) {
            let endNum = savedPageNo * savedPageSize;
            if (endNum > temp.length) endNum = temp.length;
            for (let index = 0; index < endNum; index++) {
                const element: CardFace = temp[index];
                displayedItems.push(element);
            }
        }
        // 等待下一次 DOM 更新
        await nextTick();
        // 恢复保存的滚动位置
        const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
        container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
    }
}
// 滚动条监听事件
const handleScroll = () => {
    if (isScrollQuery.value) {
        const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
        // 判断滚动条位置是否接近底部，如果接近则加载更多数据(滚动位置 + 窗口高度 >= 内容高度)
        if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
            let startNum = pageNo.value * pageSize.value; // 当前起始索引
            let endNum = startNum + pageSize.value; // 加一页
            if (startNum > allItems.length) return;
            if (endNum > allItems.length) endNum = allItems.length;
            for (let index = startNum; index < endNum; index++) {
                const element = allItems[index];
                displayedItems.push(element);
            }
            pageNo.value++;
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
// 组件初始化时加载
onMounted(() => {
    // 检测网络
    elertTip();
    // 查询程序展示软件列表
    const meta = router.currentRoute.value.meta;
    if (meta.savedPageNo && meta.savedPageSize) {
        const savedPageNo = meta.savedPageNo as number;
        const savedPageSize = meta.savedPageSize as number;
        const savedSearchName = meta.savedSearchName as string;
        searchName.value = savedSearchName;
        recover(savedSearchName, savedPageNo, savedPageSize);
    } else {
        // 路由对象
        const router = useRouter();
        // 路由传递的对象
        const query = router.currentRoute.value.query;
        if (query.appId) {
            let msg = '';
            if (query.appId == 'system') {
                msg = 'deepin';
            } else if (query.appId == 'game') {
                msg = '游戏';
            } else if (query.appId == 'development') {
                msg = '开发';
            }
            searchName.value = msg;
            recover(msg, 1, 50);
        } else {
            searchSoft();
        }
    }
});
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    to.meta.savedPageNo = pageNo.value; // 将页码保存到路由元数据中
    to.meta.savedPageSize = pageSize.value; // 将每页条数保存到路由元数据中
    to.meta.savedSearchName = searchName.value; // 将搜索内容保存到路由元数据中
    next();
})
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
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.card_items {
    padding: 10px;
    flex: 1;
    min-width: 180px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}

.noDataContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.imageDiv {
    width: 180px;
    height: 300px
}
</style>