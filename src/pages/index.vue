<template>
    <div class="containner">
        <a href="https://linglong.dev/" target="_blank">
            <img src="/logo.svg" class="logo" alt="玲珑商店" />
        </a>
        <h1>玲珑应用商店</h1>
        <h3>{{ message }}</h3>
        <h3>{{ downloadPercentMsg }}</h3>
        <div style="text-align: left;">
            <h3 style="color: chocolate;">PS注意：</h3>
            <p>1.刚程序运行时，会检测当前系统是否满足玲珑环境;如果环境不满足则弹出提示，程序不会进入到后续界面;这里需要您手动安装玲珑环境方可使用。</p>
            <p>2.点击安装时，受网速和程序大小的影响，程序安装比较缓慢甚至可能会没反应，此时无需操作耐心等待程序安装成功提示即可。</p>
        </div>
    </div>
    <div class="footer">
        <el-progress :percentage="downloadPercent" :stroke-width="10" status="success" striped striped-flow :duration="10"
            :show-text="false" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, reactive } from 'vue';
import { ElMessageBox } from 'element-plus'
import { ipcRenderer } from "electron";
import { useRouter } from 'vue-router';
import { useSystemConfigStore } from "@/store/systemConfig";
import { useAllServItemsStore } from '@/store/allServItems';
import { useInstalledItemsStore } from "@/store/installedItems";

const systemConfigStore = useSystemConfigStore();
const allServItemsStore = useAllServItemsStore();
const installedItemsStore = useInstalledItemsStore();

// 获取路由对象
const router = useRouter();
// 提示信息
const message = ref('');
// 监听对象-每个环节状态
const watchData = reactive({
    archFlag: false,
    useFlag: false,
    updateFlag: false,
    installFlag: false,
    netFlag: false
})
// 进度条状态
const downloadPercent = ref(0);
const downloadPercentMsg = ref('');
// 命令执行返回结果
const commandResult = (_event: any, res: any) => {
    const code: string = res.code;
    const result: any = res.result;
    const command: string = res.param.command;
    if (command == 'uname -m') {
        if (code == 'stdout') {
            systemConfigStore.changeArch(result.trim());
            watchData.archFlag = true;
            message.value = "系统架构检测完成...";
        } else {
            message.value = "系统架构检测异常...";
        }
    }
    if (command == 'll-cli') {
        if(code == 'stdout') {
            watchData.useFlag = true;
            message.value = "玲珑环境存在...";
            if (systemConfigStore.autoCheckUpdate) {
                message.value = "检测商店版本号...";
                ipcRenderer.send('checkForUpdate');
            } else {
                message.value = "跳过商店版本检测...";
                watchData.updateFlag = true;
            }
            message.value = "正在检测系统已安装的玲珑程序...";
            ipcRenderer.send("command", { command: "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'" });
            message.value = "正在获取网络源玲珑程序列表...";
            const baseUrl: string = systemConfigStore.sourceUrl;
            const requestUrl: string = baseUrl.concat('/api/v0/web-store/apps??page=1&size=100000');
            ipcRenderer.send('network', { url: requestUrl });
        } else {
            message.value = "玲珑环境不存在...";
            ElMessageBox.confirm('当前系统未安装玲珑环境，无法使用当前商店！！', '警告', {
                confirmButtonText: '前往',
                cancelButtonText: '退出',
                type: 'warning',
                center: true,
            }).then(() => {
                window.open('https://linglong.dev/guide/start/install.html');
                window.close();
            }).catch(() => {
                window.close();
            })
        }
    }
    if (command.startsWith('ll-cli list')) {
        if (code == 'stdout') {
            installedItemsStore.initInstalledItems(result);
            message.value = "已安装的玲珑程序检测完成...";
        } else {
            message.value = "已安装的玲珑程序检测异常...";
        }
        watchData.installFlag = true;
    }
}
// 网络执行返回结果
const networkResult = (_event: any, res: any) => {
    const code = res.code;
    const data = res.data;
    if (code == 200) {
        message.value = "网络源玲珑程序列表获取完成...";
        // 初始化所有应用程序列表
        const installedItemList = installedItemsStore.installedItemList;
        allServItemsStore.initAllItems(data, installedItemList);
        // 更新已安装程序图标
        const allItems = allServItemsStore.allServItemList;
        installedItemsStore.updateInstalledItemsIcons(allItems);
    } else {
        message.value = "网络源玲珑程序列表获取失败...";
    }
    watchData.netFlag = true;
}
// 监听主进程发送的更新消息
const updateMessage = (_event: any, text: string) => {
    if (text == '检测到新版本，是否选择下载？') {
        ElMessageBox.confirm(text, '提示', {
            confirmButtonText: '下载',
            cancelButtonText: '取消',
            type: 'info',
            center: true,
        }).then(() => {
            message.value = "更新下载中...";
            downloadPercent.value = 0
            ipcRenderer.send('downloadUpdate')
            // //注意：“downloadProgress”事件可能存在无法触发的问题，只需要限制一下下载网速就好了
            ipcRenderer.once('downloadProgress', (_event, progressObj) => {
                downloadPercent.value = parseInt(progressObj.percent || 0)
                downloadPercentMsg.value = "下载进度：" + parseInt(progressObj.percent || 0) + "%";
            })
        }).catch(() => {
            message.value = "版本检测完成...";
            watchData.updateFlag = true;
        })
    } else if (text == '下载完毕，是否立刻更新？'){
        ElMessageBox.confirm(text, '提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'info',
            center: true,
        }).then(() => {
            message.value = "下载完毕，正在更新中...";
            ipcRenderer.send('isUpdateNow');
        }).catch(() => {
            message.value = "版本检测完成...";
            watchData.updateFlag = true;
        })
    } else if (text == '现在使用的就是最新版本，不用更新' || text == '检查更新出错'){
        message.value = "版本检测完成...";
        watchData.updateFlag = true;
    }
}
// 监听message对象，如果等于‘加载完成’，则跳转到主界面
watch(watchData, async (newQuestion, _oldQuestion) => {
    if (newQuestion.archFlag && newQuestion.useFlag && newQuestion.updateFlag && newQuestion.installFlag && newQuestion.netFlag) {
        message.value = "加载完成...";
        downloadPercentMsg.value = "";
        // 延时500毫秒进入
        await new Promise(resolve => setTimeout(resolve, 500));
        // 跳转到主界面
        router.push('/main_view');
    } else {
        ipcRenderer.send('logger', 'error', JSON.stringify(newQuestion));
    }
})
// 加载前执行
onMounted(async () => {
    // 监听命令行执行结果
    ipcRenderer.on('command-result', commandResult);
    // 监听网络请求执行结果
    ipcRenderer.on('network-result', networkResult);
    // 监听自动更新事件
    ipcRenderer.on('update-message', updateMessage);
    // 发送命令，获取当前系统架构
    message.value = "开始环境检测...";
    message.value = "检测当前系统架构...";
    ipcRenderer.send('command', { command: 'uname -m' });
    message.value = "检测是否存在玲珑环境...";
    ipcRenderer.send('command', { command: 'll-cli' });
});
// 销毁前执行
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
    ipcRenderer.removeListener('network-result', networkResult);
    ipcRenderer.removeListener('update-message', updateMessage);
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

.footer {
    position: fixed;
    bottom: 0;
    width: 100%;
}
</style>