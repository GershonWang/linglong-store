import { ipcRenderer } from 'electron';
import { compareVersions } from './checkVersion';
import { debounce } from './debounce';
import { handleError, ErrorLevel } from './errorHandler';
import { logger } from './logger';
import { deepClone } from './clone';
import { measurePerformanceAsync } from './performance';
import { VERSION_THRESHOLDS, TIMER_INTERVALS } from '@/constants';
import { useInstalledItemsStore } from "@/store/installedItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import type { LinyapsListResult } from '@/types/ipc';

const installedItemsStore = useInstalledItemsStore();
const systemConfigStore = useSystemConfigStore();

// 刷新当前系统有哪些已安装的应用
const _reflushInstalledItems = () => {
    if (compareVersions(systemConfigStore.llVersion, VERSION_THRESHOLDS.MIN_SUPPORTED) >= 0) {
        ipcRenderer.once('linyaps-list-result', async (_event: unknown, res: LinyapsListResult) => {
            await measurePerformanceAsync('刷新已安装列表', async () => {
                const { error, stdout, stderr } = res;
                if (stdout) {
                    try {
                        const { addedItems, removedItems } = await installedItemsStore.initInstalledItems(stdout);
                        if (addedItems.length > 0 || removedItems.length > 0) {
                            const { visitorId, clientIp } = systemConfigStore;
                            const params = {
                                url: `${import.meta.env.VITE_SERVER_URL}/app/saveInstalledRecord`,
                                visitorId,
                                clientIp,
                                addedItems,
                                removedItems
                            };
                            ipcRenderer.send('visit', deepClone(params));
                        }
                    } catch (err) {
                        handleError(err, {
                            level: ErrorLevel.ERROR,
                            logToMain: true,
                        });
                    }
                } else {
                    handleError(`"ll-cli --json list --type=all"命令执行异常::${error || stderr}`, {
                        level: ErrorLevel.ERROR,
                        logToMain: true,
                    });
                }
            });
        });
        ipcRenderer.send('linyaps-list', { command: 'll-cli --json list --type=all' });
    } else {
        logger.warn('当前版本不支持获取应用列表，请使用最新版本的玲珑！');
    }
}

// 使用防抖优化，避免频繁查询
const debouncedReflushInstalledItems = debounce(_reflushInstalledItems, 1000);

// 定时器变量
let installedTimer: NodeJS.Timeout | null = null;

// 启动定时器
export const startInstalledTimer = () => {
    if (installedTimer) {
        clearInterval(installedTimer);
    }
    installedTimer = setInterval(() => debouncedReflushInstalledItems(), TIMER_INTERVALS.INSTALLED_ITEMS);
};

// 立即刷新已安装列表（不使用防抖，用于安装/卸载后立即刷新）
export const reflushInstalledItemsImmediate = (): Promise<void> => {
    return new Promise((resolve) => {
        if (compareVersions(systemConfigStore.llVersion, VERSION_THRESHOLDS.MIN_SUPPORTED) >= 0) {
            ipcRenderer.once('linyaps-list-result', async (_event: unknown, res: LinyapsListResult) => {
                await measurePerformanceAsync('立即刷新已安装列表', async () => {
                    const { error, stdout, stderr } = res;
                    if (stdout) {
                        try {
                            const { addedItems, removedItems } = await installedItemsStore.initInstalledItems(stdout);
                            if (addedItems.length > 0 || removedItems.length > 0) {
                                const { visitorId, clientIp } = systemConfigStore;
                                const params = {
                                    url: `${import.meta.env.VITE_SERVER_URL}/app/saveInstalledRecord`,
                                    visitorId,
                                    clientIp,
                                    addedItems,
                                    removedItems
                                };
                                ipcRenderer.send('visit', deepClone(params));
                            }
                            resolve();
                        } catch (err) {
                            handleError(err, {
                                level: ErrorLevel.ERROR,
                                logToMain: true,
                            });
                            resolve();
                        }
                    } else {
                        handleError(`"ll-cli --json list --type=all"命令执行异常::${error || stderr}`, {
                            level: ErrorLevel.ERROR,
                            logToMain: true,
                        });
                        resolve();
                    }
                });
            });
            ipcRenderer.send('linyaps-list', { command: 'll-cli --json list --type=all' });
        } else {
            resolve();
        }
    });
};

// 导出刷新函数（用于手动调用，使用防抖）
export const reflushInstalledItems = debouncedReflushInstalledItems;

// 启动定时器
startInstalledTimer();

export const cancelInstalledTimer = () => {
    if (installedTimer) {
        clearInterval(installedTimer);
        installedTimer = null;
    }
}
