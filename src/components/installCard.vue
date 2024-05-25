<template>
    <el-card class="card-container">
        <div class="card-icon" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="card-name" :title="name">{{ name }}</span>
        <span class="card-zh-name">{{ defaultName }}</span>
        <span class="card-version">{{ version }}</span>
        <div class="card-bottom" v-loading="loading" element-loading-svg-view-box="-10, -10, 50, 50"
            element-loading-background="rgba(122, 122, 122, 0.8)" :element-loading-svg="svg">
            <div class="card-arch">{{ arch }}</div>
            <el-button class="uninstall-btn" @click="changeStatus(props)">卸载</el-button>
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ipcRenderer } from "electron";
import { ElNotification, ElMessageBox } from 'element-plus'
import { CardFace,InstalledEntity, OpenDetailParams } from "@/interface";
import { LocationQueryRaw, useRouter } from 'vue-router';
import { useAllServItemsStore } from "@/store/allServItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { compareVersions } from "@/util/checkVersion";

const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const systemConfigStore = useSystemConfigStore();

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
// 打开玲珑明细页面
const openDetails = () => {
    let queryParams: LocationQueryRaw = {
        menuName: '卸载程序',
        ...props,
    } as OpenDetailParams as unknown as LocationQueryRaw;
    router.push({ path: '/details', query: queryParams });
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
        let commandType = compareVersions(systemConfigStore.linglongBinVersion, "1.5.0") < 0 ? 'command' : 'linglong';
        ipcRenderer.send(commandType, {
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
</script>

<style scoped>
:deep(.el-card__body) {
    padding-top: 0px;
}
</style>