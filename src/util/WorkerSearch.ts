import { ipcRenderer, IpcRendererEvent } from "electron";
import { compareVersions } from "./checkVersion";
import { handleError, ErrorLevel } from './errorHandler';
import { VERSION_THRESHOLDS } from '@/constants';
import { useSystemConfigStore } from "@/store/systemConfig";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { ref } from "vue";
import { ElNotification } from 'element-plus';
import type { LinyapsSearchResult } from '@/types/ipc';

const systemConfigStore = useSystemConfigStore();
const difVersionItemsStore = useDifVersionItemsStore();
// 玲珑组件版本
let llVersion = systemConfigStore.llVersion;
// 加载状态
export let loading = ref(true);

// 根据appId查询玲珑应用版本列表
export const searchLinyapsByAppId = (appId: string) => {
    loading.value = true; // 列表查询时加载状态启动
    ipcRenderer.once('linyaps-search-result', (_event: IpcRendererEvent, res: LinyapsSearchResult) => {
        const { error, stdout, stderr } = res;
        if (error || stderr) {
            loading.value = false;
            handleError(`获取版本列表失败: ${error || stderr}`, {
                level: ErrorLevel.ERROR,
                showNotification: true,
                title: '提示',
                showMessage: false,
            });
            return;
        }
        // 创建一个数组集合
        let searchVersionItemList: unknown[] = [];
        // 版本小于1.9.0时
        if (compareVersions(llVersion, VERSION_THRESHOLDS.STABLE_VERSION) < 0) {
            searchVersionItemList = stdout.trim() ? JSON.parse(stdout.trim()) : [];
        } else { // 版本大于等于1.9.0时,取stable版本
            const repoName = systemConfigStore.defaultRepoName || "stable";
            const items = stdout ? JSON.parse(stdout) : null;
            if (items && typeof items === 'object' && !Array.isArray(items)) {
                searchVersionItemList = Object.keys(items).length > 0 ? (items as Record<string, unknown[]>)[repoName] || [] : [];
            }
        }
        difVersionItemsStore.initDifVersionItems(searchVersionItemList as any[], appId);
        loading.value = false;
    });

    // 执行查询命令
    let command = `ll-cli --json search ${appId}`;
    if (compareVersions(llVersion, VERSION_THRESHOLDS.MIN_SUPPORTED) >= 0 && compareVersions(llVersion, VERSION_THRESHOLDS.SEARCH_ALL_SUPPORT) < 0) {
        if (systemConfigStore.isShowBaseService) {
            command += ` --type=all`;
        }
    } else if (compareVersions(llVersion, VERSION_THRESHOLDS.SEARCH_ALL_SUPPORT) >= 0 && compareVersions(llVersion, VERSION_THRESHOLDS.SHOW_ALL_VERSION) < 0) {
        command += ` --all`;
    } else if (compareVersions(llVersion, VERSION_THRESHOLDS.SHOW_ALL_VERSION) >= 0) {
        command += ` --show-all-version`;
    }
    ipcRenderer.send("linyaps-search", { command });
}
