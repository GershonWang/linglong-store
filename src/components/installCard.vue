<template>
    <el-card class="container">
        <div class="imageDiv" :title="desc" @click="openDetails">
            <img class="image" v-lazy="icon" alt="Image" />
        </div>
        <span :style="spanStyle" :title="name">{{ name }}</span>
        <span class="version">{{ version }}</span>
        <div class="bottom" v-loading="loading" element-loading-svg-view-box="-10, -10, 50, 50"
            element-loading-background="rgba(122, 122, 122, 0.8)" :element-loading-svg="svg">
            <p class="arch">{{ arch }}</p>
            <el-button class="uninstallBtn" @click="changeStatus(props)">卸载</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ipcRenderer } from "electron";
import { ElNotification, ElMessageBox } from 'element-plus'
import { CardFace } from "@/interface";
import { useRouter } from 'vue-router';
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { InstalledEntity } from "@/interface";

const router = useRouter();
const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();

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
// 加载的svg动画
const svg = `<path class="path" d="M 30 15 L 28 17 M 25.61 25.61 A 15 15, 0, 0, 1, 15 30 A 15 15, 0, 1, 1, 27.99 7.5 L 15 15" style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>`
// 打开不同版本页面
const openDetails = () => {
    router.push({
        path: '/details', 
        query: {
            menuName: '卸载程序',
            appId: props.appId,
            name: props.name,
            version: props.version,
            description: props.description,
            arch: props.arch,
            icon: props.icon
        }
    });
}
// 按钮点击操作事件
const changeStatus = (item: CardFace) => {
    ElMessageBox.confirm('确定要卸载当前程序吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        center: true,
    }).then(() => {
        // 启用加载框
        allServItemsStore.updateItemLoadingStatus(item, true);
        const installedItem: InstalledEntity = {
            appId: item.appId,
            arch: item.arch,
            channel: item.channel ? item.channel : '',
            description: item.description ? item.description : '',
            icon: item.icon ? item.icon : '',
            kind: "",
            module: "",
            name: item.name,
            repoName: "",
            runtime: "",
            size: "",
            uabUrl: "",
            user: "",
            version: item.version,
            isInstalled: false,
            loading: false
        }
        installedItemsStore.updateItemLoadingStatus(installedItem, true);
        difVersionItemsStore.updateItemLoadingStatus(installedItem, true);
        // 弹出提示框
        ElNotification({
            title: '提示',
            message: '正在卸载' + item.name + '(' + item.version + ')',
            type: 'info',
            duration: 500,
        });
        // 发送操作命令
        ipcRenderer.send('command', {
            appId: item.appId,
            name: item.name,
            arch: item.arch,
            version: item.version,
            description: item.description,
            isInstalled: item.isInstalled,
            command: 'll-cli uninstall ' + item.appId + '/' + item.version,
            icon: item.icon,
            loading: false
        });
    })
};
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
// 根据文字宽度设置样式
const spanStyle = computed(() => {
    if (textWidth.value < 100) {
        return {
            display: 'flex',
            textAlign: 'center',
            justifyContent: 'center',
            color: '#36D',
            fontWeight: 'bold',
            fontSize: '18px',
            margin: '3px auto 3px',
            maxWidth: '150px',
        } as import('vue').StyleValue;
    } else {
        return {
            display: 'flex',
            textAlign: 'left',
            color: '#36D',
            fontWeight: 'bold',
            fontSize: '18px',
            margin: '3px auto 3px',
            maxWidth: '150px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
        } as import('vue').StyleValue;
    }
});
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

.arch {
    font-size: 14px;
    color: white;
}

.uninstallBtn {
    background-color: red;
    color: white;
    padding: 6px;
    height: 24px;
}
</style>