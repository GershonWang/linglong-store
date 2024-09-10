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
            </div>
        </div>
    </div>
    <div ref="appsContainer" style="height: calc(100% - 70px);overflow-y: auto;" @scroll="onScroll">
        <div class="card-items-container" v-if="allAppItemsStore.allAppItemList && allAppItemsStore.allAppItemList.length > 0">
            <div class="card-items" v-for="(item, index) in allAppItemsStore.allAppItemList" :key="index">
                <AllAppCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading" :zhName="item.zhName"
                    :size="item.size" :categoryName="item.categoryName"/>
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px;">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>暂无数据</h1>
        </div>
    </div>
    <div class="loading-container" :class="{ 'show': isLoading }">
        <img :src="loadingGIF" width="100%" height="100%" style="border-radius: 15px;"/>
    </div>
</template>
<script setup lang="ts">
import defaultImage from '@/assets/logo.svg';
import loadingGIF from "@/assets/loading.gif";
import { nextTick, onMounted, ref } from 'vue';
import AllAppCard from "@/components/allAppCard.vue";
import { getSearchAppList, getDisCategoryList } from '@/api/server';
import router from '@/router';
import { onBeforeRouteLeave } from 'vue-router';
import { useSystemConfigStore } from "@/store/systemConfig";
import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";

const systemConfigStore = useSystemConfigStore();
const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();

const appsContainer = ref<HTMLDivElement>()
const categoryList = ref<any[]>([{ "categoryId": "", "categoryName": "全部程序" }]);
const isLoading = ref<boolean>(false);
const params = ref({ name: '', categoryId: '', repoName: systemConfigStore.defaultRepoName, pageNo: 1, pageSize: 50 })

// 方法：加载更多内容
const loadMore = async () => {
  if (isLoading.value) return; // 防止重复请求

  isLoading.value = true;

  try {
    const res = await getSearchAppList(params.value);
    if (res.code == 200) {
        res.data.records.forEach(item => {
            item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
            item.icon = !item.icon || item.icon.includes("application-x-executable.svg") ? defaultImage : item.icon;
            allAppItemsStore.addItem(item);
        })
        params.value.pageNo ++;
    }
  } catch (error) {
    console.error('Failed to load data', error);
  } finally {
    isLoading.value = false;
  }
};

// 搜索功能
const handleSearch = async () => {
    allAppItemsStore.clearItems();
    // 获取显示的程序列表
    params.value.pageNo = 1;
    loadMore();
}

// 滚动加载事件
const onScroll = (event: Event) => {
  const container = event.target as HTMLElement;
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 10) {
    loadMore(); // 滚动到底部，加载更多内容
  }
};

// 页面初始化时加载
onMounted(async () => {
    // 获取分类列表
    let res = await getDisCategoryList();
    if (res.code == 200) {
        res.data.forEach(item => categoryList.value.push({ categoryId: item.categoryId, categoryName: item.categoryName }))
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
    to.meta.savedPosition = appsContainer.value ? appsContainer.value.scrollTop : 0; // 将滚动位置保存到路由元数据中
    to.meta.savedSearchName = params.value.name; // 将搜索名称保存到路由元数据中
    to.meta.savedCategoryId = params.value.categoryId; // 将分类ID保存到路由元数据中
    to.meta.savedPageNo = params.value.pageNo; // 将页码保存到路由元数据中
    to.meta.savedPageSize = params.value.pageSize; // 将每页条数保存到路由元数据中
    next();
})
</script>
<style scoped>
.loading-container {
  position: fixed;
  bottom: 25px;
  right: 38%;
  width: 12%;
  height: 60px; /* 根据需要调整高度 */
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 1s ease-out;
  transform: translateY(200%); /* 默认隐藏 */
}

.loading-container.show {
  transform: translateY(0); /* 显示状态 */
}
</style>