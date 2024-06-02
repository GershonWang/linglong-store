<template>
    <div class="apps-container" v-loading="loading" element-loading-text="加载中...">
        <el-table :data="runtimeList" height="100%" style="width: 100%;border-radius: 5px;">
            <el-table-column prop="App" label="AppId" width="200" />
            <el-table-column prop="version" label="版本号" width="100" />
            <el-table-column prop="arch" label="架构" width="100" />
            <el-table-column prop="channel" label="渠道" width="100" />
            <el-table-column prop="repo" label="来源" width="100" />
            <el-table-column prop="Pid" label="进程ID" width="100" />
            <el-table-column prop="ContainerID" label="容器ID" width="500" />
            <el-table-column prop="Path" label="玲珑目录" width="500"/>
            <el-table-column fixed="right" label="操作" width="120">
                <template #default="scope">
                    <!-- 停止按钮 -->
                    <el-button class="uninstall-btn" v-if="!scope.row.isInstalled && !scope.row.loading"
                        @click="stopPross(scope.row)">停止</el-button>
                    <el-button v-if="!scope.row.isInstalled && scope.row.loading" loading>停止中</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { RunTime } from "@/interface";
import { parseRef } from "@/util/refParam";
import { compareVersions } from '@/util/checkVersion';
import { useSystemConfigStore } from "@/store/systemConfig";

const systemConfigStore = useSystemConfigStore();
const linglongBinVersion = systemConfigStore.linglongBinVersion;

const loading = ref(true);
let runtimeList = ref([] as RunTime[]);

// 监听命令事件
const commandResult = (_event: any, res: any) => {
    const command: string = res.param.command;
    if (command == 'll-cli ps') {
        if ('stdout' == res.code) {
            const apps: string[] = (res.result as string).split('\n');
            if (apps.length > 1) {
                for (let index = 1; index < apps.length - 1; index++) {
                    const runItem: string = apps[index].trim();
                    const items: RegExpMatchArray | null = runItem.match(/'[^']+'|\S+/g);
                    if (items) {
                        const runTime: RunTime = {
                            App: items[0],
                            ContainerID: items[1],
                            Pid: items[2],
                            Path: items[3],
                            version: '',
                            arch: '',
                            channel: '',
                            repo: ''
                        }
                        runtimeList.value.push(runTime);
                    }
                }
            }
            loading.value = false;
            // 刷新表格视图
            runtimeList.value = [...runtimeList.value];
        } else {
            // 弹出操作异常提示框
            ElNotification({
                title: '提示',
                message: res.result,
                type: 'error',
                duration: 500,
            });
        }
    }
    // 玲珑1.5.0-1版本使用命令
     if (command == 'll-cli ps --json') {
        if ('stdout' == res.code) {
            const apps: any[] = JSON.parse(res.result);
            if (apps.length > 0) {
                for (let index = 0; index < apps.length; index++) {
                    const runItem: any = apps[index];
                    const pack = runItem['package'];
                    const packs = parseRef(pack);
                    const runTime: RunTime = {
                        App: packs.appId,
                        ContainerID: runItem["id"],
                        Pid: runItem["pid"],
                        Path: '',
                        version: packs.version,
                        arch: packs.arch,
                        channel: packs.channel,
                        repo: packs.repo
                    }
                    runtimeList.value.push(runTime);
                }
            }
            loading.value = false;
            // 刷新表格视图
            runtimeList.value = [...runtimeList.value];
        } else {
            // 弹出操作异常提示框
            ElNotification({
                title: '提示',
                message: res.result,
                type: 'error',
                duration: 500,
            });
        }
    }
    if (command.startsWith('ll-cli kill')) {
        if ('stdout' == res.code) {
            if ((res.result as string).trim().endsWith('success')) {
                // 弹出提示框
                ElNotification({
                    title: '提示',
                    message: "操作成功",
                    type: 'info',
                    duration: 500,
                });
                runtimeList.value.splice(0, runtimeList.value.length);
            }
            // 发送操作命令
            ipcRenderer.send('command', { command: "ll-cli ps" });
        } else {
            // 弹出提示框
            ElNotification({
                title: '错误',
                message: res.result,
                type: 'error',
                duration: 500,
            });
        }
    }
}
// 强制退出程序
const killAppResult = (_event: any, res: any) => {
    console.log('killAppResult',res.result);
    if ('close' == res.code && 0 == res.result) {
        // 弹出提示框
        ElNotification({
            title: '提示',
            message: "操作成功",
            type: 'info',
            duration: 500,
        });
        runtimeList.value.splice(0, runtimeList.value.length);
        if (linglongBinVersion && compareVersions(linglongBinVersion,'1.5.0') < 0) {
            ipcRenderer.send('command', { command: "ll-cli ps" });
        } else {
            ipcRenderer.send('command', { command: "ll-cli ps --json" });
        }
    } else if ('close' == res.code && 0 != res.result) {
        // 弹出提示框
        ElNotification({
            title: '错误',
            message: res.result,
            type: 'error',
            duration: 500,
        });
    }
}
// 停止服务按钮点击事件
const stopPross = (item: RunTime) => {
    const { ContainerID } = item;
    if (linglongBinVersion && compareVersions(linglongBinVersion,'1.5.0') < 0) {
        ipcRenderer.send('command', { command: `ll-cli kill ${ContainerID}` });
    } else {
        ipcRenderer.send('kill-app', { command: `ll-cli kill ${ContainerID}` });
    }
}
// 页面启动时加载
onMounted(() => {
    if (linglongBinVersion && compareVersions(linglongBinVersion,'1.5.0') < 0) {
        ipcRenderer.send('command', { command: "ll-cli ps" });
    } else {
        ipcRenderer.send('command', { command: "ll-cli ps --json" });
    }
    ipcRenderer.on('command-result', commandResult);
    ipcRenderer.on('kill-app-result', killAppResult);
})
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult); // 公共调用方法
    ipcRenderer.removeListener('kill-app-result', killAppResult); // 强制退出程序
})
</script>
<style scoped>
.uninstall-btn {
    background-color: red;
    color: white;
    padding: 6px;
    height: 24px;
}
</style>