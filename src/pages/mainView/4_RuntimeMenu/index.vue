<template>
    <div class="container" v-loading="loading" element-loading-text="加载中...">
        <div v-if="runtimeList && runtimeList.length > 0">
            <el-table :data="runtimeList" height="100%" style="width: 100%;border-radius: 5px;">
                <el-table-column prop="App" label="appId" width="180" />
                <el-table-column prop="ContainerID" label="容器ID" width="180" />
                <el-table-column prop="Pid" label="进程ID" width="100" />
                <el-table-column prop="Path" label="玲珑目录" />
                <el-table-column fixed="right" label="操作" width="120">
                    <template #default="scope">
                        <!-- 停止按钮 -->
                        <el-button class="uninstallBtn" v-if="!scope.row.isInstalled && !scope.row.loading"
                            @click="stopPross(scope.row)">停止</el-button>
                        <el-button v-if="!scope.row.isInstalled && scope.row.loading" loading>停止中</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div class="noDataContainer" v-else>
            <div class="imageDiv">
                <img class="image" :src="defaultImage" alt="Image" />
            </div>
            <h1>暂无运行中的程序</h1>
        </div>
    </div>
</template>
<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ipcRenderer } from "electron";
import { ElNotification } from 'element-plus'
import { RunTime } from "@/interface/RunTime";
import defaultImage from '@/assets/logo.svg';

const loading = ref(true);
const runtimeList = reactive<RunTime[]>([]);
// 监听命令事件
const commandResult = (_event: any, res: any) => {
    const command: string = res.param.command;
    if (command == 'll-cli ps' && 'stdout' == res.code) {
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
                    }
                    runtimeList.push(runTime);
                }
            }
        }
        loading.value = false;
    }
    if (command.startsWith('ll-cli kill') && 'stdout' == res.code) {
        const apps: string[] = (res.result as string).split('\n');
        if (apps && apps[0].endsWith('success')) {
            // 弹出提示框
            ElNotification({
                title: '提示',
                message: "操作成功",
                type: 'info',
                duration: 500,
            });
            runtimeList.splice(0, runtimeList.length);
            // 发送操作命令
            ipcRenderer.send('command', { command: "ll-cli ps" });
        }
    }
}
// 停止服务按钮点击事件
const stopPross = (item: RunTime) => {
    const { ContainerID } = item;
    ipcRenderer.send('command', { command: `ll-cli kill ${ContainerID}` });
}

onMounted(() => {
    // 发送操作命令
    ipcRenderer.send('command', { command: "ll-cli ps" });
    ipcRenderer.on('command-result', commandResult);
})
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
})
</script>
<style scoped>
.container {
    height: 100%;
    overflow-y: auto;
}

.uninstallBtn {
    background-color: red;
    color: white;
    padding: 6px;
    height: 24px;
}

.noDataContainer {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.imageDiv {
    width: 180px;
    height: 300px
}
</style>