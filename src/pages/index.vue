<template>
    <div class="containner">
        <a href="https://linglong.dev/" target="_blank">
            <img src="/logo.svg" class="logo" alt="玲珑商店" />
        </a>
        <h1>玲珑应用商店</h1>
        <h3>{{ message }}</h3>
        <div style="text-align: left;">
            <h3 style="color: chocolate;">PS注意：</h3>
            <p>1.刚程序运行时，会检测当前系统是否满足玲珑环境，不满足，倒计时加载会卡住不动并弹出提示，程序不会进入到后续界面;这里需要您手动安装玲珑环境方可使用。</p>
            <p>2.点击安装时，受网速和程序大小的影响，程序安装比较缓慢甚至可能会没反应，此时无需操作耐心等待程序安装成功提示即可。</p>
        </div>
    </div>
    <el-dialog v-model="centerDialogVisible" title="警告" width="30%" center style="background-color: #242424;">
        <span>当前系统未安装玲珑环境，无法使用当前商店！！</span>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="quitApp">退出</el-button>
                <el-button type="primary" @click="goMount">前往</el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ipcRenderer } from "electron";
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useSysConfStore } from "@/store/sysConf";
import { useAllServItemsStore } from '@/store/allServItems'
import { useInstalledItemsStore } from "@/store/installedItems";

const sysConfStore = useSysConfStore();
const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();

const { arch, sourceUrl } = storeToRefs(sysConfStore);

// 获取路由对象
const router = useRouter();
// 倒计时(秒数)
const mins = ref(0);
// 提示信息
const message = ref('加载中...');
// 弹框标识
const centerDialogVisible = ref(false);
// 定时任务对象
let timerId: NodeJS.Timeout = setInterval(() => {
    mins.value = (mins.value % 3) + 1;
    message.value = '加载中' + '.'.repeat(mins.value);
}, 1000);
// 退出按钮
const quitApp = () => {
    centerDialogVisible.value = false;
    window.close();
}
// 前往安装
const goMount = () => {
    centerDialogVisible.value = false;
    window.open('https://linglong.dev/guide/start/install.html');
    window.close();
}
// 命令执行返回结果
const commandResult = (_event: any, res: any) => {
    console.log('首页加载执行',res);
    if ('uname -m' == res.param.command && 'stdout' == res.code) {
        arch.value = res.result.trim();
    }
    if ('ll-cli' == res.param.command && 'stdout' == res.code) {
        // 发送命令，获取系统已安装的程序列表
        ipcRenderer.send("command", { name: "查询已安装程序列表", command: "ll-cli list" });
        // 发送网络命令，获取源内所有应用
        ipcRenderer.send('network', { url: sourceUrl.value + '/api/v0/web-store/apps??page=1&size=100000' });
    }
    if ('ll-cli' == res.param.command && 'stdout' != res.code) {
        // 设置提示信息,弹出弹框
        centerDialogVisible.value = true; 
    }
    if ('ll-cli list' == res.param.command && 'stdout' == res.code) {
        const result = res.result;
        installedItemsStore.initInstalledItems(result);
    }
}
// 网络执行返回结果
const networkResult = (_event: any, res: any) => {
    if (res.code == 200) {
        // 初始化所有应用程序列表
        const responseList = res.data.list;
        const installedItemList = installedItemsStore.installedItemList;
        allServItemsStore.initAllItems(responseList,installedItemList);
        // 更新已安装程序图标
        const allItems = allServItemsStore.allServItemList;
        installedItemsStore.updateInstalledItemsIcons(allItems);
        // 跳转到主界面
        router.push('/main_view');
    }
}
// 加载前执行
onMounted(async () => {
    // 监听命令行执行结果
    ipcRenderer.on('command-result', commandResult);
    // 监听网络请求执行结果
    ipcRenderer.on('network-result', networkResult);
    // 发送命令，获取当前系统架构
    ipcRenderer.send('command', { command: 'uname -m' });
    // 发送命令，检测当前系统是否支持玲珑
    ipcRenderer.send('command', { command: 'll-cli' });
});
// 销毁前执行
onBeforeUnmount(() => {
    clearInterval(timerId)
    ipcRenderer.removeListener('command-result', commandResult);
    ipcRenderer.removeListener('network-result', networkResult);
});
</script>
<style scoped>
.containner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
}

.logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
}

.dialog-footer button:first-child {
    margin-right: 10px;
}
</style>@/store/allItems@/store/allServItems