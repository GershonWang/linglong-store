<template>
    <div class="container">
        <div class="card_container">
            <div class="card_items" v-for="(item, index) in installedStore.installedItemList" :key="index">
                <Card :name="item.name" :version="item.version" :description="item.description" :arch="item.arch"
                    :isInstalled="true" :appId="item.appId" :icon="item.icon" :index="index" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import Card from "@/components/Card.vue";
import { useInstalledItemsStore } from "@/store/installedItems";

const installedStore = useInstalledItemsStore();
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
    grid-template-columns: repeat(auto-fill,minmax(200px,auto));
}

.card_items {
    padding: 10px;
    flex: 1;
    min-width: 200px;
    border: 1px solid #ccc;
    border-radius: 5px;
    box-sizing: border-box;
    background-color: #999999;
}
</style>