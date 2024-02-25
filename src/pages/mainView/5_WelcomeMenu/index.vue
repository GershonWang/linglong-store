<template>
    <div class="container">
        <h1 style="text-align: center;">珑珑推荐</h1>
        <el-divider />
        <div v-for="(group, groupIndex) in result" :key="groupIndex" class="row">
            <!-- 每五个一组的项目 -->
            <div v-for="(item, itemIndex) in group" :key="itemIndex" class="card_items">
                <WelcomeCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                :isInstalled="item.isInstalled" :appId="item.appId" :icon="item.icon" :loading="item.loading"/>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import WelcomeCard from "@/components/welcomeCard.vue";
import { InstalledEntity } from "@/interface/InstalledEntity";
import { useWelcomeItemsStore } from "@/store/welcomeItems";
import { onMounted, ref } from "vue";

const welcomeItemsStore = useWelcomeItemsStore();

const result = ref<InstalledEntity[][]>([]);

const groupedItems = () => {
    const welcomeItems: InstalledEntity[] = welcomeItemsStore.welcomeItemList;
    const chunkSize = 5;
    for (let i = 0; i < welcomeItems.length; i += chunkSize) {
        const items = welcomeItems.slice(i, i + chunkSize);
        result.value.push(items);
    }
}

onMounted(() => {
    groupedItems();
})
</script>
<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}

.row {
    display: flex;
    flex-wrap: nowrap; /* 不换行 */
    margin: 20px; /* 调整子元素之间的间距 */
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

</style>