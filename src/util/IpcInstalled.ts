import { ipcRenderer } from 'electron';
import { compareVersions } from '@/util/checkVersion';
import { ElNotification } from 'element-plus'
import { reflushInstalledItems } from '@/util/WorkerInstalled';
import { reflushUpdateItems } from "@/util/WorkerUpdate";
import { searchLinyapsByAppId } from '@/util/WorkerSearch';
import { StopLoading } from './ReflushLoading';

import { useAllAppItemsStore } from "@/store/allAppItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useUpdateStatusStore } from "@/store/updateStatus";

const allAppItemsStore = useAllAppItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();
const updateItemsStore = useUpdateItemsStore();
const updateStatusStore = useUpdateStatusStore();

export let installingItems = installingItemsStore.installingItemList; // 安装队列

let downloadLogMsg: string[] = []; // 下载日志

const handleLinyapsInstallResult = (_event: any, res: any) => {
    let { params, code, result } = res;
    downloadLogMsg.push(result); // 安装信息
    if (code == 'stdout') {
        // 处理安装进度
        let schedule = result.substring(result.lastIndexOf(':') + 1, result.lastIndexOf('%') + 1);
        if (compareVersions(systemConfigStore.llVersion,'1.7.0') < 0) {
            schedule = result.split(' ')[0];
        }
        const index = installingItems.findIndex(it => it.appId === params.appId && it.version === params.version);
        if (index !== -1) {
            const aItem = installingItems[index];
            aItem.schedule = schedule;
            installingItems.splice(index, 1, aItem);
        }
    } else if (code == 'close') {
        installingItemsStore.removeItem(params); // 1.从加载列表中移除
        StopLoading(params); // 停用按钮的加载状态
        // 重置下载队列状态，允许处理下一个安装任务
        updateStatusStore.changeDownloadQueueStatus(false);
        if (result == '0') {
            allAppItemsStore.updateItemInstallStatus(params, true);
            difVersionItemsStore.updateItemInstallStatus(params, true);
            reflushInstalledItems(); // 刷新已安装的应用列表
            reflushUpdateItems(); // 刷新更新列表
            updateItemsStore.removeItem(params); // 2.从更新列表中移除
            searchLinyapsByAppId(params.appId); // 刷新版本列表
            // 安装或卸载成功后，弹出通知
            ElNotification({ title: '安装成功!', type: 'success', duration: 500, message: `${params.name}(${params.version})被成功安装'!` });
        } else {
            const msg = downloadLogMsg.length > 2 ? downloadLogMsg[downloadLogMsg.length - 2] : '';
            ElNotification({ title: '操作异常!', message: `<span style="color: red;">${msg}</span><br>`, type: 'error', duration: 5000, dangerouslyUseHTMLString: true });
        }
        downloadLogMsg = []; // 清除当前程序安装的日志记录
    } else if (code == 'error' || code == 'stderr') {
        // 处理安装错误，重置状态并移除失败的应用
        installingItemsStore.removeItem(params); // 从加载列表中移除
        StopLoading(params); // 停用按钮的加载状态
        // 重置下载队列状态，允许处理下一个安装任务
        updateStatusStore.changeDownloadQueueStatus(false);
        const msg = downloadLogMsg.length > 0 ? downloadLogMsg[downloadLogMsg.length - 1] : result;
        ElNotification({ title: '安装失败!', message: `<span style="color: red;">${msg}</span><br>`, type: 'error', duration: 5000, dangerouslyUseHTMLString: true });
        downloadLogMsg = []; // 清除当前程序安装的日志记录
    }
}

const handleLinyapsUninstallResult = (_event: any, res: any) => {
    const { params, result, code } = res;
    if (code != 'stdout') {
        StopLoading(params); // 停用按钮的加载状态
        ElNotification({ title: '卸载失败!', type: 'error', duration: 5000, message: `${params.name}(${params.version})卸载失败!`});
        ipcRenderer.send('logger', 'error', `"${params.command}"命令执行异常::${result}`);
        return;
    }
    difVersionItemsStore.updateItemInstallStatus(params, false);
    allAppItemsStore.updateItemInstallStatus(params, false);
    StopLoading(params); // 停用按钮的加载状态
    reflushInstalledItems(); // 刷新已安装的应用列表
    reflushUpdateItems(); // 刷新更新列表
    searchLinyapsByAppId(params.appId); // 刷新版本列表
    // 弹出通知
    ElNotification({ title: '卸载成功!', type: 'success', duration: 500, message: `${params.name}(${params.version})被成功卸载!`});
}

export const setupIpcListeners = () => {
    ipcRenderer.on('linyaps-install-result', handleLinyapsInstallResult);
    ipcRenderer.on('linyaps-uninstall-result', handleLinyapsUninstallResult);
}

export const cleanupIpcListeners = () => {
    ipcRenderer.removeListener('linyaps-install-result', handleLinyapsInstallResult);
    ipcRenderer.removeListener('linyaps-uninstall-result', handleLinyapsUninstallResult);
}