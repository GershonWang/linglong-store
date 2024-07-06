<template>
    <div class="containner">
        <a href="https://linglong.dev/" target="_blank">
            <img src="/logo.svg" class="logo" alt="玲珑商店" />
        </a>
        <h1>玲珑应用商店</h1>
        <h3>{{ message }}</h3>
        <h3>{{ downloadPercentMsg }}</h3>
        <div style="text-align: left;">
            <h3 style="color: chocolate;">注意：</h3>
            <p>1.刚程序运行时，会检测当前系统是否满足玲珑环境;如果环境不满足则弹出提示，程序不会进入到后续界面;这里需要您手动安装玲珑环境方可使用。</p>
            <p>2.点击安装时，受网速和程序包大小(本体+依赖)的影响，程序安装比较缓慢甚至可能会没反应，此时请耐心等待一下下。</p>
            <p>3.执行操作时，若出现长时间卡住无反应，或者报错提示时，请使用官方命令行方式进行操作，尝试玲珑基础环境组件是否异常，如无异常，请重启商店重试。</p>
            <p>4.如出现特殊现象，请在商店内-关于程序-意见反馈，进行反馈，或者进入作者gitee仓库提交issue。</p>
        </div>
    </div>
    <div class="footer" v-if="downloadPercent > 0">
        <el-progress :percentage="downloadPercent" :stroke-width="10" status="success" striped striped-flow :duration="10" :show-text="false" />
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessageBox } from 'element-plus';
import { ipcRenderer } from "electron";
import { useRouter } from 'vue-router';
import pkg from '../../package.json';
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { compareVersions } from '@/util/checkVersion';
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
            message.value = "系统架构检测完成...";
            ipcRenderer.send('logger', 'info', "系统架构检测完成...");
            message.value = "检测是否存在玲珑环境...";
            ipcRenderer.send('logger', 'info', "检测是否存在玲珑环境...");
            ipcRenderer.send('command', { command: 'll-cli --help' });
        } else {
            message.value = "系统架构检测异常,当前非Linux环境...";
            ipcRenderer.send('logger', 'error', "系统架构检测异常,当前非Linux环境...");
        }
    }
    if (command == 'll-cli --help') {
        if(code == 'stdout') {
            message.value = "玲珑环境存在...";
            ipcRenderer.send('logger', 'info', "玲珑环境存在...");
            message.value = "检测玲珑环境版本...";
            ipcRenderer.send('logger', 'info', "检测玲珑环境版本...");
            ipcRenderer.send('command', { command: 'll-cli --version' });
            // 获取玲珑包程序(linglong-bin)的版本号
            ipcRenderer.send("command",{ command: 'apt policy linglong-bin' })
            // 获取玲珑包当前使用的仓库名
            ipcRenderer.send("command",{ command: 'll-cli repo show' })
        } else {
            message.value = "检测玲珑环境不存在...";
            ipcRenderer.send('logger', 'error', "检测玲珑环境不存在...");
            ElMessageBox.confirm('当前系统未安装玲珑环境，无法使用当前商店！！请手动安装～', '警告', {
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
    if (command == 'll-cli --version') {
        if(code == 'stdout' && result.trim()) {
            const items: RegExpMatchArray | null = result.trim().match(/'[^']+'|\S+/g);
            if (items && items.length == 3) {
                systemConfigStore.changeLlVersion(items[2]);
            } else {
                systemConfigStore.changeLlVersion('1.3.8');
                ipcRenderer.send('logger', 'error', "非异常返回！1.4.X以前旧版，检测不到版本号，设置默认1.3.8");
            }
        } else {
            systemConfigStore.changeLlVersion('1.3.8');
            ipcRenderer.send('logger', 'error', "异常返回！1.4.X以前旧版，检测不到版本号，设置默认1.3.8");
        }
        message.value = "玲珑环境版本检测完毕...";
        ipcRenderer.send('logger', 'info', "玲珑环境版本检测完毕...");
        message.value = "正在检测系统已安装的玲珑程序...";
        ipcRenderer.send('logger', 'info', "正在检测系统已安装的玲珑程序...");
        if (compareVersions(systemConfigStore.llVersion, '1.4.0') < 0) {
            ipcRenderer.send("command", { command: "ll-cli list | sed 's/\x1b\[[0-9;]*m//g'" });
        } else {
            ipcRenderer.send("command", { command: "ll-cli list --json" });
        }
    }
    if (command =='ll-cli list --json' || command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
        if (code == 'stdout') {
            if (command == 'll-cli list | sed \'s/\x1b\[[0-9;]*m//g\'') {
                installedItemsStore.initInstalledItemsOld(result);
            }
            if (command == 'll-cli list --json') {
                installedItemsStore.initInstalledItems(result);
            }
            message.value = "已安装的玲珑程序检测完成...";
            ipcRenderer.send('logger', 'info', "已安装的玲珑程序检测完成...");
        } else {
            // 网络异常，变更标识
            systemConfigStore.changeNetworkRunStatus(false);
            message.value = "已安装的玲珑程序检测异常...";
            ipcRenderer.send('logger', 'error', "已安装的玲珑程序检测异常...");
        }
        message.value = "正在获取网络源玲珑程序列表...";
        ipcRenderer.send('logger', 'info', "正在获取网络源玲珑程序列表...");
        const baseUrl: string = systemConfigStore.sourceUrl;
        const requestUrl: string = baseUrl.concat('/api/v0/web-store/apps??page=1&size=100000');
        ipcRenderer.send('network', { url: requestUrl });
    }
    if(command == 'apt policy linglong-bin') {
        const lines = result.split('\n');
        let installedVersion = '';
        lines.forEach((line: string) => {
            if (line.includes('已安装：')) {
                installedVersion = line.split('已安装：')[1].trim();
            }
        });
        console.log('已安装版本：', installedVersion);
        systemConfigStore.changeLinglongBinVersion(installedVersion);
    }
    if (command == 'dpkg -l | grep linglong') {
        systemConfigStore.changeDetailMsg(res.result);
    }
    if (command == 'uname -a') {
        systemConfigStore.changeOsVersion(res.result);
    }
    if(command == 'll-cli repo show') {
        const lines = result.split('\n');
        let defaultRepoName = '';
        lines.forEach((line: string) => {
            if (line.includes('Default:')) {
                defaultRepoName = line.split('Default:')[1].trim();
            }
        });
        console.log('默认仓库名：', defaultRepoName);
        systemConfigStore.changeDefaultRepoName(defaultRepoName);
    }
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
            message.value = "新版本更新下载中...";
            ipcRenderer.send('logger', 'info', "新版本更新下载中...");
            downloadPercent.value = 0
            ipcRenderer.send('downloadUpdate')
            // //注意：“downloadProgress”事件可能存在无法触发的问题，只需要限制一下下载网速就好了
            ipcRenderer.on('downloadProgress', (_event, progressObj) => {
                downloadPercent.value = parseInt(progressObj.percent || 0)
                downloadPercentMsg.value = "下载进度：" + parseInt(progressObj.percent || 0) + "%，网速：" + Math.ceil(progressObj.bytesPerSecond / 1000) + " kb/s";
            })
        }).catch(() => {
            message.value = "取消更新，商店版本检测完成...";
            ipcRenderer.send('logger', 'warn', "取消更新，商店版本检测完成...");
            message.value = "检测当前系统架构...";
            ipcRenderer.send('logger', 'info', "检测当前系统架构...");
            ipcRenderer.send('command', { command: 'uname -m' });
        })
    } else if (text == '下载完毕，是否立刻更新？'){
        ElMessageBox.confirm(text, '提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            type: 'info',
            center: true,
        }).then(() => {
            message.value = "下载完毕，正在更新中...";
            ipcRenderer.send('logger', 'info', "下载完毕，正在更新中...");
            ipcRenderer.send('isUpdateNow');
        }).catch(() => {
            message.value = "取消安装，商店版本检测完成...";
            ipcRenderer.send('logger', 'warn', "取消安装，商店版本检测完成...");
            message.value = "检测当前系统架构...";
            ipcRenderer.send('logger', 'info', "检测当前系统架构...");
            ipcRenderer.send('command', { command: 'uname -m' });
        })
    } else if (text == '现在使用的就是最新版本，不用更新' || text == '检查更新出错'){
        message.value = text + ",商店版本检测完成...";
        ipcRenderer.send('logger', 'info', text + ",商店版本检测完成...");
        message.value = "检测当前系统架构...";
        ipcRenderer.send('logger', 'info', "检测当前系统架构...");
        ipcRenderer.send('command', { command: 'uname -m' });
    }
}
// 网络执行返回结果
const networkResult = async (_event: any, res: any) => {
    const code = res.code;
    const data = res.data;
    if (code == 200) {
        message.value = "网络源玲珑程序列表获取完成...";
        ipcRenderer.send('logger', 'info', "网络源玲珑程序列表获取完成...");
        // 设定当前网络状态为可用状态
        systemConfigStore.changeNetworkRunStatus(true);
        // 将请求的数据条数记录到系统参数store中
        systemConfigStore.changeLinglongCount(data.length);
        // 初始化所有应用程序列表
        const installedItemList = installedItemsStore.installedItemList;
        allServItemsStore.initAllItems(data, installedItemList);
        // 更新已安装程序图标
        const allItems = allServItemsStore.allServItemList;
        installedItemsStore.updateInstalledItemsIcons(allItems);
    } else {
        message.value = "网络源玲珑程序列表获取失败...";
        ipcRenderer.send('logger', 'error', "网络源玲珑程序列表获取失败...");
        // 设定当前网络状态为不可用状态
        systemConfigStore.changeNetworkRunStatus(false);
    }
    message.value = "加载完成...";
    ipcRenderer.send('logger', 'info', "加载完成...");
    downloadPercentMsg.value = "";
    ipcRenderer.send('logger', 'info', systemConfigStore.getSystemConfigInfo);
    // 检测当前环境
    const mode = import.meta.env.MODE as string;
    if (mode != "development") {
        // 非开发环境发送通知APP登陆！
        let baseURL = import.meta.env.VITE_SERVER_URL as string;
        ipcRenderer.send('appLogin', { 
            url: baseURL + "/visit/appLogin", 
            llVersion: systemConfigStore.llVersion,
            linglongBinVersion: systemConfigStore.linglongBinVersion,
            detailMsg: systemConfigStore.detailMsg,
            osVersion: systemConfigStore.osVersion,
            defaultRepoName: systemConfigStore.defaultRepoName,
            appVersion: pkg.version 
        })
    }
    // 延时1000毫秒进入
    await new Promise(resolve => setTimeout(resolve, 1000));
    // 跳转到主界面
    router.push('/main_view');
}
// 加载前执行
onMounted(async () => {
    // 开启系统参数中的网络标识
    systemConfigStore.changeNetworkRunStatus(true);
    // 获取指纹码
    const fp = await FingerprintJS.load()
    const result = await fp.get()
    let visitorId = result.visitorId
    systemConfigStore.changeVisitorId(visitorId);
    // 获取组件基本信息
    ipcRenderer.send('command', { command: 'dpkg -l | grep linglong' });
    // 获取系统信息
    ipcRenderer.send('command', { command: 'uname -a' });
    // 开启先检测商店版本号是否有更新
    if (process.env.NODE_ENV != "development") {
        if (systemConfigStore.autoCheckUpdate) {
            message.value = "正在检测商店版本号...";
            ipcRenderer.send('logger', 'info', "正在检测商店版本号...");
            ipcRenderer.send('checkForUpdate');    
        } else {
            message.value = "跳过商店版本号检测...";
            ipcRenderer.send('logger', 'warn', "跳过商店版本号检测...");
            message.value = "开始环境检测...";
            ipcRenderer.send('logger', 'info', "开始环境检测...");
            message.value = "检测当前系统架构...";
            ipcRenderer.send('logger', 'info', "检测当前系统架构...");
            ipcRenderer.send('command', { command: 'uname -m' });
        }
    } else {
        message.value = "开发模式，跳过商店版本号检测...";
        ipcRenderer.send('logger', 'warn', "开发模式，跳过商店版本号检测...");
        message.value = "开始环境检测...";
        ipcRenderer.send('logger', 'info', "开始环境检测...");
        message.value = "检测当前系统架构...";
        ipcRenderer.send('logger', 'info', "检测当前系统架构...");
        ipcRenderer.send('command', { command: 'uname -m' });
    }
    // 监听命令行执行结果
    ipcRenderer.on('command-result', commandResult);
    // 监听网络请求执行结果
    ipcRenderer.on('network-result', networkResult);
    // 监听更新事件
    ipcRenderer.on('update-message', updateMessage);
});
// 销毁前执行
onBeforeUnmount(() => {
    ipcRenderer.removeListener('command-result', commandResult);
    ipcRenderer.removeListener('network-result', networkResult);
    ipcRenderer.removeListener('update-message', updateMessage);
    ipcRenderer.removeAllListeners('downloadProgress');
});
</script>
<style scoped>
.containner {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    width: 90%;
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