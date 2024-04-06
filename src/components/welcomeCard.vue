<template>
    <el-card class="container">
        <div class="image-div" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="name" :title="name">{{ name }}</span>
        <span class="zh-name">{{ defaultName }}</span>
        <span class="version">{{ version }}</span>
        <div class="bottom" v-loading="loading" :element-loading-svg="svg"
            element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <el-button class="uninstall-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="install-btn" v-else @click="openDetails">安装</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { CardFace } from "@/interface";
import { useRouter } from 'vue-router';

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
    router.push({
        path: '/details', 
        query: {
            menuName: '珑珑推荐',
            appId: props.appId,
            name: props.name,
            version: props.version,
            description: props.description,
            arch: props.arch,
            icon: props.icon,
            zhName: props.zhName,
            size: props.size,
        }
    });
}
// 计算文字的宽度
const textWidth = computed(() => {
    const span = document.createElement('span');
    span.textContent = props.name;
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'nowrap';
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    return width;
});
</script>

<style scoped>
.container {
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
    justify-content: center;
    align-items: center;
}

.install-btn {
    background-color: #787889;
    color: white;
    padding: 6px;
    height: 24px;
    width: 75%;
}

.install-btn:hover {
    background-color: #595969;
}

.uninstall-btn {
    padding: 6px;
    height: 24px;
    width: 75%;
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