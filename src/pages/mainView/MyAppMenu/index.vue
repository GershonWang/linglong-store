<template>
    <div class="apps-container">
        <div class="card-items-container" v-if="displayedItems.length > 0">
            <div class="card-items" v-for="(item, index) in displayedItems" :key="index">
                <Card :tabName="`我的应用`" :icon="item.icon" :appId="item.appId" :name="item.name" :zhName="item.zhName" :kind="item.kind"
                    :arch="item.arch" :channel="item.channel" :categoryName="item.categoryName" :version="item.version" :base="item.base"
                    :description="item.description" :createTime="item.createTime" :installCount="item.installCount" :module="item.module"
                    :isInstalled="true" :loading="false" :runtime="item.runtime" :devName="item.devName"/>
            </div>
        </div>
        <NoData v-else />
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref, watchEffect } from "vue";
import { InstalledEntity } from "@/interface";
import { useInstalledItemsStore } from "@/store/installedItems";
import Card from "@/components/Card.vue";
import NoData from "@/components/NoData.vue";

const installedItemsStore = useInstalledItemsStore();

// 用于显示列表
const displayedItems = ref<InstalledEntity[]>([]);

const displayedItemss = () => {
    // 获取安装的应用列表
    let datas = installedItemsStore.installedItemList;
    // 如果没有安装的应用，直接返回
    if (!datas || datas.length === 0) {
        displayedItems.value = [];
        return;
    }
    // 过滤出应用类型的安装项
    displayedItems.value = datas.filter(item => item.kind == 'app');
}
// 监听安装项列表的变化
watchEffect(() => displayedItemss());
// 组件初始化时加载
onMounted(() => displayedItemss());
</script>