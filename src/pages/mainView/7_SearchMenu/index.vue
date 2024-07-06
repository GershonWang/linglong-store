<template>
    <el-breadcrumb :separator-icon="ArrowRight">
        <el-breadcrumb-item class="first-menu" @click="router.back">{{ query.menuName }}</el-breadcrumb-item>
        <el-breadcrumb-item class="second-menu">{{ query.name }}</el-breadcrumb-item>
    </el-breadcrumb>
    <div ref="appsContainer" class="apps-container" @scroll="handleScroll">
        <div class="card-items-container" v-if="allAppItemsStore.allAppItemList && allAppItemsStore.allAppItemList.length > 0">
            <div class="card-items" v-for="(item, index) in allAppItemsStore.allAppItemList" :key="index">
                <SearchCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading" :zhName="item.zhName"
                    :size="item.size"/>
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px;">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>查无数据</h1>
        </div>
    </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { ArrowRight } from '@element-plus/icons-vue'
import SearchCard from "@/components/searchCard.vue";
import { pageResult } from '@/interface';
import defaultImage from '@/assets/logo.svg';
import elertTip from "@/util/NetErrorTips";
import { useSystemConfigStore } from '@/store/systemConfig';
import { useAllAppItemsStore } from '@/store/allAppItems';
import { useInstalledItemsStore } from '@/store/installedItems';
import { useRouter } from 'vue-router';
import { getSearchAppList } from '@/api/server';


// 通过路由router对象获取相关数据
const router = useRouter();
const meta = router.currentRoute.value.meta;
const query = router.currentRoute.value.query;
// 获取全部程序列表
const systemConfigStore = useSystemConfigStore();
const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();

const appsContainer = ref<HTMLDivElement>()

const params = ref({ 
    categoryId: '',
    repoName: systemConfigStore.defaultRepoName,
    pageNo: 1, 
    pageSize: 50
})

// 滚动条监听事件
const handleScroll = async () => {
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    // 判断滚动条位置是否接近底部，如果接近则加载更多数据(滚动位置 + 窗口高度 >= 内容高度)
    if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
        params.value.pageNo++;
        // 获取显示的程序列表
        let res = await getSearchAppList(params.value);
        if (res.code == 200) {
            (res.data as unknown as pageResult).records.forEach(item => {
                item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
                item.icon = item.icon?.includes("application-x-executable.svg") ? defaultImage : item.icon;
                allAppItemsStore.addItem(item);
            })
        }
    }
}
onMounted(async () => {
    elertTip(); // 检测网络
    // 根据路由状态参数进行查询初始化页面数据
    if (meta.savedPageNo && meta.savedPageSize) {
        params.value.categoryId = meta.savedCategoryId as string;
        params.value.pageNo = meta.savedPageNo as number;
        params.value.pageSize = meta.savedPageSize as number;
    } else {
        allAppItemsStore.clearItems();
        // 获取显示的程序列表
        params.value.categoryId = query.categoryId as string;
        params.value.pageNo = 1;
        params.value.pageSize = 50;
        let res = await getSearchAppList(params.value);
        if (res.code == 200) {
            (res.data as unknown as pageResult).records.forEach(item => {
                item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
                item.icon = item.icon?.includes("application-x-executable.svg") ? defaultImage : item.icon;
                allAppItemsStore.addItem(item);
            })
        }
    }
    // 等待下一次 DOM 更新
    await nextTick();
    // 恢复保存的滚动位置
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    if (container) {
        container.scrollTop = Number(meta.savedPosition) || 0;
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
</style>