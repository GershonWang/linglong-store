<template>
    <el-card class="container" :title="desc" v-loading="loading" element-loading-text="进行中..."
        element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)" @click="openDetails(appId)">
        <img class="image" :src="icon || defaultImage" @error="(e: any) => e.target.src = defaultImage" alt="Image" />
        <span class="name">{{ name }}</span>
        <span class="version">{{ version }}</span>
        <div class="btm">
            <p class="desc">{{ description }}</p>
            <p class="os">{{ arch }}</p>
            <el-button class="uninstallBtn" v-if="isInstalled"
                @click="uninstallServ(index, { icon, name, version, description, arch, isInstalled, appId })">卸载</el-button>
            <el-button class="installBtn" v-else
                @click="installServ(index, { icon, name, version, description, arch, isInstalled, appId })">安装</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { CardFace } from "./CardFace";
import defaultImage from '@/assets/logo.svg'
import { useRouter } from 'vue-router';

const router = useRouter();

const loading = ref(false);

// 接受父组件传递的参数，并设置默认值
// icon: "https://linglong.dev/asset/logo.svg",
const props = withDefaults(defineProps<CardFace>(), {
    icon: "",
    name: "程序名称",
    version: "0.0.1",
    description: "描述说明",
    arch: "X86_64",
    isInstalled: true,
    appId: "",
    index: 0,
})
const openDetails = (appId: string) => {
    router.push({ path: '/details', query: { 
        appId: props.appId,
        name: props.name,
        version: props.version,
        description: props.description,
        arch: props.arch,
        icon: props.icon
    } });
}
// 卸载程序
const uninstallServ = (index: number, item: CardFace) => {
    // 启用加载框
    loading.value = true;
    // 弹出提示框
    ElNotification({
        title: '提示',
        message: '正在卸载' + item.name + '(' + item.version + ')',
        type: 'info',
        duration: 1000,
    });
    const params: CardFace = {};
    params.icon = item.icon;
    params.name = item.name;
    params.version = item.version;
    params.description = item.description;
    params.arch = item.arch;
    params.isInstalled = item.isInstalled;
    params.appId = item.appId;
    params.command = 'll-cli uninstall ' + item.appId + '/' + item.version;
    params.index = index;
    ipcRenderer.send('command', params);
}
// 安装程序
const installServ = (index: number, item: CardFace) => {
    // 启用加载框
    loading.value = true;
    // 弹出提示框
    ElNotification({
        title: '提示',
        message: '正在安装' + item.name + '(' + item.version + ')',
        type: 'info',
        duration: 1000,
    });
    const params: CardFace = {};
    params.icon = item.icon;
    params.name = item.name;
    params.version = item.version;
    params.description = item.description;
    params.arch = item.arch;
    params.isInstalled = item.isInstalled;
    params.appId = item.appId;
    params.command = 'll-cli install ' + item.appId + '/' + item.version;
    params.index = index;
    ipcRenderer.send('command', params);
}
// 计算属性
const desc = computed(() => {
    return props.description.replace(/(.{20})/g, '$1\n');
});
// 监听安装状态字段，发生变化时，将加载赋默认值
watch(() => props.isInstalled, (newVal, oldVal) => {
    loading.value = false;
});
</script>

<style scoped>
.container {
    height: 280px;
    width: 100%;
    position: relative;
    background-color: #999999;
}

.image {
    width: 150px;
    height: 150px;
    margin: 0 auto;
    display: block;
}

.name {
    display: flex;
    justify-content: center;
    color: #36D;
    font-weight: bold;
    font-size: 18px;
    white-space: nowrap;
    margin: 3px auto 3px
    /* overflow: hidden; */
    /* text-overflow: ellipsis; */
    /* max-width: 150px; */
}

.version {
    background-color: #f5c7bf;
    display: flex;
    justify-content: center;
    border-radius: 5px;
}

.btm {
    margin-top: 3px;
    line-height: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.desc {
    font-size: 12px;
    color: white;
    /* 限制显示两行文本 */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: normal;
    /* 可根据需要设置为nowrap来禁用折行 */
    max-width: 35%;
    /* 可根据需要设置最大宽度 */
}

.os {
    font-size: 12px;
    color: white;
}

.installBtn {
    background-color: blue;
    color: white;
    padding: 5px;
    min-height: auto;
}

.uninstallBtn {
    background-color: red;
    color: white;
    padding: 5px;
    min-height: auto;
}
</style>