import { ipcRenderer, IpcRendererEvent } from 'electron';
import { compareVersions } from '@/util/checkVersion';
import { ElNotification } from 'element-plus';
import { handleError, ErrorLevel } from './errorHandler';
import { VERSION_THRESHOLDS } from '@/constants';
import { reflushInstalledItems, reflushInstalledItemsImmediate } from '@/util/WorkerInstalled';
import { reflushUpdateItems } from "@/util/WorkerUpdate";
import { searchLinyapsByAppId } from '@/util/WorkerSearch';
import { StopLoading } from './ReflushLoading';
import type { LinyapsInstallResult, LinyapsUninstallResult } from '@/types/ipc';
import { InstalledEntity } from '@/interface';

import { useAllAppItemsStore } from "@/store/allAppItems";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { useUpdateItemsStore } from "@/store/updateItems";
import { useUpdateStatusStore } from "@/store/updateStatus";

const allAppItemsStore = useAllAppItemsStore();
const difVersionItemsStore = useDifVersionItemsStore();
const installingItemsStore = useInstallingItemsStore();
const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();
const updateItemsStore = useUpdateItemsStore();
const updateStatusStore = useUpdateStatusStore();

export let installingItems = installingItemsStore.installingItemList; // 安装队列

let downloadLogMsg: string[] = []; // 下载日志

const handleLinyapsInstallResult = (_event: IpcRendererEvent, res: LinyapsInstallResult) => {
    const { params, code, result } = res;
    const resultStr = String(result);
    downloadLogMsg.push(resultStr); // 安装信息
    if (code === 'stdout') {
        // 处理安装进度
        let schedule = resultStr.substring(resultStr.lastIndexOf(':') + 1, resultStr.lastIndexOf('%') + 1);
        if (compareVersions(systemConfigStore.llVersion, VERSION_THRESHOLDS.UPDATE_LIST_SUPPORT) < 0) {
            schedule = resultStr.split(' ')[0];
        }
        const index = installingItems.findIndex(it => it.appId === params.appId && it.version === params.version);
        if (index !== -1) {
            const aItem = installingItems[index];
            aItem.schedule = schedule;
            installingItems.splice(index, 1, aItem);
        }
    } else if (code === 'close') {
        installingItemsStore.removeItem(params as InstalledEntity); // 1.从加载列表中移除
        StopLoading(params as InstalledEntity); // 停用按钮的加载状态
        // 重置下载队列状态，允许处理下一个安装任务
        updateStatusStore.changeDownloadQueueStatus(false);
        if (resultStr === '0') {
            // 先更新当前版本的安装状态
            allAppItemsStore.updateItemInstallStatus(params as InstalledEntity, true);
            difVersionItemsStore.updateItemInstallStatus(params as InstalledEntity, true);
            
            // 检查是否有旧版本需要更新状态（安装新版本时，旧版本会被卸载）
            const installedItems: InstalledEntity[] = installedItemsStore.installedItemList.filter(
                (item: InstalledEntity) => item.appId === params.appId && item.version !== params.version
            );
            installedItems.forEach((oldItem: InstalledEntity) => {
                allAppItemsStore.updateItemInstallStatus(oldItem, false);
                difVersionItemsStore.updateItemInstallStatus(oldItem, false);
            });
            
            // 立即刷新已安装列表，等待完成后再刷新版本列表
            reflushInstalledItemsImmediate().then(() => {
                // 刷新更新列表（会自动过滤掉已更新的应用）
                reflushUpdateItems();
                // 刷新版本列表（此时已安装列表已更新）
                searchLinyapsByAppId(params.appId);
            });
            
            // 安装或卸载成功后，弹出通知
            ElNotification({ 
                title: '安装成功!', 
                type: 'success', 
                duration: 500, 
                message: `${params.name || params.appId}(${params.version})被成功安装!` 
            });
        } else {
            const msg = downloadLogMsg.length > 2 ? downloadLogMsg[downloadLogMsg.length - 2] : '';
            handleError(msg || '安装失败', {
                level: ErrorLevel.ERROR,
                showNotification: true,
                title: '操作异常!',
            });
        }
        downloadLogMsg = []; // 清除当前程序安装的日志记录
    } else if (code === 'error' || code === 'stderr') {
        // 处理安装错误，重置状态并移除失败的应用
        installingItemsStore.removeItem(params as InstalledEntity); // 从加载列表中移除
        StopLoading(params as InstalledEntity); // 停用按钮的加载状态
        // 重置下载队列状态，允许处理下一个安装任务
        updateStatusStore.changeDownloadQueueStatus(false);
        const msg = downloadLogMsg.length > 0 ? downloadLogMsg[downloadLogMsg.length - 1] : resultStr;
        handleError(msg || '安装失败', {
            level: ErrorLevel.ERROR,
            showNotification: true,
            title: '安装失败!',
        });
        downloadLogMsg = []; // 清除当前程序安装的日志记录
    }
}

const handleLinyapsUninstallResult = (_event: IpcRendererEvent, res: LinyapsUninstallResult) => {
    const { params, result, code } = res;
    if (code !== 'stdout') {
        StopLoading(params as InstalledEntity); // 停用按钮的加载状态
        handleError(`${params.name || params.appId}(${params.version})卸载失败!`, {
            level: ErrorLevel.ERROR,
            showNotification: true,
            title: '卸载失败!',
            logToMain: true,
        });
        return;
    }
    difVersionItemsStore.updateItemInstallStatus(params as InstalledEntity, false);
    allAppItemsStore.updateItemInstallStatus(params as InstalledEntity, false);
    StopLoading(params as InstalledEntity); // 停用按钮的加载状态
    
    // 立即刷新已安装列表，等待完成后再刷新版本列表
    reflushInstalledItemsImmediate().then(() => {
        // 刷新更新列表
        reflushUpdateItems();
        // 刷新版本列表（此时已安装列表已更新）
        searchLinyapsByAppId(params.appId);
    });
    
    // 弹出通知
    ElNotification({ 
        title: '卸载成功!', 
        type: 'success', 
        duration: 500, 
        message: `${params.name || params.appId}(${params.version})被成功卸载!`
    });
}

export const setupIpcListeners = () => {
    ipcRenderer.on('linyaps-install-result', handleLinyapsInstallResult);
    ipcRenderer.on('linyaps-uninstall-result', handleLinyapsUninstallResult);
}

export const cleanupIpcListeners = () => {
    ipcRenderer.removeListener('linyaps-install-result', handleLinyapsInstallResult);
    ipcRenderer.removeListener('linyaps-uninstall-result', handleLinyapsUninstallResult);
}