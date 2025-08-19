<template>
    <div class="start-containner">
        <a href="https://www.linglong.space/" target="_blank">
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
    <div class="download-footer" v-if="downloadPercent > 0">
        <el-progress :percentage="downloadPercent" :stroke-width="10" status="success" striped striped-flow
            :duration="10" :show-text="false" />
    </div>
    <NoLinyapsEnvDialog :visible="centerDialogVisible" />
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessageBox } from 'element-plus';
import { ipcRenderer } from "electron";
import { useRouter } from 'vue-router';
import NoLinyapsEnvDialog from '@/components/NoLinyapsEnvDialog.vue';
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { useSystemConfigStore } from "@/store/systemConfig";
import { categoryItem, execEntity } from '@/interface';
import { compareVersions } from '@/util/checkVersion';

const systemConfigStore = useSystemConfigStore();

// 获取路由对象
const router = useRouter();
// 提示信息
const message = ref('');
// 进度条状态
const downloadPercent = ref(0);
const downloadPercentMsg = ref('');
// 环境检测
const centerDialogVisible = ref(false);

// 提取消息弹窗逻辑
const showConfirmDialog = async (message: string, confirmText: string, cancelText: string) => {
    try {
        await ElMessageBox.confirm(message, '提示', { confirmButtonText: confirmText, cancelButtonText: cancelText, type: 'info', center: true });
        return true;
    } catch {
        return false;
    }
};

// 监听主进程发送的更新消息
const updateMessage = async (_event: any, text: string) => {
    if (text == '检测到新版本，是否选择下载？') {
        const confirmed = await showConfirmDialog(text, '下载', '取消');
        if (confirmed) {
            message.value = "新版本更新下载中...";
            ipcRenderer.send('logger', 'info', "新版本更新下载中...");
            downloadPercent.value = 0;
            ipcRenderer.send('downloadUpdate');
            // 注意：“downloadProgress”事件可能存在无法触发的问题，只需要限制一下下载网速就好了
            ipcRenderer.on('downloadProgress', (_event, progressObj) => {
                downloadPercent.value = parseInt(progressObj.percent || 0);
                downloadPercentMsg.value = `下载进度：${downloadPercent.value}%，网速：${Math.ceil(progressObj.bytesPerSecond / 1000)} kb/s`;
            });
        } else {
            message.value = "取消更新，商店版本检测完成...";
            ipcRenderer.send('logger', 'warn', "取消更新，商店版本检测完成...");
            await startEnvCheck();
        }
    } else if (text == '下载完毕，是否立刻更新？') {
        const confirmed = await showConfirmDialog(text, '确认', '取消');
        if (confirmed) {
            message.value = "下载完毕，正在更新中...";
            ipcRenderer.send('logger', 'info', "下载完毕，正在更新中...");
            ipcRenderer.send('isUpdateNow');
        } else {
            message.value = "取消更新，商店版本检测完成...";
            ipcRenderer.send('logger', 'warn', "取消更新，商店版本检测完成...");
            await startEnvCheck();
        }
    } else if (text == '现在使用的就是最新版本，不用更新' || text == '检查更新出错') {
        message.value = `${text}, 商店版本检测完成...`;
        ipcRenderer.send('logger', 'info', `${text}, 商店版本检测完成...`);
        await startEnvCheck();
    }
}
// 环境检测开始阶段
const startEnvCheck = async () => {
    // 获取系统信息
    message.value = "准备开始环境检测...";
    ipcRenderer.send('logger', 'info', "准备开始环境检测...");
    await new Promise((resolve) => {
        ipcRenderer.once('uname-a-result', (_event: any, res: execEntity) => {
            systemConfigStore.changeOsVersion(res.stdout);
            resolve(res);
        });
        ipcRenderer.send('uname-a');
    });
    
    // 获取系统架构
    message.value = "检测当前系统架构...";
    ipcRenderer.send('logger', 'info', "检测当前系统架构...");
    await new Promise((resolve, reject) => {
        ipcRenderer.once('uname-m-result', (_event: any, res: execEntity) => {
            const { stdout, stderr, error } = res;
            if (error || stderr) {
                message.value = "系统架构检测异常,当前非Linux环境...";
                ipcRenderer.send('logger', 'error', "系统架构检测异常,当前非Linux环境...");
                reject(new Error(error || stderr));
                return;
            }
            systemConfigStore.changeArch(stdout.trim());
            message.value = "系统架构检测完成...";
            ipcRenderer.send('logger', 'info', "系统架构检测完成...");
            resolve(res);
        });
        ipcRenderer.send('uname-m');
    });
    
    // 获取组件基本信息
    await new Promise((resolve) => {
        ipcRenderer.once('dpkg-linyaps-result', (_event: any, res: execEntity) => {
            systemConfigStore.changeDetailMsg(res.stdout);
            resolve(res);
        });
        ipcRenderer.send('dpkg-linyaps');
    });
    
    // 获取玲珑包核心程序(linglong-bin)的版本号
    await new Promise((resolve) => {
        ipcRenderer.once('apt-linyaps-bin-result', (_event: any, res: execEntity) => {
            const { stdout } = res;
            if (stdout) {
                const lines = stdout.split('\n');
                let installedVersion = '';
                lines.forEach((line: string) => {
                    if (line.includes('已安装：')) {
                        installedVersion = line.split('已安装：')[1].trim();
                    } else if (line.trim().startsWith('Installed:')) {
                        installedVersion = line.split('Installed:')[1].trim();
                    }
                });
                ipcRenderer.send('logger', 'info', '已安装版本：' + installedVersion);
                systemConfigStore.changeLlBinVersion(installedVersion);
            }
            resolve(res);
        });
        ipcRenderer.send('apt-linyaps-bin');
    });
    
    // 检查是否存在玲珑环境
    message.value = "检测玲珑基础环境是否存在...";
    ipcRenderer.send('logger', 'info', "检测玲珑基础环境是否存在...");
    await new Promise((resolve, reject) => {
        ipcRenderer.once('linyaps-exist-result', (_event: any, res: execEntity) => {
            const { stdout, stderr, error } = res;
            if ( error || stderr) {
                message.value = "检测玲珑基础环境不存在...";
                ipcRenderer.send('logger', 'error', `检测玲珑基础环境不存在...${error || stderr}`);
                centerDialogVisible.value = true; // 显示弹窗
                reject(new Error(error || stderr));
                return;
            }
            message.value = "玲珑基础环境已存在...";
            ipcRenderer.send('logger', 'info', `玲珑基础环境已存在...${stdout}`);
            resolve(res);
        });
        ipcRenderer.send('linyaps-exist');
    });
    
    // 获取玲珑包当前使用的仓库名
    await new Promise((resolve, reject) => {
        ipcRenderer.once('linyaps-repo-result', (_event: any, res: execEntity) => {
            const { stdout, stderr, error } = res;
            if ( error || stderr) {
                message.value = "检测玲珑仓库信息异常...";
                ipcRenderer.send('logger', 'error', `检测玲珑仓库信息异常...${error || stderr}`);
                centerDialogVisible.value = true; // 显示弹窗
                reject(new Error(error || stderr));
                return;
            }
            ipcRenderer.send('logger', 'info', `当前玲珑基础环境使用的仓库源...${JSON.stringify(stdout)}`);
            const json = JSON.parse(JSON.stringify(stdout));
            const defaultRepo = json.defaultRepoName;
            ipcRenderer.send('logger', 'info', `当前玲珑基础环境使用的默认仓库为：${defaultRepo}`);
            systemConfigStore.changeDefaultRepoName(defaultRepo);
            const repos = json.repos;
            ipcRenderer.send('logger', 'info', `当前玲珑基础环境使用的仓库源列表为：${JSON.stringify(repos)}`);
            systemConfigStore.changeSourceUrl(repos);
            resolve(res);
        });
        ipcRenderer.send('linyaps-repo');
    });
        
    // 检测玲珑基础环境版本号    
    message.value = "检测玲珑基础环境版本号...";
    ipcRenderer.send('logger', 'info', "检测玲珑基础环境版本号...");
    await new Promise((resolve, reject) => {
        ipcRenderer.once('linyaps-version-result', async (_event: any, res: execEntity) => {
            const { stdout, stderr, error } = res;
            if (error || stderr) {
                message.value = "检测玲珑基础环境版本号异常...";
                ipcRenderer.send('logger', 'error', `检测玲珑基础环境版本号异常...${error || stderr}`);
                centerDialogVisible.value = true; // 显示弹窗
                reject(new Error(error || stderr));
                return;
            }
            ipcRenderer.send('logger', 'info', `检测玲珑基础环境版本号...${stdout}`);
            systemConfigStore.changeLlVersion(stdout);
            if (!systemConfigStore.llVersion || compareVersions(systemConfigStore.llVersion, "1.5.0") < 0) {
                message.value = "当前玲珑基础环境版本号过低(<1.5.0)或不存在，请安装最新版本的玲珑环境！";
                ipcRenderer.send('logger', 'error', "当前玲珑基础环境版本号过低(<1.5.0)或不存在，请安装最新版本的玲珑环境！");
                centerDialogVisible.value = true; // 显示弹窗
                reject(new Error('版本过低'));
                return;
            }
            message.value = "玲珑基础环境版本号检测完毕...";
            ipcRenderer.send('logger', 'info', "玲珑基础环境版本号检测完毕...");
            downloadPercentMsg.value = "";
            ipcRenderer.send('logger', 'info', systemConfigStore.getSystemConfigInfo);
            // 检测当前环境(非开发环境发送通知APP登陆！)
            if (process.env.NODE_ENV != "development") {
                const { appVersion, llVersion, llBinVersion, detailMsg, osVersion, defaultRepoName, visitorId, clientIp, arch } = systemConfigStore;
                ipcRenderer.send('appLogin', {
                    url: `${import.meta.env.VITE_SERVER_URL}/app/saveVisitRecord`, 
                    appVersion, clientIp, arch, llVersion, llBinVersion, detailMsg, 
                    osVersion, repoName: defaultRepoName, visitorId
                });
            }
            // 延时1000毫秒进入
            await new Promise(resolve => setTimeout(resolve, 1000));
            // 跳转到主界面
            router.push('/main_view');
            resolve(res);
        });
        // 执行命令获取版本号
        ipcRenderer.send('linyaps-version');
    });
    
}


// 加载前执行
onMounted(async () => {
    // 设置ipc监听器
    ipcRenderer.on('update-message', updateMessage);
    // 获取客户端版本号
    await new Promise((resolve) => {
        ipcRenderer.once('app-version-result', (_event: any, version: string) => {
            ipcRenderer.send('logger', 'info', '客户端版本号：' + version);
            systemConfigStore.changeAppVersion(version);
            resolve(version);
        })
        ipcRenderer.send('app-version');
    });
    
    // 获取指纹码
    const result = await (await FingerprintJS.load()).get();
    systemConfigStore.changeVisitorId(result.visitorId);

    // 获取客户端ip
    await new Promise((resolve) => {
        ipcRenderer.once('fetchClientIP-result', (_event: any, res: any) => {
            systemConfigStore.changeClientIp(res.data.query || '');
            resolve(res);
        });
        ipcRenderer.send('fetchClientIP');
    });
    
    // 获取分类列表
    await new Promise((resolve) => {
        ipcRenderer.once('categories-result', (_event: any, res: any) => {
            const categories = [{ "categoryId": "", "categoryName": "全部程序" }] as categoryItem[];
            if (res.code == 200) {
                const categoriesByIpc = (res.data as categoryItem[]).map(({ categoryId, categoryName }) => ({ categoryId, categoryName }));
                categories.push(...categoriesByIpc);
            } else {
                ipcRenderer.send('logger', 'error', "获取分类列表的接口状态异常...");
            }
            localStorage.setItem('categories', JSON.stringify(categories));
            resolve(res);
        });
        ipcRenderer.send('ipc-categories', { url: import.meta.env.VITE_SERVER_URL });
    });
    
    // 判断是否是开发模式，跳出版本检测
    if (process.env.NODE_ENV != "development" && systemConfigStore.autoCheckUpdate) {
        message.value = "正在检测商店版本号...";
        ipcRenderer.send('logger', 'info', "正在检测商店版本号...");
        ipcRenderer.send('checkForUpdate');
        return;
    } else if (process.env.NODE_ENV == "development") {
        message.value = "开发模式，跳过商店版本号检测...";
        ipcRenderer.send('logger', 'info', "开发模式，跳过商店版本号检测...");
    } else {
        message.value = "跳过商店版本号检测...";
        ipcRenderer.send('logger', 'info', "跳过商店版本号检测...");
    }
    await startEnvCheck();
});
// 销毁前执行
onBeforeUnmount(() => {
    ipcRenderer.removeListener('update-message', updateMessage);
    ipcRenderer.removeAllListeners('downloadProgress');
});
</script>