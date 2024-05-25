<template>
    <div class="apps-container">
        <div class="card-items-container" v-if="displayedItems && displayedItems.length > 0">
            <div class="card-items" v-for="(item, index) in displayedItems" :key="index">
                <rankingServCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch" :channel="`newRanking`"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading" :createTime="item.createTime"
                    :zhName = "item.zhName" :size="item.size"/>
            </div>
        </div>
        <div class="no-data-container" v-else>
            <div style="width: 180px;height: 300px">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>查无数据</h1>
        </div>
    </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import defaultImage from '@/assets/logo.svg';
import rankingServCard from '@/components/rankingServCard.vue';
import { getNewAppList } from '@/api/server';
import { AppListParams, CardFace, pageResult } from '@/interface';
import { useInstalledItemsStore } from "@/store/installedItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { onBeforeRouteLeave } from 'vue-router';
import router from '@/router';

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();

let params = ref<AppListParams>({ 
    repoName: systemConfigStore.defaultRepoName,
    pageNo: 1, 
    pageSize: 100 
})

let displayedItems = ref<CardFace[]>([]);

onMounted(async () => {
    let res = await getNewAppList(params.value);
    if (res.code == 200) {
        displayedItems.value = (res.data as unknown as pageResult).records;
        displayedItems.value.forEach(item => {
            item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
            item.icon = item.icon?.includes("application-x-executable.svg") ? defaultImage : item.icon;
        })
    }
    // 等待下一次 DOM 更新
    await nextTick();
    // 恢复保存的滚动位置
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
})
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('apps-container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    to.meta.savedPageNo = params.value.pageNo; // 将页码保存到路由元数据中
    to.meta.savedPageSize = params.value.pageSize; // 将每页条数保存到路由元数据中
    to.meta.savedTabName = `newRanking`; // 将搜索内容保存到路由元数据中
    next();
})
</script>