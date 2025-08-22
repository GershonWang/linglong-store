<template>
    <div class="apps-container">
        <div class="card-items-container"
            v-if="updateItemsStore.updateItemList && updateItemsStore.updateItemList.length > 0">
            <div class="card-items" v-for="(item, index) in updateItemsStore.updateItemList" :key="index">
                <Card :tabName="`更新程序`" :icon="item.icon" :appId="item.appId" :name="item.name" :zhName="item.zhName" :kind="item.kind"
                    :arch="item.arch" :channel="item.channel" :categoryName="item.categoryName" :version="item.version" :base="item.base"
                    :description="item.description" :createTime="item.createTime" :installCount="item.installCount" :module="item.module"
                    :isInstalled="true" :loading="item.loading" :runtime="item.runtime" :newVersion="item.newVersion" :devName="item.devName" />
            </div>
        </div>
        <NoData v-else />
        <transition name="el-zoom-in-bottom">
            <div v-show="updateItemsStore.updateItemList.length > 0" class="transition-update-btn">
                <el-button type="primary" @click="updateAll" :disabled="updateStatusStore.updateStatus">一键更新</el-button>
            </div>
        </transition>
    </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";
import Card from "@/components/Card.vue";
import NoData from "@/components/NoData.vue";
import { InstalledEntity } from "@/interface";
import { reflushUpdateItems } from "@/util/WorkerUpdate";

import { useUpdateStatusStore } from "@/store/updateStatus";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useAllAppItemsStore } from "@/store/allAppItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useUpdateItemsStore } from "@/store/updateItems";

const updateStatusStore = useUpdateStatusStore();
const installingItemsStore = useInstallingItemsStore();
const allAppItemsStore = useAllAppItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const updateItemsStore = useUpdateItemsStore();

// 一键更新按钮点击事件
const updateAll = () => {
    updateStatusStore.changeUpdateStatus(true); // 更改一键更新状态为true
    updateItemsStore.updateItemList.forEach((item) => {
        allAppItemsStore.updateItemLoadingStatus(item, true);
        installedItemsStore.updateItemLoadingStatus(item, true);
        difVersionItemsStore.updateItemLoadingStatus(item, true);
        updateItemsStore.updateItemLoadingStatus(item, true);
        // 新增到加载中列表
        installingItemsStore.addItem(item as InstalledEntity); 
    })
}
// 页面打开时执行
onMounted(async () => reflushUpdateItems());
</script>
<style scoped>
.transition-update-btn {
    height: 64px;
    width: 120px;
    color: #fff;
    background: radial-gradient(circle at 50% 20%, #6E6E6E, transparent);
    text-align: center;
    padding: 16px;
    border-radius: 10px;
    box-sizing: border-box;
    position: fixed;
    bottom: 12px;
    left: 50%;
    z-index: 2;
}

@media (prefers-color-scheme: light) {
    .transition-update-btn {
        background: radial-gradient(circle at 50% 50%, transparent, #E2AB5F);
    }
}
</style>