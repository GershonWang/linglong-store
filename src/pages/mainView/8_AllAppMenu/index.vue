<template>
    <div class="header">
        <div class="header-left">
            <div class="header-left-title">
                <!-- 使用下拉框的形式展示分类列表，包含全部程序以及来自接口请求的列表 -->
                <el-select v-model="params.categoryId" placeholder="请选择" @change="handleSearch">
                    <el-option label="全部程序" value=""></el-option>
                    <el-option v-for="item in categoryList" :key="item.categoryId" :label="item.categoryName"
                        :value="item.categoryId"></el-option>
                    <!-- 动态生成选项 -->
                </el-select>
            </div>
        </div>
        <div class="header-right">
            <div class="header-right-search">
                <el-input v-model="params.name" placeholder="请输入软件名称" @keyup.enter="handleSearch" />
                <el-button type="primary" @click="handleSearch">搜索</el-button>
            </div>
        </div>
    </div>
    <div ref="appsContainer" class="apps-container" @scroll="handleScroll">
        <div class="card-items-container" v-if="allAppItemsStore.allAppItemList && allAppItemsStore.allAppItemList.length > 0">
            <div class="card-items" v-for="(item, index) in allAppItemsStore.allAppItemList" :key="index">
                <AllAppCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading" :zhName="item.zhName"
                    :size="item.size"/>
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px;">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>暂无数据</h1>
        </div>
    </div>
</template>
<script setup lang="ts">
import defaultImage from '@/assets/logo.svg';
import { Result, pageResult } from '@/interface';
import { nextTick, onMounted, ref } from 'vue';
import AllAppCard from "@/components/allAppCard.vue";
import { getSearchAppList, getDisCategoryList } from '@/api/server';
import router from '@/router';
import { onBeforeRouteLeave } from 'vue-router';
import elertTip from '@/util/NetErrorTips';
import { useInstalledItemsStore } from "@/store/installedItems";
import { useAllAppItemsStore } from "@/store/allAppItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const installedItemsStore = useInstalledItemsStore();
const allAppItemsStore = useAllAppItemsStore();
const systemConfigStore = useSystemConfigStore();

const appsContainer = ref<HTMLDivElement>()

const params = ref({ 
    pageNo: 1, 
    pageSize: 50, 
    name: '', 
    categoryId: '',
    repoName: systemConfigStore.defaultRepoName
})

let categoryList = ref<any[]>([]);

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
// 搜索功能
const handleSearch = async () => {
    allAppItemsStore.clearItems();
    // 获取显示的程序列表
    params.value.pageNo = 1;
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
// 页面初始化时加载
onMounted(async () => {
    elertTip(); // 检测网络
    // 获取分类列表
    let res = await getDisCategoryList();
    if (res.code == 200) {
        // 获取分类列表
        let codes = res.data as unknown as Result;
        (codes as unknown as any[]).forEach(item => {
            categoryList.value.push({
                categoryId: item.categoryId,
                categoryName: item.categoryName
            })
        })
    }
    // 查询程序展示软件列表
    const meta = router.currentRoute.value.meta;
    if (meta.savedPageNo && meta.savedPageSize) {
        params.value.name = meta.savedSearchName as string;
        params.value.categoryId = meta.savedCategoryId as string;
        params.value.pageNo = meta.savedPageNo as number;
        params.value.pageSize = meta.savedPageSize as number;
    } else {
        allAppItemsStore.clearItems();
        // 获取显示的程序列表
        params.value.name = '';
        params.value.categoryId = '';
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
    to.meta.savedSearchName = params.value.name; // 将搜索名称保存到路由元数据中
    to.meta.savedCategoryId = params.value.categoryId; // 将分类ID保存到路由元数据中
    to.meta.savedPageNo = params.value.pageNo; // 将页码保存到路由元数据中
    to.meta.savedPageSize = params.value.pageSize; // 将每页条数保存到路由元数据中
    next();
})
</script>
<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    padding-bottom: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 5px;
    border-radius: 5px;
}
.header-left {
    display: flex;
    align-items: center;
}
.header-left-title {
    margin-left: 10px;
}
.header-right {
    display: flex;
    align-items: center;
}
.header-right-search {
    display: flex;
    align-items: center;
    margin-right: 10px;
}

.apps-container {
    height: 92%;
}

@media (prefers-color-scheme: light) {
    .header {
        background: radial-gradient(circle at 50% 50%, transparent, #E2AB5F);
    }
}

@media (prefers-color-scheme: dark) {
    .header {
        background: radial-gradient(circle at 50% 50%, transparent, #6E6E6E);
    }
}
</style>