<template>
    <div class="apps-container" >
        <el-table :data="runtimeList" border stripe height="100%" style="width: 100%;border-radius: 5px;">
            <el-table-column prop="app" label="包名" width="210" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="version" label="版本号" width="120" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="arch" label="架构" width="80" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="channel" label="渠道" width="80" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="repo" label="来源" width="80" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="pid" label="进程ID" width="100" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="containerId" label="容器ID" width="200" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column prop="Path" min-width="300" label="玲珑目录" header-align="center" align="center" show-overflow-tooltip/>
            <el-table-column fixed="right" label="操作" width="160" header-align="center" align="center">
                <template #default="scope">
                    <el-button class="runtime-btn stop" @click="stopPross(scope.row)">停止</el-button>
                    <el-button class="runtime-btn into" @click="intoDom(scope.row)">进入容器</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { ParseRef } from "@/util/refParam";
import { compareVersions } from '@/util/checkVersion';
import { VERSION_THRESHOLDS } from '@/constants';
import { useSystemConfigStore } from "@/store/systemConfig";

const systemConfigStore = useSystemConfigStore();

interface RunTime {
    app: string,
    containerId: string,
    pid: string,
    Path: string,
    version: string,
    arch: string,
    channel: string,
    repo: string,
}

let runtimeList = ref<RunTime[]>([]);
let removeIndex = ref<number>(-1);

// 停止服务按钮点击事件
const stopPross = (item: RunTime) => {
    const { containerId, app } = item;
    let command = `ll-cli kill `;
    if (compareVersions(systemConfigStore.llVersion, VERSION_THRESHOLDS.UPDATE_LIST_SUPPORT) >= 0) {
        removeIndex.value = runtimeList.value.findIndex(r => r.app === app);
        command += `${app}`;
    } else {
        removeIndex.value = runtimeList.value.findIndex(r => r.containerId === containerId);
        command += `${containerId}`;
    }
    ipcRenderer.send('linyaps-kill', { command });
    ipcRenderer.on('linyaps-kill-result', async (_event: any, res: any) => {
        const { error, stderr } = res;
        if (error || stderr) {
            ElNotification({ title: '提示', message: error || stderr, type: 'error', duration: 500 });
            return;
        }
        // 根据索引从列表中移除该进程
        if (removeIndex.value !== -1) {
            runtimeList.value.splice(removeIndex.value, 1);
            removeIndex.value = -1; // 重置索引
        }
        ElNotification({ title:'提示', message:"操作成功", type:'info', duration:500 });
        // 延时1000毫秒之后刷新进程列表
        await new Promise(resolve => setTimeout(resolve, 200));
        getProcessList();
    });
}

// 进入容器按钮点击事件,调用系统的终端窗口
const intoDom = (item: RunTime) => {
    const { containerId, app } = item;
    // ll-cli exec com.tencent.wechat.linyaps /bin/bash
    let code = `ll-cli exec `;
    if (compareVersions(systemConfigStore.llVersion, VERSION_THRESHOLDS.UPDATE_LIST_SUPPORT) >= 0) {
        code += app;
    } else {
        code += containerId;
    }
    code += ' /bin/bash';
    ipcRenderer.send('open-terminal', { code });
}

// 获取进程列表
const getProcessList = () => {
    ipcRenderer.send('linyaps-ps');
    ipcRenderer.once('linyaps-ps-result', (_event: any, res: any) =>{
        const { error, stdout, stderr } = res;
        if (error || stderr) {
            ElNotification({ title: '提示', message: error || stderr, type: 'error', duration: 500 });
            return;
        }
        const apps: any[] = JSON.parse(stdout);
        for (let item of apps) {
            let linyapsRef = ParseRef(item.package); // 应用包信息
            const runtimeEntity = {
                app: linyapsRef.appId,
                containerId: item.id,  // 容器ID
                pid: item.pid,  // 进程ID
                version: linyapsRef.version,
                arch: linyapsRef.arch,
                channel: linyapsRef.channel,
                repo: linyapsRef.repo ? linyapsRef.repo : systemConfigStore.defaultRepoName
            } as RunTime;
            // 检查是否已经存在相同的进程
            const existingIndex = runtimeList.value.findIndex(r => r.containerId === item.id);
            // 如果存在，则更新该进程的信息
            if (existingIndex !== -1) {
                runtimeList.value[existingIndex] = runtimeEntity;
                continue;
            }
            runtimeList.value.push(runtimeEntity);
        }
        // 刷新表格视图
        runtimeList.value = [...runtimeList.value];
    });
}

// 定时每一秒钟刷新一次
const timer = setInterval(() => getProcessList(), 1000);
// 页面启动时加载
onMounted(() => getProcessList());
// 页面卸载时清除定时器
onBeforeUnmount(() => clearInterval(timer));
</script>
<style scoped>
.runtime-btn {
    height: 30px;
    border-radius: 10px;
    color: white;
}

.stop {
    width: 50px;
    background-color: red;
}

.into {
    width: 70px;
    background-color: green;
}
</style>