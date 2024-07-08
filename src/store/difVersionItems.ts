import { defineStore } from "pinia";
import { ref } from "vue";
import string2card from "@/util/string2card";
import { LocationQuery } from "vue-router";
import hasUpdateVersion from "@/util/checkVersion";
import { useInstalledItemsStore } from "@/store/installedItems";
import { useInstallingItemsStore } from "@/store/installingItems";
import { useSystemConfigStore } from "@/store/systemConfig";
import { CardFace,InstalledEntity } from "@/interface";

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
        let searchVersionItemList: InstalledEntity[] = data.trim() ? JSON.parse(data.trim()) : [];
        if (searchVersionItemList.length > 0) {
            // 过滤不同appId和不是runtime的数据
            searchVersionItemList = searchVersionItemList.filter(item => {
                // 处理主键id标识
                if (item.id) {
                    item.appId = item.id;
                } else if (item.appid) {
                    item.appId = item.appid
                }
                // 处理架构
                if (typeof item.arch === 'string') {
                    item.arch = item.arch
                } else if (Array.isArray(item.arch)) {
                    item.arch = item.arch[0]
                } else {
                    console.log('架构arch字段传入错误',item.arch);
                }
                // 来源仓库
                item.repoName = systemConfigStore.defaultRepoName
                // 处理当前版本是否已安装状态
                item.isInstalled = installedItemsStore.installedItemList.some(it =>
                    it.appId === item.appId && it.name === item.name && it.version === item.version && it.module === item.module 
                    && it.channel === item.channel && it.kind === item.kind && it.repoName === item.repoName
                );
                // 处理当前版本是否加载中状态
                item.loading = installingItemsStore.installingItemList.some(it => it.appId === item.appId && it.name === item.name && it.version === item.version);
                return item && item.appId == query.appId && (item.module == 'runtime' || item.module == 'binary');
            });
            difVersionItemList.value = searchVersionItemList.sort((a, b) => hasUpdateVersion(a.version, b.version));
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