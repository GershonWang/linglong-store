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
                <AllCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading"/>
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
import { onMounted, reactive, ref } from 'vue';
import AllCard from "@/components/allCard.vue";
import { useAllServItemsStore } from "@/store/allServItems";
import { CardFace } from '@/interface/CardFace';

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
            displayedItems.push(element);
        }
    }
}
// 组件初始化时加载
onMounted(() => {
    searchSoft(searchName.value); // 查询程序展示软件列表
});
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
</style>@/interface/CardFace