<template>
    <div class="container">
        <div class="card_container" v-if="hasData">
            <div class="card_items" v-for="(item, index) in updateItems" :key="index">
                <updateCard :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :loading="item.loading"/>
            </div>
        </div>
        <div class="card_container" v-else>
            <div style="position: absolute;left: 50%;transform: translate(-50%);text-align: center;">
                <h1>暂无可更新程序</h1>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import updateCard from "@/components/updateCard.vue";
import { useUpdateItemsStore } from "@/store/updateItems";

const updateStore = useUpdateItemsStore();
// 是否有列表数据
let hasData = ref(false);
const updateItems = updateStore.updateItemList;
console.log(updateItems.length);
if (updateItems && updateItems.length > 0) {
    hasData.value = true;
}

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
</style>