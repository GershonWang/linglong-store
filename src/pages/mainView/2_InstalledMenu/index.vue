<template>
    <div class="container">
        <div class="card_container" v-if="installedStore.installedItemList && installedStore.installedItemList.length > 0">
            <div class="card_items" v-for="(item, index) in installedStore.installedItemList" :key="index">
                <InstalledCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :loading="item.loading"/>
            </div>
        </div>
        <div class="noDataContainer" v-else>
            <div class="imageDiv">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>系统内无已安装程序</h1>
        </div>
    </div>
</template>

<script setup lang="ts">
import InstalledCard from "@/components/installCard.vue";
import defaultImage from '@/assets/logo.svg';
import { useInstalledItemsStore } from "@/store/installedItems";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { nextTick, onMounted } from "vue";

const installedStore = useInstalledItemsStore();
// 路由对象
const router = useRouter();
// 组件初始化时加载
onMounted(async () => {
    // 等待下一次 DOM 更新
    await nextTick();
    // 恢复保存的滚动位置
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
    container.scrollTop = Number(router.currentRoute.value.meta.savedPosition) || 0;
});
// 在router路由离开前执行
onBeforeRouteLeave((to, _from, next) => {
    const container = document.getElementsByClassName('container')[0] as HTMLDivElement;
    to.meta.savedPosition = container.scrollTop; // 将滚动位置保存到路由元数据中
    next();
})
</script>

<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}

.card_container {
    display: grid;
    grid-gap: 10px;
    margin-right: 12px;
    grid-template-columns: repeat(auto-fill,minmax(180px,1fr));
}

.card_items {
    padding: 10px;
    flex: 1;
    min-width: 180px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}

.noDataContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.imageDiv {
    width: 180px;
    height: 300px
}
</style>