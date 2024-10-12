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
    createTime: "2023-04-11 10:00:00",
    installCount: 0,
    channel: "",
    zhName: "",
    size: "",
})
// 计算属性
const desc = computed(() => {
    return props.description.replace(/(.{20})/g, '$1\n');
});
const defaultName = computed(() => {
    return props.zhName ? props.zhName : props.name;
});
// 加载的svg动画
const svg = `<path class="path" d="M 30 15 L 28 17 M 25.61 25.61 A 15 15, 0, 0, 1, 15 30 A 15 15, 0, 1, 1, 27.99 7.5 L 15 15" style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>`
// 打开不同版本页面
const openDetails = () => {
    let queryParams: LocationQueryRaw = {
        menuName: '玲珑推荐',
        ...props,
    } as OpenDetailParams as unknown as LocationQueryRaw;
    router.push({ path: '/details', query: queryParams });
}
</script>

<style scoped>
:deep(.el-card__body) {
    padding-top: 15px;
    padding-bottom: 5px;
}

.card-bottom {
    justify-content: center;
}

.install-btn {
    padding: 6px;
    width: 75%;
}

.uninstall-btn {
    padding: 6px;
    width: 75%;
}
</style>