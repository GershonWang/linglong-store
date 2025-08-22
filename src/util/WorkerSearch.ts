import { ipcRenderer } from "electron";
import { compareVersions } from "./checkVersion";

import { useSystemConfigStore } from "@/store/systemConfig";
import { useDifVersionItemsStore } from "@/store/difVersionItems";
import { ref } from "vue";

const systemConfigStore = useSystemConfigStore();
const difVersionItemsStore = useDifVersionItemsStore();
// 玲珑组件版本
let llVersion = systemConfigStore.llVersion;
// 加载状态
export let loading = ref(true);

// 根据appId查询玲珑应用版本列表
export const searchLinyapsByAppId = (appId: string) => {
    loading.value = true; // 列表查询时加载状态启动
    ipcRenderer.once('linyaps-search-result', (_event: any, res: any) => {
        const { error, stdout, stderr } = res;
        if (error || stderr) {
            loading.value = false;
            ipcRenderer.send('logger', 'error', `获取版本列表失败: ${error || stderr}`);
            ElNotification({ title: '提示', message: "获取版本列表失败，请稍后重试", type: 'error', duration: 500 });
            return;
        }
        // 创建一个数组集合
        let searchVersionItemList: any[] = [];
        // 版本小于1.9.0时
        if (compareVersions(llVersion, '1.9.0') < 0) {
            searchVersionItemList = stdout.trim() ? JSON.parse(stdout.trim()) : [];
        } else { // 版本大于等于1.9.0时,取stable版本
            const repoName = systemConfigStore.defaultRepoName || "stable";
            const items = stdout ? JSON.parse(stdout) : null;
            searchVersionItemList = Object.keys(items).length > 0 ? items[repoName] : [];
        }
        difVersionItemsStore.initDifVersionItems(searchVersionItemList, appId as string);
        loading.value = false;
    });

    // 执行查询命令
    let command = `ll-cli --json search ${appId}`;
    if (compareVersions(llVersion, '1.5.0') >= 0 && compareVersions(llVersion, '1.7.7') < 0) {
        if (systemConfigStore.isShowBaseService) {
            command += ` --type=all`;
        }
    } else if (compareVersions(llVersion, '1.7.7') >= 0 && compareVersions(llVersion, '1.8.3') < 0) {
        command += ` --all`;
    } else if (compareVersions(llVersion, '1.8.3') >= 0) {
        command += ` --show-all-version`;
    }
    ipcRenderer.send("linyaps-search", { command });
}