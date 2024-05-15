import { defineStore } from "pinia";
import { ref } from "vue";
import string2card from "@/util/string2card";
import { LocationQuery } from "vue-router";
import hasUpdateVersion, { compareVersions } from "@/util/checkVersion";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { CardFace,InstalledEntity, InstalledSoftware } from "@/interface";

const installedItemsStore = useInstalledItemsStore();
const installingItemsStore = useInstallingItemsStore();
const systemConfigStore = useSystemConfigStore();
/**
 * 不同版本列表
 */
export const useDifVersionItemsStore = defineStore("difVersionItems", () => {

    let difVersionItemList = ref<InstalledEntity[]>([]);

    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initDifVersionItemsOld = (data: string, query: LocationQuery) => {
        clearItems(); // 清空原始对象
        let searchVersionItemList: InstalledEntity[] = [];
        const apps: string[] = data.split('\n');
        if (apps.length > 2) {
            for (let index = 1; index < apps.length - 1; index++) {
                const card: CardFace | null = string2card(apps[index]);
                if (card) {
                    const item: InstalledEntity = card as InstalledEntity;
                    if (item.appId == query.appId && item.module != 'devel') {
                        // 处理当前版本是否已安装状态
                        item.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === item.appId && it.name === item.name && it.version === item.version);
                        // 处理当前版本是否加载中状态
                        item.loading = installingItemsStore.installingItemList.some((it) => it.appId === item.appId && it.name === item.name && it.version === item.version);
                        searchVersionItemList.push(item);
                    }
                }
            }
            difVersionItemList.value = searchVersionItemList.sort((a, b) => hasUpdateVersion(a.version, b.version));
        }
        return difVersionItemList;
    }

    /**
     * 初始化已安装程序数组
     * @param data 待处理的数据
     * @returns 将数据放入后的对象数组
     */
    const initDifVersionItems = (data: string, query: LocationQuery) => {
        clearItems(); // 清空原始对象
        if (systemConfigStore.linglongBinVersion && compareVersions(systemConfigStore.linglongBinVersion, "1.5.0") < 0) {
            let searchVersionItemList: InstalledEntity[] = data.trim() ? JSON.parse(data.trim()) : [];
            if (searchVersionItemList.length > 0) {
                // 过滤不同appId和时devel的数据
                searchVersionItemList = searchVersionItemList.filter(item => item && item.appId == query.appId && item.module != 'devel');
                for (let index = 0; index < searchVersionItemList.length; index++) {
                    const item: InstalledEntity = searchVersionItemList[index];
                    // 处理当前版本是否已安装状态
                    item.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === item.appId && it.name === item.name && it.version === item.version 
                        && it.module === item.module && it.channel === item.channel && it.kind === item.kind && it.repoName === item.repoName);
                    // 处理当前版本是否加载中状态
                    item.loading = installingItemsStore.installingItemList.some((it) => it.appId === item.appId && it.name === item.name && it.version === item.version);
                }
                difVersionItemList.value = searchVersionItemList.sort((a, b) => hasUpdateVersion(a.version, b.version));
            }
        } else {
            const datas: InstalledSoftware[] = data.trim() ? JSON.parse(data.trim()) : [];
            if (datas.length > 0) {
                clearItems();
                let searchVersionItemList: InstalledEntity[] = [];
                datas.forEach((item) => {
                    if (item.appid == query.appId && item.module != 'develop') {
                        const installedItem: InstalledEntity = {
                            appId: item.appid,
                            name: item.name,
                            version: item.version,
                            module: item.module,
                            channel: item.channel,
                            kind: item.kind,
                            repoName: "",
                            arch: item.arch[0],
                            description: item.description,
                            icon: "",
                            runtime: item.runtime,
                            size: String(item.size),
                            uabUrl: "",
                            user: "",
                            isInstalled: false,
                            loading: false
                        }
                        // 处理当前版本是否已安装状态
                        installedItem.isInstalled = installedItemsStore.installedItemList.some((it) => it.appId === item.appid && it.name === item.name && it.version === item.version
                            && it.module === item.module && it.channel === item.channel && it.kind === item.kind
                        )
                        // 处理当前版本是否加载中状态
                        installedItem.loading = installingItemsStore.installingItemList.some((it) => it.appId === item.appid && it.name === item.name && it.version === item.version);
                        searchVersionItemList.push(installedItem);
                    }
                })
                difVersionItemList.value = searchVersionItemList.sort((a, b) => hasUpdateVersion(a.version, b.version));
            }
        }
            
        
        return difVersionItemList;
    }

    /**
     * 新增对象
     * @param item 要新增的对象
     */
    const addItem = (item: InstalledEntity) => {
        difVersionItemList.value.push(item);
    };

    /**
     * 从对象数组中移除对象
     * @param item 要移除的对象
     */
    const removeItem = (item: InstalledEntity) => {
        const index = difVersionItemList.value.findIndex((i) => i.appId === item.appId && i.name === item.name && i.version === item.version);
        if (index !== -1) {
            difVersionItemList.value.splice(index, 1);
        }
    };

    /**
     * 清空所有应用对象列表
     */
    const clearItems = () => {
        difVersionItemList.value.splice(0, difVersionItemList.value.length);
    };

    /**
     * 更新对象的安装状态
     * @param item 要更新的对象
     */
    const updateItemInstallStatus = (item: InstalledEntity) => {
        const index = difVersionItemList.value.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1 && item.isInstalled != undefined) {
            const aItem = difVersionItemList.value[index];
            aItem.isInstalled = item.isInstalled;
            difVersionItemList.value.splice(index, 1, aItem);
        }
    }

    /**
     * 更新对象的加载状态
     * @param item 要更新的对象
     */
    const updateItemLoadingStatus = (item: InstalledEntity, flag: boolean) => {
        const index = difVersionItemList.value.findIndex((it) => it.name === item.name && it.version === item.version && it.appId === item.appId);
        if (index !== -1) {
            const aItem = difVersionItemList.value[index];
            aItem.loading = flag;
            difVersionItemList.value.splice(index, 1, aItem);
        }
    }

    return {
        difVersionItemList,
        initDifVersionItemsOld,
        initDifVersionItems,
        addItem,
        removeItem,
        clearItems,
        updateItemInstallStatus,
        updateItemLoadingStatus,
    };
});