<template>
    <el-card class="card-container">
        <div class="card-icon" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="card-name" :title="name">{{ name }}</span>
        <span class="card-zh-name">{{ defaultName }}</span>
        <span class="card-version">{{ version }}</span>
        <div class="card-bottom" v-loading="loading" :element-loading-svg="svg" 
            element-loading-background="rgba(122, 122, 122, 0.8)"
            element-loading-svg-view-box="-10, -10, 50, 50">
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
const svg = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
    <rect fill="#fff" width="3" height="100" transform="translate(0) rotate(180 3 50)">
    <animate attributeName="height" attributeType="XML" dur="1s" values="30; 100; 30" repeatCount="indefinite"></animate>
    </rect>
    <rect x="17" fill="#fff" width="3" height="100" transform="translate(0) rotate(180 20 50)">
    <animate attributeName="height" attributeType="XML" dur="1s" values="30; 100; 30" repeatCount="indefinite" begin="0.1s"></animate>
    </rect>
    <rect x="40" fill="#fff" width="3" height="100" transform="translate(0) rotate(180 40 50)">
    <animate attributeName="height" attributeType="XML" dur="1s" values="30; 100; 30" repeatCount="indefinite" begin="0.3s"></animate>
    </rect>
    <rect x="60" fill="#fff" width="3" height="100" transform="translate(0) rotate(180 58 50)">
    <animate attributeName="height" attributeType="XML" dur="1s" values="30; 100; 30" repeatCount="indefinite" begin="0.5s"></animate>
    </rect>
    <rect x="80" fill="#fff" width="3" height="100" transform="translate(0) rotate(180 76 50)">
    <animate attributeName="height" attributeType="XML" dur="1s" values="30; 100; 30" repeatCount="indefinite" begin="0.1s"></animate>
    </rect>
</svg>`
// 打开玲珑明细页面
const openDetails = () => {
    let queryParams: LocationQueryRaw = {
        menuName: '全部程序',
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

/* 使用 ::v-deep 选择器覆盖深层样式 */
:deep(.el-loading-spinner) {
    top: 0;
    animation: none !important;
}

/* 覆盖 spinner 组件的内部 circular 类的动画 */
:deep(.el-loading-spinner .circular) {
    animation: none !important;
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