import { ipcRenderer, IpcRendererEvent } from "electron";
import { ElNotification } from 'element-plus';
import { compareVersions } from "./checkVersion";
import { handleError, ErrorLevel } from './errorHandler';
import { VERSION_THRESHOLDS } from '@/constants';
import { useSystemConfigStore } from "@/store/systemConfig";
import { useInstallingItemsStore } from "@/store/installingItems";
import { StartLoading } from "./ReflushLoading";
import type { InstalledEntity } from "@/interface";
import type { LinyapsSearchResult } from '@/types/ipc';

const systemConfigStore = useSystemConfigStore();
const installingItemsStore = useInstallingItemsStore();
// 玲珑组件版本
let llVersion = systemConfigStore.llVersion;

const isInstalledEntity = (value: unknown): value is InstalledEntity => {
    return !!value && typeof value === 'object' && 'version' in value;
};

const customProtocolResult = (_event: IpcRendererEvent, res: string) => {
    // 玲珑本地包安装
    if (res.endsWith('.layer') || res.endsWith('.uab')) {
        const temp = res.split('/');
        const fileName = temp[temp.length - 1];
        ipcRenderer.once('linyapss-package-result', (_event: IpcRendererEvent, packageRes: { code: string; result: string }) => {
            const { code, result } = packageRes;
            if (code === 'stdout' && result.includes('successfully')) {
                ElNotification({ 
                    title: '恭喜', 
                    message: `${fileName}本地包安装成功！`, 
                    type: 'success', 
                    duration: 500 
                });
            } else {
                handleError(`${fileName}本地包安装失败！`, {
                    level: ErrorLevel.ERROR,
                    showNotification: true,
                    title: '提示',
                    showMessage: false,
                });
            }
        });
        ipcRenderer.send('linyapss-package', { command: `ll-cli install ${res}` });
        ElNotification({ 
            title: '提示', 
            message: `${fileName}本地包正在安装中，请稍等...`, 
            type: 'info', 
            duration: 5000 
        });
    }
    // 自定义协议安装
    if (res.startsWith('linyaps://')) {
        const temp = res.split('://');
        if (temp.length !== 2) {
            handleError(`自定义协议格式错误：${res}`, {
                level: ErrorLevel.ERROR,
                logToMain: true,
            });
            return;
        }
        const path = temp[1].split('/');
        if (path[0] === 'install' && path.length > 1) {
            const appId = path[1];
            ipcRenderer.once('linyaps-search-result', (_event: IpcRendererEvent, searchRes: LinyapsSearchResult) => {
                const { stdout } = searchRes;
                if (stdout) {
                    // 创建一个数组集合
                    let searchVersionItemList: unknown[] = [];
                    // 版本小于1.9.0时
                    if (compareVersions(llVersion, VERSION_THRESHOLDS.STABLE_VERSION) < 0) {
                        searchVersionItemList = stdout.trim() ? JSON.parse(stdout.trim()) : [];
                    } else {
                        // 版本大于等于1.9.0时,取stable版本
                        const items = stdout ? JSON.parse(stdout) : null;
                        if (items && typeof items === 'object' && !Array.isArray(items)) {
                            searchVersionItemList = Object.keys(items).length > 0 ? (items as Record<string, unknown[]>).stable || [] : [];
                        }
                    }
                    if (Array.isArray(searchVersionItemList) && searchVersionItemList.length > 0) {
                        const validItems = searchVersionItemList.filter(isInstalledEntity);
                        if (validItems.length === 0) {
                            ElNotification({ 
                                title: '提示', 
                                message: `未找到${appId}的最新版本`, 
                                type: 'warning', 
                                duration: 1000 
                            });
                            return;
                        }

                        const arr = validItems.sort((a, b) => compareVersions(b.version, a.version));
                        const item = arr[0];
                        StartLoading(item); // 启动按钮的加载状态
                        // 新增到加载中列表
                        installingItemsStore.addItem(item); 
                        ElNotification({ 
                            title: '提示', 
                            message: `正在安装${item.name || appId}(${item.version})`, 
                            type: 'info', 
                            duration: 500 
                        });
                    } else {
                        ElNotification({ 
                            title: '提示', 
                            message: `未找到${appId}的最新版本`, 
                            type: 'warning', 
                            duration: 1000 
                        });
                    }
                }
            });
            let command = `ll-cli --json search ${appId}`;
            if (compareVersions(llVersion, VERSION_THRESHOLDS.MIN_SUPPORTED) >= 0 && compareVersions(llVersion, VERSION_THRESHOLDS.SEARCH_ALL_SUPPORT) < 0) {
                command += ` --type=all`;
            } else if (compareVersions(llVersion, VERSION_THRESHOLDS.SEARCH_ALL_SUPPORT) >= 0 && compareVersions(llVersion, VERSION_THRESHOLDS.SHOW_ALL_VERSION) < 0) {
                command += ` --all`;
            } else if (compareVersions(llVersion, VERSION_THRESHOLDS.SHOW_ALL_VERSION) >= 0) {
                command += ` --show-all-version`;
            }
            ipcRenderer.send("linyaps-search", { command });
        }
    }
}

export function setupCustomProtocol() {
    ipcRenderer.on('custom-protocol', customProtocolResult);
}

export function removeCustomProtocol() {
    ipcRenderer.removeListener('custom-protocol', customProtocolResult);
}
