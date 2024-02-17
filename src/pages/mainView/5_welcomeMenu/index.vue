<template>
    <div class="container">
        <div class="card_container" v-if="welcomeItemsStore.welcomeItems && welcomeItemsStore.welcomeItems.length > 0">
            <div class="card_items" v-for="(item, index) in welcomeItemsStore.welcomeItems" :key="index">
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
import { useWelcomeItemsStore } from "@/store/welcomeItems";
import defaultImage from '@/assets/logo.svg';

const welcomeItemsStore = useWelcomeItemsStore();
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