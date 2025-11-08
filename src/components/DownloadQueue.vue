<template>
    <!-- 下载队列弹框 -->
    <transition name="el-zoom-in-left">
        <div v-show="show" class="transition-queue-box">
            <el-table :data="installingItems" border stripe style="width: 100%;height: 100%;">
                <el-table-column label="名称" header-align="center" align="center" :formatter="formatName" show-overflow-tooltip/>
                <el-table-column label="版本" header-align="center" align="center" width="120" :formatter="formatVersion" show-overflow-tooltip/>
                <el-table-column label="安装进度" header-align="center" align="center" width="90" :formatter="formatSchedule" show-overflow-tooltip/>
                <el-table-column fixed="right" label="操作" header-align="center" align="center" width="120">
                    <template #default="scope">
                        <el-button v-if="isInstalling(scope.row)" type="primary" size="small" loading>安装中...</el-button>
                        <el-button v-else @click="cancelInstall(scope.row)" type="danger" size="small">取消安装</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
    </transition>
</template>
<script setup lang="ts">
import { PropType } from 'vue'
import { InstalledEntity } from '@/interface'
import { compareVersions } from '@/util/checkVersion';
import { VERSION_THRESHOLDS } from '@/constants';
import { StopLoading } from '@/util/ReflushLoading';

import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";

const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    installingItems: {
        type: Array as PropType<InstalledEntity[]>,
        default: () => []
    }
})
// 应用名称展示
const formatName = (row: any) => row.zhName ? row.zhName : row.name;
// 版本号展示
const formatVersion = (row: any) => row.newVersion ? row.newVersion : row.version;
// 安装进度展示
const formatSchedule = (row: any) => {
    if (compareVersions(systemConfigStore.llVersion, VERSION_THRESHOLDS.MIN_SUPPORTED) < 0) {
        return "-";
    }
    return row.schedule !== '-' ? row.schedule : '等待中...';
}

const isInstalling = (row: any) => row.schedule !== '等待中...' && row.schedule !== '-';

// 终止安装点击事件
const cancelInstall = (row: InstalledEntity) => {
    StopLoading(row); // 关闭各个列表中的加载状态
    installingItemsStore.removeItem(row); // 从队列中删除元素
}

</script>
<style scoped>
.transition-queue-box {
    height: 30%;
    width: 40%;
    background: radial-gradient(circle at 50% 50%, transparent, var(--base-color));
    border-radius: 12px;
    position: fixed;
    bottom: 12px;
    left: 175px;
    padding: 6px;
    box-sizing: border-box;
    text-align: center;
    z-index: 999999;
}
</style>