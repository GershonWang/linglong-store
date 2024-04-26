<template>
    <el-card class="card-container">
        <div class="card-icon" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="card-name" :title="name">{{ name }}</span>
        <span class="card-zh-name">{{ defaultName }}</span>
        <span class="card-version">{{ version }}</span>
        <div class="card-bottom" v-loading="loading" :element-loading-svg="svg"
            element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <div class="card-arch" v-if="channel == 'downRanking'">下载 {{ installCount }}次</div>
            <div class="card-arch" v-else>{{ time }}</div>
            <el-button class="install-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="install-btn" v-else @click="openDetails">安装</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { CardFace, OpenDetailParams } from "@/interface";
import { computed } from "vue";
import { LocationQueryRaw, useRouter } from 'vue-router';

const router = useRouter();

// 接受父组件传递的参数
const props:CardFace = defineProps<CardFace>();
// 计算属性
const desc = computed(() => {
    let descri = props.description;
    if (descri) {
        return descri.replace(/(.{20})/g, '$1\n')
    }
    return ``;
});
const time = computed(() => {
    let create = props.createTime;
    if (create) {
        return create.split(' ')[0];
    }
    return `2099-01-01`;
})
const defaultName = computed(() => {
    return props.zhName ? props.zhName : props.name;
})
// 加载的svg动画
const svg = `<path class="path" d="M 30 15 L 28 17 M 25.61 25.61 A 15 15, 0, 0, 1, 15 30 A 15 15, 0, 1, 1, 27.99 7.5 L 15 15" style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>`
// 打开玲珑明细页面
const openDetails = () => {
    let queryParams: LocationQueryRaw = {
        menuName: '排行榜',
        ...props,
    } as OpenDetailParams as unknown as LocationQueryRaw;
    router.push({ path: '/details', query: queryParams });
}
</script>

<style scoped>
:deep(.el-card__body) {
  padding-top: 0px;
}
</style>