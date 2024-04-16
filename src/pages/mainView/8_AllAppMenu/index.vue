<template>
    <div class="container" @scroll="handleScroll">
        <div class="new-container" v-if="allAppItemsStore.allAppItemList && allAppItemsStore.allAppItemList.length > 0">
            <div class="card-items" v-for="(item, index) in allAppItemsStore.allAppItemList" :key="index">
                <AllAppCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :loading="item.loading" :zhName="item.zhName"
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
import { pageResult } from '@/interface';
import { nextTick, onMounted, ref } from 'vue';
import AllAppCard from "@/components/allAppCard.vue";
import { getSearchAppList } from '@/api/server';
import router from '@/router';
import { onBeforeRouteLeave } from 'vue-router';
import elertTip from '@/util/NetErrorTips';

import { useInstalledItemsStore } from "@/store/installedItems";
import { useAllAppItemsStore } from "@/store/allAppItems";

const installedItemsStore = useInstalledItemsStore();
const allAppItemsStore = useAllAppItemsStore();

const params = ref({ pageNo: 1, pageSize: 50, name: '' })

// 滚动条监听事件
const handleScroll = async () => {
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
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
// 页面初始化时加载
onMounted(async () => {
    // 检测网络
    elertTip();
    // 查询程序展示软件列表
    const meta = router.currentRoute.value.meta;
    if (meta.savedPageNo && meta.savedPageSize) {
        const savedPageNo = meta.savedPageNo as number;
        const savedPageSize = meta.savedPageSize as number;
        const savedSearchName = meta.savedSearchName as string;
        params.value.pageNo = savedPageNo;
        params.value.pageSize = savedPageSize;
        params.value.name = savedSearchName;
    } else {
        allAppItemsStore.clearItems();
        // 获取显示的程序列表
        let res = await getSearchAppList(params.value);
        if (res.code == 200) {
            const record = (res.data as unknown as pageResult).records;
            record.forEach(item => {
                item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
                item.icon = item.icon?.includes("application-x-executable.svg") ? defaultImage : item.icon;
                allAppItemsStore.addItem(item);
            })
        }
    }
    // 等待下一次 DOM 更新
    await nextTick();
    // 恢复保存的滚动位置
    const container = document.getElementsByClassName('new-container')[0] as HTMLDivElement;
    if (container) {
        container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
    }
})
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('new-container')[0] as HTMLDivElement;
    if (container) {
        to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    }
    to.meta.savedPageNo = params.value.pageNo; // 将页码保存到路由元数据中
    to.meta.savedPageSize = params.value.pageSize; // 将每页条数保存到路由元数据中
    to.meta.savedTabName = `newRanking`; // 将搜索内容保存到路由元数据中
    next();
})
</script>
<style scoped>
.container {
    height: 100%;
    width: 100%;
    overflow-y: auto;
}

.new-container {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fill,minmax(190px,1fr));
    width: 100%;
}

.card-items {
    padding: 10px;
    flex: 1;
    min-width: 180px;
    max-width: 210px;
    border-radius: 5px;
    box-sizing: border-box;
    background: radial-gradient(circle at 50% 50%, transparent, #6E6E6E);
}

.no-data-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
    display: none;
}

@media (prefers-color-scheme: light) {
    .card-items {
        background: radial-gradient(circle at 50% 50%, transparent, #E2AB5F);
    }
}
</style>