<template>
    <el-card class="container">
        <div class="imageDiv" :title="desc" @click="openDetails">
            <img class="image" :src="icon || defaultImage" @error="(e: any) => e.target.src = defaultImage" alt="Image" />
        </div>
        <span class="name" :title="name">{{ name }}</span>
        <span class="version">{{ version }}</span>
        <div class="bottom"  v-loading="loading" :element-loading-svg="svg"
        element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(122, 122, 122, 0.8)">
            <p class="arch">{{ arch }}</p>
            <el-button class="uninstallBtn" v-if="isInstalled"
                @click="changeStatus(props,'uninstall')">卸载</el-button>
            <el-button class="installBtn" v-else
                @click="changeStatus(props,'install')">安装</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { CardFace } from "@/interface/CardFace";
import defaultImage from '@/assets/logo.svg'
import { useRouter } from 'vue-router';
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";

const router = useRouter();
const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();

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
    loading: false,
})
// 计算属性
const desc = computed(() => {
    return props.description.replace(/(.{20})/g, '$1\n');
});
// 加载的svg动画
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `

// 打开不同版本页面
const openDetails = () => {
    router.push({ path: '/details', query: {
        menuName: '已安装程序', 
        appId: props.appId,
        name: props.name,
        version: props.version,
        description: props.description,
        arch: props.arch,
        icon: props.icon
    } });
}
// 按钮点击操作事件
const changeStatus = (item: CardFace,flag: string) => {
    // 启用加载框
    allServItemsStore.updateItemLoadingStatus(item, true);
    installedItemsStore.updateItemLoadingStatus(item, true);
    difVersionItemsStore.updateItemLoadingStatus(item,true);
    // 根据flag判断是安装还是卸载
    let message: string = '正在安装' + item.name + '(' + item.version + ')';
    let command: string = 'll-cli install ' + item.appId + '/' + item.version;
    if (flag == 'uninstall') {
        message = '正在卸载' + item.name + '(' + item.version + ')';
        command = 'll-cli uninstall ' + item.appId + '/' + item.version;
    }
    // 弹出提示框
    ElNotification({
        title: '提示',
        message: message,
        type: 'info',
        duration: 500,
    });
    // 发送操作命令
    ipcRenderer.send('command', {
        icon: item.icon,
        name: item.name,
        version: item.version,
        description: item.description,
        arch: item.arch,
        isInstalled: item.isInstalled,
        appId: item.appId,
        command: command,
        loading: false
    });
}
</script>

<style scoped>
.container {
    height: 280px;
    width: 100%;
    position: relative;
    background-color: #999999;
}

.imageDiv {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 0 auto;
    width: 120px;
    height: 120px;
}

.image {
    width: 100px;
    height: 100px;
}

.name {
    display: flex;
    justify-content: center;
    color: #36D;
    font-weight: bold;
    font-size: 18px;
    white-space: nowrap;
    margin: 3px auto 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
}

.version {
    background-color: #f5c7bf;
    display: flex;
    justify-content: center;
    border-radius: 5px;
}

.bottom {
    margin-top: 3px;
    padding-left: 12px;
    padding-right: 2px;
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

.arch {
    font-size: 14px;
    color: white;
}

.installBtn {
    background-color: blue;
    color: white;
    padding: 6px;
    height: 24px;
}

.uninstallBtn {
    background-color: red;
    color: white;
    padding: 6px;
    height: 24px;
}
</style>