<template>
    <el-card class="card-container">
        <el-tag effect="plain" class="tag-diagonal">{{ categoryName }} </el-tag>
        <div class="card-icon" :title="desc" @click="openDetails">
            <img style="width: 100px;height: 100px;" v-lazy="icon" alt="Image" />
        </div>
        <span class="card-name" :title="name">{{ name }}</span>
        <div ref="containerRef" class="text-container">
            <span ref="textRef" class="text-content">{{ displayName }}</span>
        </div>
        <span v-if="tabName == '更新程序'" class="card-version">{{ newVersion }}</span>
        <span v-else-if="tabName == '玲珑推荐'" class="card-version"></span>
        <span v-else class="card-version">{{ version }}</span>
        <div class="t-card-bottom" v-if="tabName == '玲珑推荐'">
            <el-button class="card-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="card-btn" v-else @click="openDetails" :loading="loading">安装</el-button>
        </div>
        <div class="card-bottom" v-if="tabName == '分类推荐' || tabName == '全部程序'">
            <el-button class="card-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="card-btn" v-else @click="openDetails" :loading="loading">安装</el-button>
        </div>
        <div class="p-card-bottom" v-if="tabName == '排行榜(最新上架)' || tabName == '排行榜(下载量)'">
            <div class="card-arch" v-if="tabName == '排行榜(下载量)'">下载 {{ installCount }}次</div>
            <div class="card-arch" v-else-if="tabName == '排行榜(最新上架)'">{{ displayTime }}</div>
            <el-button class="p-card-btn" v-if="isInstalled" @click="openDetails">已安装</el-button>
            <el-button class="p-card-btn" v-else @click="openDetails" :loading="loading">安装</el-button>
        </div>
        <div class="card-bottom" v-if="tabName == '卸载程序'">
            <el-button class="card-btn" v-if="kind == 'app'" @click="removeApp(props)" :loading="loading">卸载</el-button>
            <el-button class="card-btn" v-else type="warning" disabled>不可卸载</el-button>
        </div>
        <div class="card-bottom" v-if="tabName == '更新程序'">
            <el-button class="card-btn" @click="openDetails" :loading="loading">升级</el-button>
        </div>
        <div class="card-bottom" v-if="tabName == '我的应用'">
            <el-button class="card-btn" @click="handleRunApp(props)">启动</el-button>
        </div>
    </el-card>
</template>
<script lang="ts" setup>
import router from '@/router';
import defaultImage from '@/assets/logo.svg';
import { ipcRenderer } from 'electron';
import { ElNotification, ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { InstalledEntity } from '@/interface';
import { StartLoading } from '@/util/ReflushLoading';
import { deepClone } from '@/util/clone';
import { logger } from '@/util/logger';

const containerRef = ref<HTMLElement | null>(null);
const textRef = ref<HTMLElement | null>(null);

// 定义组件的属性
const props = defineProps({
    tabName: { type: String, default: '全部程序' },
    icon: { type: String, default: defaultImage },
    appId: { type: String, required: true },
    name: { type: String, default: '' },
    zhName: { type: String, default: '' },
    arch: { type: String, default: 'x86_64' },
    channel: { type: String, default: '' },
    base: { type: String, default: '' },
    kind: { type: String, default: '' },
    categoryName: { type: String, default: '其他' },
    version: { type: String, default: '0.0.0.1' },
    newVersion: { type: String, default: '0.0.0.1' },
    module: { type: String, default: '' },
    repoName: { type: String, default: '' },
    runtime: { type: String, default: '' },
    size: { type: String, default: '0.00 MB' },
    description: { type: String, default: '' },
    createTime: { type: String, default: new Date().toISOString().split('T')[0] },
    installCount: { type: Number, default: 0 },
    isInstalled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    schema_version: { type: String, default: '' },
    command: { type: String, default: '' },
    install_time: { type: String, default: new Date().toISOString().split('T')[0] },
    permissions: { type: String, default: '' },
    extensions: { type: String, default: '' },
    devName: { type: String, default: '' },
})

// 格式化描述信息
const desc = computed(() => props.description ? props.description.replace(/(.{20})/g, '$1\n') : '');
// 格式化时间
const displayTime = computed(() => props.createTime ? props.createTime.split(' ')[0] : `2099-01-01`);
// 格式化中文名称
const displayName = computed(() => props.zhName ? props.zhName : props.name);
// 打开玲珑明细页面
const openDetails = () => {
    // 如果程序处于加载中状态，则不允许点击
    if (props.loading || props.tabName === '我的应用') return;
    // 跳转到明细页面
    router.push({ path: '/details', query: { 
        menuName: props.tabName,
        ...Object.fromEntries(
            Object.entries(props).map(([k, v]) => [k, v != null ? String(v) : ''])
        ) 
    }});
}
// 按钮点击操作事件
const removeApp = (item: InstalledEntity) => {
    // 弹框确认
    ElMessageBox.confirm('确定要卸载吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(() => {
        StartLoading(item);  // 启动按钮的加载状态
        // 发送操作命令
        const plainItem = deepClone(item);
        plainItem.command = `ll-cli uninstall ${item.appId}/${item.version}`;
        ipcRenderer.send('linyaps-uninstall', plainItem);
    }).catch(() => {
        // 取消卸载
        logger.info(`取消卸载${item.appId}/${item.version}`);
    });
};
// 运行按钮(发送操作命令,并弹出提示框)
const handleRunApp = (item: InstalledEntity) => {
    ipcRenderer.send('linyaps-run', { appId: item.appId, version: item.version });
    ElNotification({ title: '提示', type: 'info', duration: 500, message: `${item.name}(${item.version})即将被启动！` });
}

const handleRunAppResult = (_event: any, res: any) => {
    const { code, params, result } = res;
    if (code === 'close') {
        ElNotification({ title: '提示', type: 'success', duration: 3000, message: `${params.appId}(${params.version})已关闭！` });
        return;
    }
    if (code === 'error' || code === 'stderr') {
        ElMessage.error(`启动失败: ${result}`);
    }
}

// 页面挂载时应用滚动动画
onMounted(() => {
    // ipcRenderer.on('linyaps-run-result', handleRunAppResult); // 监听应用启动结果
    const containerElement = containerRef.value as HTMLElement;
    const textElement = textRef.value as HTMLElement;
    if (textElement && containerElement && textElement.scrollWidth < containerElement.offsetWidth) {
        textElement.style.textAlign = 'center';
        textElement.style.animation = 'none'; // 去除滚动动画
    }
});
</script>
<style scoped>
:deep(.el-card__body) {
    padding-top: 0px;
    padding-bottom: 5px;
}
</style>