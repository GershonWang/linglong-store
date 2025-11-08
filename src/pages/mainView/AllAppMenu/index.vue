<template>
    <div class="header">
        <div class="header-left">
            <div class="header-left-title">
                <!-- 使用下拉框的形式展示分类列表，包含全部程序以及来自接口请求的列表 -->
                <el-select v-model="params.categoryId" placeholder="请选择" @change="handleSearch">
                    <el-option v-for="item in categoryList" :key="item.categoryId" :label="item.categoryName"
                        :value="item.categoryId"></el-option>
                </el-select>
            </div>
        </div>
        <div class="header-right">
            <div class="header-right-search">
                <el-input v-model="params.name" placeholder="请输入软件名称" @keyup.enter="handleSearch" />
                <el-button type="primary" @click="handleSearch">搜索</el-button>
                <el-button type="default" @click="handleReset">重置</el-button>
            </div>
        </div>
    </div>
    <div v-if="isFirstLoad" class="apps-container"></div>
    <div v-else class="apps-container" ref="appsContainer" @scroll="handleScroll">
        <div class="card-items-container" v-if="allAppItemList && allAppItemList.length > 0">
            <div class="card-items" v-for="(item, index) in allAppItemList" :key="index">
                <Card :tabName="`全部程序`" :icon="item.icon" :appId="item.appId" :name="item.name" :zhName="item.zhName" :kind="item.kind"
                    :arch="item.arch" :channel="item.channel" :categoryName="item.categoryName" :version="item.version" :base="item.base"
                    :description="item.description" :createTime="item.createTime" :installCount="item.installCount" :module="item.module"
                    :isInstalled="item.isInstalled" :loading="item.loading" :runtime="item.runtime" :devName="item.devName"/>
            </div>
        </div>
        <NoData v-else />
    </div>
    <div class="loading-bottom" :class="{ 'show': isLoading }">
        <img :src="loadingGIF" width="100%" height="100%" style="border-radius: 15px;" />
    </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import Card from "@/components/Card.vue";
import NoData from "@/components/NoData.vue";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { getSearchAppList } from '@/api';
import { logger } from '@/util/logger';
import loadingGIF from "@/assets/loading.gif";

// 通过路由router对象获取相关数据
const router = useRouter();
const meta = router.currentRoute.value.meta;

const systemConfigStore = useSystemConfigStore();
const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();

const appsContainer = ref<HTMLDivElement>()
const categoryList = localStorage.getItem('categories') ? JSON.parse(localStorage.getItem('categories') as string) : [];
// 是否是第一次加载(决定是否显示查无数据)
const isFirstLoad = ref(true);
// 页面加载状态
const isLoading = ref(false);

let arch = systemConfigStore.arch;
let repoName = systemConfigStore.defaultRepoName;

let allAppItemList = allAppItemsStore.allAppItemList;

// 初始化入参
const params = ref({ name: '', categoryId: '', repoName: repoName, arch: arch, pageNo: 1, pageSize: 50 })

// 方法：加载更多内容
const loadMore = async () => {
    if (isLoading.value) return; // 防止重复请求
    isLoading.value = true;
    try {
        const res = await getSearchAppList(params.value);
        if (res.code == 200) {
            res.data.records.forEach(item => {
                item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
                allAppItemsStore.addItem(item);
            })
            params.value.pageNo++;
            isFirstLoad.value = false;
        }
    } catch (error) {
        logger.error('Failed to load data', error);
    } finally {
        isLoading.value = false;
    }
};

// 搜索功能
const handleSearch = async () => {
    allAppItemsStore.clearItems();
    // 获取显示的程序列表
    params.value.pageNo = 1;
    isFirstLoad.value = true;
    loadMore();
}

// 重置功能
const handleReset = async () => {
    // 重置搜索参数
    params.value.name = '';
    params.value.categoryId = '';
    params.value.pageNo = 1;
    
    // 清空应用列表
    allAppItemsStore.clearItems();
    
    // 重置为第一次加载状态
    isFirstLoad.value = true;
    
    // 重新加载数据
    await loadMore();
}

// 滚动加载事件
const handleScroll = (event: Event) => {
    const container = event.target as HTMLElement;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
        loadMore(); // 滚动到底部，加载更多内容
    }
};

// 页面初始化时加载
onMounted(async () => {
    // 查询程序展示软件列表
    if (meta.savedPageNo && meta.savedPageSize) {
        params.value.name = meta.savedSearchName as string;
        params.value.categoryId = meta.savedCategoryId as string;
        params.value.pageNo = meta.savedPageNo as number;
        params.value.pageSize = meta.savedPageSize as number;
        // 标识设定不是第一次加载
        isFirstLoad.value = false;
    } else {
        allAppItemsStore.clearItems();
        loadMore();
    }
    // 等待下一次 DOM 更新
    await nextTick();
    // 恢复保存的滚动位置
    if (appsContainer.value) {
        appsContainer.value.scrollTop = Number(meta.savedPosition) || 0;
    }
})
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    to.meta.savedPosition = appsContainer.value?.scrollTop; // 将滚动位置保存到路由元数据中
    to.meta.savedCategoryId = params.value.categoryId; // 将分类ID保存到路由元数据中
    to.meta.savedSearchName = params.value.name; // 将搜索名称保存到路由元数据中
    to.meta.savedPageNo = params.value.pageNo; // 将页码保存到路由元数据中
    to.meta.savedPageSize = params.value.pageSize; // 将每页条数保存到路由元数据中
    next();
})
</script>
<style scoped>
.apps-container {
    height: calc(100% - 70px);
}

.loading-bottom {
    height: 20px;
    width: 100px;
    background-color: rgba(255, 255, 255, 0.3);
    /* 可选：背景颜色和透明度 */
    z-index: 1000;
    /* 确保图层悬浮在其他内容之上 */
    position: fixed;
    /* 悬浮在页面上，始终可见 */
    bottom: 28px;
    /* 对齐页面底部 */
    left: 50%;
    /* 左侧对齐页面中心 */
    padding: 10px 20px;
    /* 可选：内边距 */
    border-radius: 8px;
    /* 可选：圆角效果 */
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    /* 可选：阴影效果 */
    transition: transform 1.5s ease-out;
    /* 默认隐藏 */
    transform: translateY(200%);
}

.loading-bottom.show {
    transform: translateY(0);
    /* 显示状态 */
}
</style>