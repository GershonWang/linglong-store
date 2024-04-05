<template>
    <div class="container">
        <el-carousel height="260px" type="card" :autoplay="false">
            <!-- direction="vertical" -->
            <el-carousel-item v-for="item in welcomeItemList" :key="item.appId">
                <img :src="item.icon" style="width: 150px; height: 150px;margin: 20px auto 0 auto;">
                <h1>{{ item.zhName }}</h1>
            </el-carousel-item>
        </el-carousel>
        <h1 style="margin-left: 25px;">珑珑推荐</h1>
        <!-- <el-divider /> -->
        <div style="height: 50%; overflow-y: auto">
            <div v-for="(group, groupIndex) in result" :key="groupIndex" class="row">
            <!-- 每五个一组的项目 -->
            <div v-for="(item, itemIndex) in group" :key="itemIndex" class="card_items">
                <WelcomeCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading" />
            </div>
        </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getWelcomeAppList } from "@/api/server";
import defaultImage from '@/assets/logo.svg';
import WelcomeCard from "@/components/welcomeCard.vue";
import { AppListParams, CardFace, pageResult } from "@/interface";
import { InstalledEntity } from "@/interface/InstalledEntity";
import { useWelcomeItemsStore } from "@/store/welcomeItems";
import { useInstalledItemsStore } from "@/store/installedItems";

const welcomeItemsStore = useWelcomeItemsStore();
const installedItemsStore = useInstalledItemsStore();

const result = ref<InstalledEntity[][]>([]);
const welcomeItemList = ref<CardFace[]>([]);

let params = ref<AppListParams>({ pageNo: 1, pageSize: 10 })

const groupedItems = () => {
    const welcomeItems: InstalledEntity[] = welcomeItemsStore.welcomeItemList;
    const chunkSize = 5;
    for (let i = 0; i < welcomeItems.length; i += chunkSize) {
        const items = welcomeItems.slice(i, i + chunkSize);
        result.value.push(items);
    }
}

onMounted(async () => {
    groupedItems();
    // 获取最受欢迎的前十名程序
    let res = await getWelcomeAppList(params.value);
    if (res.code == 200) {
        const records = (res.data as unknown as pageResult).records;
        records.forEach(item => {
            item.isInstalled = installedItemsStore.installedItemList.find(it => it.appId == item.appId) ? true : false;
            item.icon = item.icon?.includes("application-x-executable.svg") ? defaultImage : item.icon;
        })
        console.log('records', records);
        welcomeItemList.value = records;
    }
})
</script>
<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}

.row {
    display: flex;
    flex-wrap: nowrap;
    /* 不换行 */
    margin: 20px;
    /* 调整子元素之间的间距 */
}

.card_items {
    padding: 10px;
    margin: 10px;
    flex: 1;
    min-width: 180px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}

.el-carousel__item:nth-child(2n) {
    background-color: #99a9bf;
    text-align: center;
}

.el-carousel__item:nth-child(2n + 1) {
    background-color: #d3dce6;
    text-align: center;
}
</style>