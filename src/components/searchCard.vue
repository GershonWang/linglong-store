<template>
    <el-card class="search-container">
        <div class="image-div" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="name" :title="name">{{ name }}</span>
        <span class="zh-name">{{ defaultName }}</span>
        <span class="version">{{ version }}</span>
        <div class="bottom" v-loading="loading" :element-loading-svg="svg" element-loading-svg-view-box="-10, -10, 50, 50"
            element-loading-background="rgba(122, 122, 122, 0.8)">
            <div class="arch">{{ arch }}</div>
            <el-button class="uninstall-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="install-btn" v-else @click="openDetails">安装</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CardFace, OpenDetailParams } from "@/interface";
import { LocationQueryRaw, useRouter } from 'vue-router';

const router = useRouter();

// 接受父组件传递的参数，并设置默认值
// icon: "https://linglong.dev/asset/logo.svg",
const props = withDefaults(defineProps<CardFace>(), {
    appId: "",
    name: "程序名称",
    arch: "X86_64",
    version: "0.0.1",
    description: "描述说明",
    icon: "",
    isInstalled: true,
    loading: false,
})
// 计算属性
const desc = computed(() => {
    return props.description.replace(/(.{20})/g, '$1\n');
});
const defaultName = computed(() => {
    return props.zhName ? props.zhName : props.name;
})
// 加载的svg动画
const svg = `<path class="path" d="M 30 15 L 28 17 M 25.61 25.61 A 15 15, 0, 0, 1, 15 30 A 15 15, 0, 1, 1, 27.99 7.5 L 15 15" style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>`
// 打开不同版本页面
const openDetails = () => {
    let queryParams: LocationQueryRaw = {
        menuName: '分类推荐',
        ...props,
    } as OpenDetailParams as unknown as LocationQueryRaw;
    router.push({ path: '/details', query: queryParams });
}
</script>

<style scoped>
.search-container {
    width: 100%;
    position: relative;
    background: radial-gradient(circle at 50% 20%, #6E6E6E, transparent);
    border: none;
}

:deep(.el-card__body) {
    padding-top: 0px;
}

.image-div {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    width: 120px;
    height: 120px;
}

.name {
    display: flex;
    text-align: center;
    justify-content: center;
    font-size: 14px;
    margin: 3px auto 3px;
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #9f9f9f;
}

.zh-name {
    background-color: #6d6d6d;
    display: flex;
    justify-content: center;
    white-space: nowrap;
    border-radius: 5px;
    font-size: 16px;
    color: #E2E2E2;
    padding: 3px;
}

.version {
    display: flex;
    justify-content: center;
    border-radius: 5px;
    font-size: 14px;
    color: #9f9f9f;
}

.bottom {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.arch {
    font-size: 14px;
    color: white;
}

.install-btn {
    height: 24px;
    width: 58px;
    background-color: blue;
    color: white;
    border: none;
}

.install-btn:hover {
    background-color: #c9c9ef;
    color: #2D2F2F;
}

.uninstall-btn {
    height: 24px;
    width: 58px;
    background-color: red;
    color: white;
    border: none;
}

.uninstall-btn:hover {
    background-color: #c9c9ef;
    color: #2D2F2F;
}

@media (prefers-color-scheme: light) {
    .name {
        color: #000;
    }

    .version {
        color: #000;
    }
}
</style>