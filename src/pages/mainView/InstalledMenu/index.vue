<template>
    <div class="apps-container">
        <div class="card-items-container" v-if="displayedItems.length > 0">
            <div class="card-items" v-for="(item, index) in displayedItems" :key="index">
                <Card :tabName="`卸载程序`" :icon="item.icon" :appId="item.appId" :name="item.name" :zhName="item.zhName" :kind="item.kind"
                    :arch="item.arch" :channel="item.channel" :categoryName="item.categoryName" :version="item.version" :base="item.base"
                    :description="item.description" :createTime="item.createTime" :installCount="item.installCount" :module="item.module"
                    :isInstalled="item.isInstalled" :loading="item.loading" :runtime="item.runtime" :devName="item.devName"/>
            </div>
        </div>
        <NoData v-else />
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from "vue";
import { InstalledEntity } from "@/interface";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstalledItemsStore } from "@/store/installedItems";
import Card from "@/components/Card.vue";
import NoData from "@/components/NoData.vue";

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();

// 用于显示列表
const displayedItems = ref<InstalledEntity[]>([]);

const displayedItemss = () => {
    let datas = installedItemsStore.installedItemList;
    // 根据是否显示基础服务进行过滤
    if (!systemConfigStore.isShowBaseService && datas && datas.length > 0) {
        datas = datas.filter(item => item.kind == 'app');
    }
    displayedItems.value = datas;
}
// 监听安装项列表的变化
watchEffect(() => displayedItemss());
// 组件初始化时加载
onMounted(() => displayedItemss());
</script>