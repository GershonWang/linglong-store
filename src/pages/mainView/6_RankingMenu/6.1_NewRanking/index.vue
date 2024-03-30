<template>
    <div class="container">
        <div class="card_container" v-if="displayedItems && displayedItems.length > 0">
            <div class="card_items" v-for="(item, index) in displayedItems" :key="index">
                <rankingServCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch" :channel="`newRanking`"
                    :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading" :createTime="item.createTime"
                    :zhName = "item.zhName"/>
            </div>
        </div>
        <div class="noDataContainer" v-else>
            <div class="imageDiv">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>查无数据</h1>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import defaultImage from '@/assets/logo.svg';
import { getNewAppList } from '@/api/server';
import { AppListParams, CardFace, pageResult } from '@/interface';
import rankingServCard from '@/components/rankingServCard.vue';

let params = ref<AppListParams>({
    pageNo: 1,
    pageSize: 20
})

let displayedItems = ref<CardFace[]>([]);

onMounted(async () => {
    let res = await getNewAppList(params.value);
    if (res.code == 200) {
        displayedItems.value = (res.data as unknown as pageResult).records;
    }
})
</script>
<style scoped>
.container {
    height: 100%;
    width: 100%;
    overflow-y: auto;
}

.card_container {
    display: grid;
    grid-gap: 10px;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    width: 98%;
    height: 100%;
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