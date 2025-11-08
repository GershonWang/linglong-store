<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item class="first-menu" @click="router.back">{{ query.menuName }}</el-breadcrumb-item>
        <el-breadcrumb-item class="second-menu">{{ query.name }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div ref="appsContainer" class="apps-container" @scroll="handleScroll">
        <div class="card-items-container" v-if="allAppItemList && allAppItemList.length > 0">
            <div class="card-items" v-for="(item, index) in allAppItemList" :key="index">
                <Card :tabName="`分类推荐`" :icon="item.icon" :appId="item.appId" :name="item.name" :zhName="item.zhName" :kind="item.kind"
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
import { ArrowRight } from '@element-plus/icons-vue'
import Card from '@/components/Card.vue';
import NoData from "@/components/NoData.vue";
import { useSystemConfigStore } from '@/store/systemConfig';
import { useAllAppItemsStore } from '@/store/allAppItems';
import { useInstalledItemsStore } from '@/store/installedItems';
import { getSearchAppList } from '@/api';
import { logger } from '@/util/logger';
import loadingGIF from "@/assets/loading.gif";

// 通过路由router对象获取相关数据
const router = useRouter();
const meta = router.currentRoute.value.meta;
const query = router.currentRoute.value.query;
// 获取全部程序列表
const systemConfigStore = useSystemConfigStore();
const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();

const appsContainer = ref<HTMLDivElement>();
const isLoading = ref(false);

let arch = systemConfigStore.arch;
let repoName = systemConfigStore.defaultRepoName;

let allAppItemList = allAppItemsStore.allAppItemList;

const params = ref({ categoryId:'', repoName, arch, pageNo:1, pageSize:50 })

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
        }
    } catch (error) {
        logger.error('Failed to load data', error);
    } finally {
        isLoading.value = false;
    }
};

// 滚动条监听事件
const handleScroll = async (event: Event) => {
    const container = event.target as HTMLDivElement;
    // 判断滚动条位置是否接近底部，如果接近则加载更多数据(滚动位置 + 窗口高度 >= 内容高度)
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
        loadMore(); // 滚动到底部，加载更多内容
    }
}

// 页面初始化时加载
onMounted(async () => {
    // 根据路由状态参数进行查询初始化页面数据
    if (meta.savedPageNo && meta.savedPageSize) {
        params.value.categoryId = meta.savedCategoryId as string;
        params.value.pageNo = meta.savedPageNo as number;
        params.value.pageSize = meta.savedPageSize as number;
    } else {
        allAppItemsStore.clearItems();
        params.value.categoryId = query.categoryId as string;
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
    to.meta.savedPageNo = params.value.pageNo; // 将页码保存到路由元数据中
    to.meta.savedPageSize = params.value.pageSize; // 将每页条数保存到路由元数据中
    next();
})
</script>
<style scoped>
.apps-container {
    height: calc(100% - 37px);
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